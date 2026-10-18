import io
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, Query, Body
from fastapi.responses import Response, JSONResponse
from pydantic import BaseModel
import pandas as pd
import numpy as np

from app.core.config import (
    SYNTHETIC_DATA_DIR, 
    UPLOAD_DATA_DIR, 
    EXPORT_DATA_DIR,
    DEFAULT_CONFIDENCE_LEVEL,
    DEFAULT_UNDERSTOCK_COST,
    DEFAULT_OVERSTOCK_COST,
    STORE_CLUSTERS
)
from app.data.validator import DataValidator
from app.data.generator import generate_synthetic_benchmark
from app.models.forecasting import ForecastingEngine
from app.models.uncertainty import CalibratedConformalEngine
from app.models.inventory import NewsvendorOptimizer
from app.models.explainability import ExplainabilityEngine
from app.models.evaluation import BenchmarkEvaluator
from app.models.risk import RiskAnalyzer
from app.models.allocation import StoreClusterAllocator
from app.db import shop_storage

router = APIRouter(prefix="/api")

# In-memory application state
APP_STATE = {
    "is_initialized": False,
    "forecasting_engine": None,
    "conformal_engine": None,
    "evaluator": None,
    "evaluation_results": None,
    "historical_attributes": None,
    "historical_launch_curves": None,
    "new_sku_attributes": None,
    "store_clusters": None,
    "holiday_calendar": None,
    "hidden_actual_sales": None,
    "three_year_weekly_sales": None,
    "latest_forecasts": [],
    "selected_model": "ensemble",
    "confidence_level": 0.80,
    "dataset_source": "synthetic_benchmark"
}

def ensure_models_trained():
    if APP_STATE["is_initialized"] and APP_STATE["forecasting_engine"] is not None:
        return
        
    # Check synthetic data exists
    hist_attr_path = SYNTHETIC_DATA_DIR / "historical_attributes.csv"
    hist_curves_path = SYNTHETIC_DATA_DIR / "historical_launch_curves.csv"
    new_attr_path = SYNTHETIC_DATA_DIR / "new_sku_attributes.csv"
    clusters_path = SYNTHETIC_DATA_DIR / "store_clusters.csv"
    holidays_path = SYNTHETIC_DATA_DIR / "holiday_calendar.csv"
    hidden_actuals_path = SYNTHETIC_DATA_DIR / "hidden_actual_sales.csv"
    three_year_path = SYNTHETIC_DATA_DIR / "three_year_weekly_sales.csv"
    
    if not hist_attr_path.exists() or not hist_curves_path.exists() or not hidden_actuals_path.exists():
        generate_synthetic_benchmark()
        
    APP_STATE["historical_attributes"] = pd.read_csv(hist_attr_path, keep_default_na=False)
    APP_STATE["historical_launch_curves"] = pd.read_csv(hist_curves_path)
    APP_STATE["new_sku_attributes"] = pd.read_csv(new_attr_path, keep_default_na=False)
    APP_STATE["store_clusters"] = pd.read_csv(clusters_path)
    APP_STATE["holiday_calendar"] = pd.read_csv(holidays_path)
    if hidden_actuals_path.exists():
        APP_STATE["hidden_actual_sales"] = pd.read_csv(hidden_actuals_path)
    if three_year_path.exists():
        APP_STATE["three_year_weekly_sales"] = pd.read_csv(three_year_path)
    
    # Train forecasting engine strictly on historical attributes and launch curves
    engine = ForecastingEngine()
    engine.train(APP_STATE["historical_attributes"], APP_STATE["historical_launch_curves"])
    
    # Calibrate conformal engine on 15% sample
    sample_hist = APP_STATE["historical_attributes"].sample(n=200, random_state=42)
    pivoted = APP_STATE["historical_launch_curves"].pivot(
        index="sku_id", columns="launch_week", values="sales_units"
    ).dropna()
    pivoted.columns = [f"w_{c}" for c in pivoted.columns]
    merged = pd.merge(sample_hist, pivoted, on="sku_id", how="inner")
    y_true = merged[[f"w_{i}" for i in range(1, 9)]].values
    
    X = engine.feature_pipeline.transform(merged)
    y_pred_rf = engine.rf_model.predict(X)
    y_pred_hgb = engine.hgb_model.predict(X)
    y_pred = 0.5 * y_pred_rf + 0.5 * y_pred_hgb
    
    conformal = CalibratedConformalEngine(confidence_level=0.80)
    conformal.calibrate(y_true, y_pred)
    
    APP_STATE["forecasting_engine"] = engine
    APP_STATE["conformal_engine"] = conformal
    APP_STATE["is_initialized"] = True
    
    # Run initial default forecasts
    run_batch_forecasts(model_type="ensemble", confidence_level=0.80)

def run_batch_forecasts(model_type: str = "ensemble", confidence_level: float = 0.80):
    engine = APP_STATE["forecasting_engine"]
    conformal = APP_STATE["conformal_engine"]
    new_skus_df = APP_STATE["new_sku_attributes"]
    
    predictions = engine.predict_batch(new_skus_df, model_type=model_type)
    records = new_skus_df.to_dict(orient="records")
    
    results = []
    for i, row in enumerate(records):
        pred_res = predictions[i]
        
        top_sim = pred_res["top_analogues"][0]["similarity_score"] if pred_res["top_analogues"] else 75.0
        disagree = pred_res["model_disagreement_std"]
        
        bounds_res = conformal.calculate_bounds(
            point_forecast=pred_res["point_forecast"],
            top_similarity=top_sim,
            model_disagreement=disagree,
            confidence_level=confidence_level
        )
        
        inv_res = NewsvendorOptimizer.calculate_recommendation(
            total_forecast_demand=pred_res["total_8w_demand"],
            interval_lower=bounds_res["total_lower_8w"],
            interval_upper=bounds_res["total_upper_8w"],
            understock_cost=DEFAULT_UNDERSTOCK_COST,
            overstock_cost=DEFAULT_OVERSTOCK_COST,
            retail_price=float(row.get("retail_price", 65.0)),
            unit_cost=float(row.get("cost_price", 25.0))
        )
        
        results.append({
            "sku_id": row["sku_id"],
            "product_name": row.get("product_name", row["sku_id"]),
            "category": row.get("category"),
            "subcategory": row.get("subcategory"),
            "brand_tier": row.get("brand_tier"),
            "retail_price": float(row.get("retail_price", 0.0)),
            "cost_price": float(row.get("cost_price", 0.0)),
            "launch_month": str(row.get("launch_month") or "November"),
            "marketing_level": str(row.get("marketing_level") if pd.notna(row.get("marketing_level")) and row.get("marketing_level") != "" else "Standard"),
            "marketing_spend_flag": int(row.get("marketing_spend_flag", 1 if str(row.get("marketing_level")) in ["High Impact", "Omnichannel Launch"] else 0)),
            "selected_model": model_type,
            "confidence_level": confidence_level,
            "weekly_forecast": pred_res["point_forecast"],
            "weekly_lower_bound": bounds_res["lower_bounds"],
            "weekly_upper_bound": bounds_res["upper_bounds"],
            "total_8w_demand": pred_res["total_8w_demand"],
            "total_lower_8w": bounds_res["total_lower_8w"],
            "total_upper_8w": bounds_res["total_upper_8w"],
            "interval_width_8w": bounds_res["interval_width_8w"],
            "uncertainty_score": bounds_res["uncertainty_score"],
            "top_similarity_score": top_sim,
            "model_disagreement_std": disagree,
            "recommended_buy_quantity": inv_res["recommended_initial_buy"],
            "safety_stock": inv_res["safety_stock"],
            "critical_fractile": inv_res["critical_fractile"],
            "stockout_risk_pct": inv_res["stockout_risk_pct"],
            "excess_risk_pct": inv_res["excess_risk_pct"],
            "model_predictions": pred_res["model_predictions"],
            "top_analogues": pred_res["top_analogues"],
            "fallback_applied": pred_res.get("fallback_applied", False),
            "fallback_method": pred_res.get("fallback_method"),
            "fallback_reason": pred_res.get("fallback_reason"),
            "confidence_tier": pred_res.get("confidence_tier", "Normal (Calibrated)")
        })
        
    APP_STATE["latest_forecasts"] = results
    APP_STATE["selected_model"] = model_type
    APP_STATE["confidence_level"] = confidence_level

# ----------------- ROUTES -----------------

class ColumnMappingApplyRequest(BaseModel):
    temp_filename: str
    dataset_type: str
    column_mapping: Dict[str, str]

@router.get("/health")
def get_health():
    ensure_models_trained()
    return {
        "status": "healthy",
        "service": "LaunchWise AI Backend",
        "tagline": "Predict demand. Plan purchases. Manage inventory smarter.",
        "timestamp": datetime.now().isoformat(),
        "is_model_trained": APP_STATE["is_initialized"],
        "dataset_source": APP_STATE["dataset_source"],
        "historical_skus_count": len(APP_STATE["historical_attributes"]) if APP_STATE["historical_attributes"] is not None else 0,
        "new_skus_count": len(APP_STATE["new_sku_attributes"]) if APP_STATE["new_sku_attributes"] is not None else 0,
        "forecasts_count": len(APP_STATE["latest_forecasts"]),
        "has_hidden_actuals": APP_STATE["hidden_actual_sales"] is not None
    }

@router.get("/datasets")
def list_datasets():
    ensure_models_trained()
    meta_path = SYNTHETIC_DATA_DIR / "metadata.json"
    metadata = {}
    if meta_path.exists():
        with open(meta_path, "r") as f:
            metadata = json.load(f)
            
    return {
        "current_dataset": APP_STATE["dataset_source"],
        "metadata": metadata,
        "is_synthetic": True,
        "disclosure": "Benchmark dataset is synthetic to demonstrate cold-start forecasting without sales leakage. Never claim synthetic results are official benchmark results or that they represent performance on real hidden actuals.",
        "tables": {
            "historical_attributes": len(APP_STATE["historical_attributes"]) if APP_STATE["historical_attributes"] is not None else 0,
            "historical_launch_curves": len(APP_STATE["historical_launch_curves"]) if APP_STATE["historical_launch_curves"] is not None else 0,
            "new_sku_attributes": len(APP_STATE["new_sku_attributes"]) if APP_STATE["new_sku_attributes"] is not None else 0,
            "store_clusters": len(APP_STATE["store_clusters"]) if APP_STATE["store_clusters"] is not None else 0,
            "holiday_calendar": len(APP_STATE["holiday_calendar"]) if APP_STATE["holiday_calendar"] is not None else 0,
            "hidden_actual_sales": len(APP_STATE["hidden_actual_sales"]) if APP_STATE["hidden_actual_sales"] is not None else 0,
            "three_year_weekly_sales": len(APP_STATE["three_year_weekly_sales"]) if APP_STATE["three_year_weekly_sales"] is not None else 0
        }
    }

@router.post("/datasets/column-mapping-preview")
async def preview_column_mapping(
    file: UploadFile = File(...),
    dataset_type: str = Form("new_sku_attributes")
):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")
        
    validation = DataValidator.validate_dataframe(df, dataset_type=dataset_type)
    
    # Save temp upload to UPLOAD_DATA_DIR
    temp_filename = f"temp_{datetime.now().strftime('%Y%m%d_%H%M%S')}_{file.filename}"
    temp_path = UPLOAD_DATA_DIR / temp_filename
    df.to_csv(temp_path, index=False)
    
    return {
        "status": "success",
        "temp_filename": temp_filename,
        "original_filename": file.filename,
        "dataset_type": dataset_type,
        "columns": list(df.columns),
        "suggested_mapping": validation["column_mapping"],
        "validation": validation,
        "preview": df.head(8).to_dict(orient="records")
    }

@router.post("/datasets/apply-column-mapping")
def apply_column_mapping(req: ColumnMappingApplyRequest):
    temp_path = UPLOAD_DATA_DIR / req.temp_filename
    if not temp_path.exists():
        raise HTTPException(status_code=404, detail="Temporary uploaded file not found. Please upload again.")
        
    try:
        df = pd.read_csv(temp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to read file: {str(e)}")
        
    # Rename columns based on mapping dict: original -> target
    rename_dict = {orig: target for orig, target in req.column_mapping.items() if orig in df.columns and target.strip()}
    df = df.rename(columns=rename_dict)
    
    # Validate with renamed columns
    validation = DataValidator.validate_dataframe(df, dataset_type=req.dataset_type)
    if not validation["is_valid"]:
        return {
            "status": "validation_error",
            "message": "Dataset validation failed after applying column mapping.",
            "validation": validation
        }
        
    # Save permanent file
    final_filename = f"{req.dataset_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    final_path = UPLOAD_DATA_DIR / final_filename
    df.to_csv(final_path, index=False)
    
    # Update state based on dataset type
    if req.dataset_type == "new_sku_attributes":
        APP_STATE["new_sku_attributes"] = df
        APP_STATE["dataset_source"] = f"uploaded_{req.temp_filename}"
        run_batch_forecasts(APP_STATE["selected_model"], APP_STATE["confidence_level"])
    elif req.dataset_type == "historical_attributes":
        APP_STATE["historical_attributes"] = df
        # retrain models
        engine = ForecastingEngine()
        engine.train(APP_STATE["historical_attributes"], APP_STATE["historical_launch_curves"])
        APP_STATE["forecasting_engine"] = engine
        run_batch_forecasts(APP_STATE["selected_model"], APP_STATE["confidence_level"])
    elif req.dataset_type == "historical_launch_curves":
        APP_STATE["historical_launch_curves"] = df
        engine = ForecastingEngine()
        engine.train(APP_STATE["historical_attributes"], APP_STATE["historical_launch_curves"])
        APP_STATE["forecasting_engine"] = engine
        run_batch_forecasts(APP_STATE["selected_model"], APP_STATE["confidence_level"])
    elif req.dataset_type == "store_clusters":
        APP_STATE["store_clusters"] = df
    elif req.dataset_type == "hidden_actual_sales":
        APP_STATE["hidden_actual_sales"] = df
    elif req.dataset_type == "holiday_calendar":
        APP_STATE["holiday_calendar"] = df
        
    return {
        "status": "success",
        "message": f"Dataset '{req.dataset_type}' successfully mapped, validated, and loaded into LaunchWise AI.",
        "filename": final_filename,
        "rows": len(df),
        "validation": validation
    }

@router.post("/datasets/upload")
async def upload_dataset(
    file: UploadFile = File(...),
    dataset_type: str = Form("new_sku_attributes")
):
    contents = await file.read()
    try:
        df = pd.read_csv(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse CSV file: {str(e)}")
        
    validation = DataValidator.validate_dataframe(df, dataset_type=dataset_type)
    
    save_path = UPLOAD_DATA_DIR / f"{dataset_type}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    df.to_csv(save_path, index=False)
    
    if validation["is_valid"] and dataset_type == "new_sku_attributes":
        APP_STATE["new_sku_attributes"] = df
        APP_STATE["dataset_source"] = f"uploaded_{file.filename}"
        run_batch_forecasts(APP_STATE["selected_model"], APP_STATE["confidence_level"])

    return {
        "filename": file.filename,
        "dataset_type": dataset_type,
        "validation": validation
    }

@router.post("/datasets/validate")
def validate_dataset_schema(dataset_type: str = Query("new_sku_attributes")):
    ensure_models_trained()
    if dataset_type == "historical_attributes":
        df = APP_STATE["historical_attributes"]
    elif dataset_type == "historical_launch_curves":
        df = APP_STATE["historical_launch_curves"]
    elif dataset_type == "store_clusters":
        df = APP_STATE["store_clusters"]
    elif dataset_type == "holiday_calendar":
        df = APP_STATE["holiday_calendar"]
    elif dataset_type == "hidden_actual_sales":
        df = APP_STATE["hidden_actual_sales"]
    else:
        df = APP_STATE["new_sku_attributes"]
        
    validation = DataValidator.validate_dataframe(df, dataset_type=dataset_type)
    return validation

@router.post("/models/train")
def train_models():
    ensure_models_trained()
    engine = ForecastingEngine()
    engine.train(APP_STATE["historical_attributes"], APP_STATE["historical_launch_curves"])
    APP_STATE["forecasting_engine"] = engine
    run_batch_forecasts(APP_STATE["selected_model"], APP_STATE["confidence_level"])
    return {
        "status": "success",
        "message": "Models successfully trained on historical launch curves.",
        "training_skus": len(APP_STATE["historical_attributes"]),
        "features_engineered": len(engine.feature_names),
        "models": ["baseline", "analogue", "attribute_ml", "random_forest", "hist_gradient_boosting", "ensemble"]
    }

@router.get("/models/status")
def get_model_status():
    ensure_models_trained()
    engine = APP_STATE["forecasting_engine"]
    conformal = APP_STATE["conformal_engine"]
    importances = engine.get_feature_importances(top_n=8)
    
    return {
        "is_trained": engine.is_trained,
        "feature_importances": importances,
        "selected_model": APP_STATE["selected_model"],
        "confidence_level": APP_STATE["confidence_level"],
        "conformal_calibration": conformal.calibration_metrics if conformal else {}
    }

@router.post("/forecasts/run")
def run_forecasts(
    model_type: str = Query("ensemble"),
    confidence_level: float = Query(0.80)
):
    ensure_models_trained()
    valid_models = ["baseline", "attribute_ml", "hist_gradient_boosting", "random_forest", "analogue", "ensemble"]
    if model_type not in valid_models:
        model_type = "ensemble"
    run_batch_forecasts(model_type=model_type, confidence_level=confidence_level)
    return {
        "status": "success",
        "forecast_count": len(APP_STATE["latest_forecasts"]),
        "model_type": model_type,
        "confidence_level": confidence_level
    }

@router.get("/forecasts")
def get_forecasts(
    category: Optional[str] = Query(None),
    brand_tier: Optional[str] = Query(None),
    limit: int = Query(150)
):
    ensure_models_trained()
    res = APP_STATE["latest_forecasts"]
    if category and category != "All":
        res = [x for x in res if x.get("category") == category]
    if brand_tier and brand_tier != "All":
        res = [x for x in res if x.get("brand_tier") == brand_tier]
        
    # Compute executive KPI summary
    total_forecast_units = sum(x["total_8w_demand"] for x in res)
    total_recommended_buy = sum(x["recommended_buy_quantity"] for x in res)
    high_uncertainty_count = sum(1 for x in res if x["uncertainty_score"] >= 45.0)
    
    return {
        "total_skus": len(res),
        "selected_model": APP_STATE["selected_model"],
        "confidence_level": APP_STATE["confidence_level"],
        "summary": {
            "total_forecast_demand_units": round(total_forecast_units, 0),
            "total_recommended_buy_units": int(total_recommended_buy),
            "high_uncertainty_skus": high_uncertainty_count,
            "avg_unit_demand": round(total_forecast_units / max(1, len(res)), 1)
        },
        "forecasts": res[:limit]
    }

@router.get("/forecasts/export")
@router.get("/export/forecasts")
def export_forecasts_csv():
    ensure_models_trained()
    forecasts = APP_STATE["latest_forecasts"]
    export_rows = []
    for f in forecasts:
        export_rows.append({
            "sku_id": f["sku_id"],
            "product_name": f["product_name"],
            "category": f["category"],
            "subcategory": f["subcategory"],
            "brand_tier": f["brand_tier"],
            "retail_price": f["retail_price"],
            "total_8w_forecast": f["total_8w_demand"],
            "total_lower_8w": f["total_lower_8w"],
            "total_upper_8w": f["total_upper_8w"],
            "recommended_buy_quantity": f["recommended_buy_quantity"],
            "safety_stock": f["safety_stock"],
            "uncertainty_score": f["uncertainty_score"],
            "top_similarity_score": f["top_similarity_score"],
            "confidence_tier": f.get("confidence_tier", "Normal"),
            "fallback_applied": f.get("fallback_applied", False),
            "week_1": f["weekly_forecast"][0],
            "week_2": f["weekly_forecast"][1],
            "week_3": f["weekly_forecast"][2],
            "week_4": f["weekly_forecast"][3],
            "week_5": f["weekly_forecast"][4],
            "week_6": f["weekly_forecast"][5],
            "week_7": f["weekly_forecast"][6],
            "week_8": f["weekly_forecast"][7]
        })
    df_exp = pd.DataFrame(export_rows)
    stream = io.StringIO()
    df_exp.to_csv(stream, index=False)
    return Response(
        content=stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=launchwise_forecasts_8w.csv"}
    )

@router.get("/forecasts/{sku_id}")
def get_sku_forecast(sku_id: str):
    ensure_models_trained()
    for item in APP_STATE["latest_forecasts"]:
        if item["sku_id"] == sku_id:
            return item
    raise HTTPException(status_code=404, detail=f"SKU {sku_id} not found in current forecast run.")

@router.get("/forecasts/{sku_id}/explanations")
def get_sku_explanations(sku_id: str):
    ensure_models_trained()
    target_item = None
    for item in APP_STATE["latest_forecasts"]:
        if item["sku_id"] == sku_id:
            target_item = item
            break
            
    if not target_item:
        raise HTTPException(status_code=404, detail=f"SKU {sku_id} not found.")
        
    engine = APP_STATE["forecasting_engine"]
    importances = engine.get_feature_importances(top_n=6)
    
    explanation = ExplainabilityEngine.explain_sku_forecast(
        sku_dict=target_item,
        top_analogues=target_item["top_analogues"],
        feature_importances=importances,
        uncertainty_info={
            "uncertainty_score": target_item["uncertainty_score"],
            "interval_width_8w": target_item["interval_width_8w"]
        },
        model_predictions=target_item["model_predictions"]
    )
    return explanation

@router.post("/inventory/recommend")
def recalculate_inventory(
    total_demand: float = Form(...),
    interval_lower: float = Form(...),
    interval_upper: float = Form(...),
    understock_cost: float = Form(DEFAULT_UNDERSTOCK_COST),
    overstock_cost: float = Form(DEFAULT_OVERSTOCK_COST),
    retail_price: float = Form(65.0),
    unit_cost: float = Form(25.0)
):
    recommendation = NewsvendorOptimizer.calculate_recommendation(
        total_forecast_demand=total_demand,
        interval_lower=interval_lower,
        interval_upper=interval_upper,
        understock_cost=understock_cost,
        overstock_cost=overstock_cost,
        retail_price=retail_price,
        unit_cost=unit_cost
    )
    return recommendation

@router.post("/evaluation/run")
def run_evaluation(test_size: float = Query(0.20)):
    ensure_models_trained()
    evaluator = BenchmarkEvaluator()
    results = evaluator.evaluate(
        APP_STATE["historical_attributes"],
        APP_STATE["historical_launch_curves"],
        test_size=test_size
    )
    APP_STATE["evaluation_results"] = results
    return results

@router.get("/evaluation/results")
def get_evaluation_results():
    ensure_models_trained()
    if APP_STATE["evaluation_results"] is None:
        evaluator = BenchmarkEvaluator()
        APP_STATE["evaluation_results"] = evaluator.evaluate(
            APP_STATE["historical_attributes"],
            APP_STATE["historical_launch_curves"],
            test_size=0.20
        )
    return APP_STATE["evaluation_results"]

@router.get("/evaluation/hidden-actuals")
def get_hidden_actuals_evaluation():
    ensure_models_trained()
    if APP_STATE["hidden_actual_sales"] is None:
        raise HTTPException(status_code=404, detail="Hidden actual sales dataset not loaded.")
    evaluator = BenchmarkEvaluator()
    results = evaluator.evaluate_hidden_actuals(
        forecast_results=APP_STATE["latest_forecasts"],
        df_hidden=APP_STATE["hidden_actual_sales"],
        df_new_attr=APP_STATE["new_sku_attributes"]
    )
    return results

@router.get("/risk/least-confident")
def get_least_confident_skus(top_n: int = Query(10)):
    ensure_models_trained()
    least_confident = RiskAnalyzer.identify_least_confident_skus(
        APP_STATE["latest_forecasts"],
        top_n=top_n
    )
    return {
        "count": len(least_confident),
        "least_confident_skus": least_confident
    }

@router.post("/inventory/allocate")
def allocate_store_inventory(
    total_quantity: int = Form(...),
    category: str = Form("Apparel"),
    brand_tier: str = Form("Mainstream")
):
    ensure_models_trained()
    allocation = StoreClusterAllocator.allocate_inventory(
        total_quantity=total_quantity,
        category=category,
        brand_tier=brand_tier,
        clusters_df=APP_STATE["store_clusters"]
    )
    return allocation

@router.get("/export/purchase-orders")
def export_purchase_orders_csv():
    ensure_models_trained()
    forecasts = APP_STATE["latest_forecasts"]
    po_rows = []
    for f in forecasts:
        po_qty = f["recommended_buy_quantity"]
        cost = f.get("cost_price", 25.0)
        po_value = round(po_qty * cost, 2)
        po_rows.append({
            "sku_id": f["sku_id"],
            "product_name": f["product_name"],
            "category": f["category"],
            "brand_tier": f["brand_tier"],
            "unit_cost": cost,
            "retail_price": f.get("retail_price", 65.0),
            "expected_8w_demand": f["total_8w_demand"],
            "recommended_order_qty": po_qty,
            "safety_buffer_units": f["safety_stock"],
            "total_po_value_usd": po_value,
            "critical_fractile": f["critical_fractile"],
            "stockout_risk_pct": f["stockout_risk_pct"],
            "reorder_action": "Split Order (40% Initial)" if f["uncertainty_score"] > 50 else "Standard Full Commit"
        })
    df_po = pd.DataFrame(po_rows)
    stream = io.StringIO()
    df_po.to_csv(stream, index=False)
    return Response(
        content=stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=launchwise_purchase_orders.csv"}
    )

@router.get("/export/allocations")
def export_allocations_csv():
    ensure_models_trained()
    forecasts = APP_STATE["latest_forecasts"]
    alloc_rows = []
    for f in forecasts:
        alloc = StoreClusterAllocator.allocate_inventory(
            total_quantity=f["recommended_buy_quantity"],
            category=f.get("category", "Apparel"),
            brand_tier=f.get("brand_tier", "Mainstream"),
            clusters_df=APP_STATE["store_clusters"]
        )
        for c in alloc["clusters"]:
            alloc_rows.append({
                "sku_id": f["sku_id"],
                "product_name": f["product_name"],
                "category": f["category"],
                "total_order_qty": f["recommended_buy_quantity"],
                "cluster_id": c["cluster_id"],
                "cluster_name": c["cluster_name"],
                "store_count": c["store_count"],
                "allocated_units": c["allocated_units"],
                "share_pct": c["share_pct"],
                "avg_units_per_store": c["avg_units_per_store"]
            })
    df_al = pd.DataFrame(alloc_rows)
    stream = io.StringIO()
    df_al.to_csv(stream, index=False)
    return Response(
        content=stream.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=launchwise_cluster_allocations.csv"}
    )

# ---------------- Shop & Inventory Management Routes ----------------

class ProductCreateReq(BaseModel):
    sku_id: str
    name: str
    category: str = "General"
    subcategory: str = "General"
    brand_tier: str = "Mainstream"
    price: float = 49.99
    cost: float = 20.00
    stock: int = 50
    min_stock: int = 20
    lead_time_days: int = 14
    status: str = "Active"

class ProductUpdateReq(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    subcategory: Optional[str] = None
    brand_tier: Optional[str] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    min_stock: Optional[int] = None
    lead_time_days: Optional[int] = None
    status: Optional[str] = None

class SaleRecordReq(BaseModel):
    sku_id: str
    quantity: int
    unit_price: Optional[float] = None
    channel: str = "In-Store POS"
    sale_date: Optional[str] = None

class StockAdjustReq(BaseModel):
    sku_id: str
    adjustment_type: str
    quantity_delta: int
    notes: Optional[str] = ""

class SettingsUpdateReq(BaseModel):
    settings: Dict[str, str]

@router.get("/shop/products")
def get_shop_products(
    search: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    brand_tier: Optional[str] = Query(None),
    limit: int = Query(200)
):
    ensure_models_trained()
    products = shop_storage.list_products(search=search, category=category, brand_tier=brand_tier, limit=limit)
    return {"total": len(products), "products": products}

@router.get("/shop/products/{sku_id}")
def get_single_product(sku_id: str):
    p = shop_storage.get_product(sku_id)
    if not p:
        raise HTTPException(status_code=404, detail=f"Product with SKU '{sku_id}' not found.")
    return p

@router.post("/shop/products")
def create_shop_product(req: ProductCreateReq):
    try:
        p = shop_storage.create_product(req.dict())
        return {"status": "success", "message": f"Product '{req.sku_id}' successfully created.", "product": p}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/shop/products/{sku_id}")
def update_shop_product(sku_id: str, req: ProductUpdateReq):
    try:
        p = shop_storage.update_product(sku_id, {k: v for k, v in req.dict().items() if v is not None})
        return {"status": "success", "message": f"Product '{sku_id}' successfully updated.", "product": p}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/shop/products/{sku_id}")
def delete_shop_product(sku_id: str):
    deleted = shop_storage.delete_product(sku_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Product '{sku_id}' not found.")
    return {"status": "success", "message": f"Product '{sku_id}' deleted."}

@router.get("/shop/sales")
def get_shop_sales(limit: int = Query(100), sku_id: Optional[str] = Query(None)):
    sales = shop_storage.list_sales(limit=limit, sku_id=sku_id)
    return {"total": len(sales), "sales": sales}

@router.get("/shop/sales/metrics")
def get_shop_sales_metrics():
    return shop_storage.get_sales_metrics()

@router.post("/shop/sales")
def record_shop_sale(req: SaleRecordReq):
    try:
        res = shop_storage.record_sale(
            sku_id=req.sku_id,
            quantity=req.quantity,
            unit_price=req.unit_price,
            channel=req.channel,
            sale_date=req.sale_date
        )
        return {"status": "success", "message": "Sale recorded successfully and stock updated.", "sale": res}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/shop/inventory/summary")
def get_inventory_summary_status():
    return shop_storage.get_inventory_summary()

@router.get("/shop/inventory/transactions")
def get_inventory_transactions(limit: int = Query(100), sku_id: Optional[str] = Query(None)):
    txs = shop_storage.list_inventory_transactions(limit=limit, sku_id=sku_id)
    return {"total": len(txs), "transactions": txs}

@router.post("/shop/inventory/adjust")
def adjust_inventory_stock(req: StockAdjustReq):
    try:
        res = shop_storage.adjust_stock(
            sku_id=req.sku_id,
            adjustment_type=req.adjustment_type,
            quantity_delta=req.quantity_delta,
            notes=req.notes or ""
        )
        return {"status": "success", "message": f"Stock for '{req.sku_id}' updated successfully.", "result": res}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/shop/settings")
def get_shop_settings():
    return shop_storage.get_all_settings()

@router.post("/shop/settings")
def update_shop_settings(req: SettingsUpdateReq):
    for k, v in req.settings.items():
        shop_storage.update_setting(k, v)
    return {"status": "success", "message": "Settings updated successfully.", "settings": shop_storage.get_all_settings()}

