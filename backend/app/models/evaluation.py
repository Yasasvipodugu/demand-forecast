from typing import Dict, Any, List
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from app.models.forecasting import ForecastingEngine
from app.models.uncertainty import CalibratedConformalEngine

def calculate_wape(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    sum_true = np.sum(y_true)
    if sum_true == 0:
        return 0.0
    return float(np.sum(np.abs(y_true - y_pred)) / sum_true)

def calculate_mae(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.mean(np.abs(y_true - y_pred)))

def calculate_rmse(y_true: np.ndarray, y_pred: np.ndarray) -> float:
    return float(np.sqrt(np.mean((y_true - y_pred) ** 2)))

class BenchmarkEvaluator:
    def __init__(self):
        self.results = {}
        
    def evaluate(
        self, 
        historical_attributes: pd.DataFrame, 
        historical_launch_curves: pd.DataFrame,
        test_size: float = 0.20,
        random_state: int = 42
    ) -> Dict[str, Any]:
        """
        Leakage-safe benchmark evaluation on held-out historical launches.
        """
        # Split SKUs into train and test sets
        unique_skus = historical_attributes["sku_id"].unique()
        train_skus, test_skus = train_test_split(
            unique_skus, 
            test_size=test_size, 
            random_state=random_state
        )
        
        train_attr = historical_attributes[historical_attributes["sku_id"].isin(train_skus)].copy()
        train_curves = historical_launch_curves[historical_launch_curves["sku_id"].isin(train_skus)].copy()
        
        test_attr = historical_attributes[historical_attributes["sku_id"].isin(test_skus)].copy()
        test_curves = historical_launch_curves[historical_launch_curves["sku_id"].isin(test_skus)].copy()
        
        # 1. Train forecasting engine strictly on train split
        forecasting_engine = ForecastingEngine()
        forecasting_engine.train(train_attr, train_curves)
        
        # 2. Extract true test trajectories
        test_pivoted = test_curves.pivot(
            index="sku_id", 
            columns="launch_week", 
            values="sales_units"
        ).dropna()
        test_pivoted.columns = [f"w_{c}" for c in test_pivoted.columns]
        
        test_merged = pd.merge(test_attr, test_pivoted, on="sku_id", how="inner")
        y_cols = [f"w_{i}" for i in range(1, 9)]
        y_true_test = test_merged[y_cols].values
        
        # 3. Generate predictions for all models in one vectorized pass
        batch_res = forecasting_engine.predict_batch(test_merged, model_type="ensemble")
        preds_baseline = [r["model_predictions"]["baseline"] for r in batch_res]
        preds_analogue = [r["model_predictions"]["analogue"] for r in batch_res]
        preds_rf = [r["model_predictions"]["random_forest"] for r in batch_res]
        preds_hgb = [r["model_predictions"]["hist_gradient_boosting"] for r in batch_res]
        preds_ensemble = [r["model_predictions"]["ensemble"] for r in batch_res]
        
        y_baseline = np.array(preds_baseline)
        y_analogue = np.array(preds_analogue)
        y_rf = np.array(preds_rf)
        y_hgb = np.array(preds_hgb)
        y_ensemble = np.array(preds_ensemble)
        
        # 4. Calibrate conformal intervals on train split residuals
        train_pivoted = train_curves.pivot(
            index="sku_id", 
            columns="launch_week", 
            values="sales_units"
        ).dropna()
        train_pivoted.columns = [f"w_{c}" for c in train_pivoted.columns]
        train_merged = pd.merge(train_attr, train_pivoted, on="sku_id", how="inner")
        y_train_true = train_merged[y_cols].values
        
        X_train = forecasting_engine.feature_pipeline.transform(train_merged)
        y_train_rf = forecasting_engine.rf_model.predict(X_train)
        y_train_hgb = forecasting_engine.hgb_model.predict(X_train)
        y_train_ens = 0.5 * y_train_rf + 0.5 * y_train_hgb
        
        conformal_engine = CalibratedConformalEngine()
        conformal_engine.calibrate(y_train_true, y_train_ens)
        
        # 5. Model Comparison Metrics
        models_metrics = {}
        for name, pred in [
            ("Category Baseline", y_baseline),
            ("Historical Analogue", y_analogue),
            ("Random Forest", y_rf),
            ("HistGradientBoosting", y_hgb),
            ("Ensemble (Recommended)", y_ensemble)
        ]:
            wape = calculate_wape(y_true_test, pred)
            mae = calculate_mae(y_true_test, pred)
            rmse = calculate_rmse(y_true_test, pred)
            models_metrics[name] = {
                "wape": round(wape * 100.0, 2),
                "mae": round(mae, 2),
                "rmse": round(rmse, 2)
            }
            
        # 6. Prediction Interval Calibration on Test Set
        bounds_lower_80 = np.maximum(0.0, y_ensemble - conformal_engine.horizon_quantiles_80)
        bounds_upper_80 = y_ensemble + conformal_engine.horizon_quantiles_80
        
        picp_80 = float(np.mean((y_true_test >= bounds_lower_80) & (y_true_test <= bounds_upper_80)))
        mpiw_80 = float(np.mean(bounds_upper_80 - bounds_lower_80))
        
        # 7. Weekly Performance Breakdown (Weeks 1 to 8)
        weekly_breakdown = []
        for w in range(8):
            w_true = y_true_test[:, w]
            w_pred = y_ensemble[:, w]
            weekly_breakdown.append({
                "launch_week": f"Week {w+1}",
                "wape": round(calculate_wape(w_true, w_pred) * 100.0, 2),
                "mae": round(calculate_mae(w_true, w_pred), 2),
                "rmse": round(calculate_rmse(w_true, w_pred), 2),
                "avg_actual": round(float(np.mean(w_true)), 1),
                "avg_predicted": round(float(np.mean(w_pred)), 1)
            })
            
        # 8. Category Performance Breakdown
        category_breakdown = []
        for cat in test_merged["category"].unique():
            cat_mask = test_merged["category"] == cat
            c_true = y_true_test[cat_mask]
            c_pred = y_ensemble[cat_mask]
            category_breakdown.append({
                "category": cat,
                "n_skus": int(np.sum(cat_mask)),
                "wape": round(calculate_wape(c_true, c_pred) * 100.0, 2),
                "mae": round(calculate_mae(c_true, c_pred), 2),
                "rmse": round(calculate_rmse(c_true, c_pred), 2)
            })
            
        # 9. Actual vs Predicted Curve samples for visualization
        sample_curves = []
        for i in range(min(5, len(test_merged))):
            row = test_merged.iloc[i]
            sample_curves.append({
                "sku_id": row["sku_id"],
                "product_name": row.get("product_name", row["sku_id"]),
                "category": row.get("category"),
                "actual": [int(x) for x in y_true_test[i]],
                "predicted": [round(float(x), 1) for x in y_ensemble[i]],
                "lower_80": [round(float(x), 1) for x in bounds_lower_80[i]],
                "upper_80": [round(float(x), 1) for x in bounds_upper_80[i]]
            })
            
        self.results = {
            "status": "success",
            "is_synthetic": True,
            "test_sample_size": len(test_skus),
            "train_sample_size": len(train_skus),
            "model_comparison": models_metrics,
            "uncertainty_calibration": {
                "nominal_coverage_80": 80.0,
                "empirical_picp_80": round(picp_80 * 100.0, 2),
                "mpiw_80": round(mpiw_80, 2)
            },
            "weekly_breakdown": weekly_breakdown,
            "category_breakdown": category_breakdown,
            "sample_curves": sample_curves
        }
        return self.results

    def evaluate_hidden_actuals(
        self,
        forecast_results: List[Dict[str, Any]],
        df_hidden: pd.DataFrame,
        df_new_attr: pd.DataFrame
    ) -> Dict[str, Any]:
        """
        Evaluates model predictions against the 150 New SKUs' hidden actual sales.
        STRICT PROTOCOL: This evaluation is performed out-of-sample post-inference.
        The hidden actuals were NEVER accessed or utilized during forecast generation.
        """
        pivoted_hidden = df_hidden.pivot(
            index="sku_id",
            columns="launch_week",
            values="sales_units"
        ).dropna()
        pivoted_hidden.columns = [f"w_{c}" for c in pivoted_hidden.columns]
        
        # Build forecast dataframe
        f_records = []
        for f in forecast_results:
            sku = f["sku_id"]
            point = f.get("weekly_forecast", f.get("point_forecast", [0]*8))
            low = f.get("weekly_lower_bound", f.get("lower_bounds", [max(0.0, float(p) - 35.0) for p in point]))
            up = f.get("weekly_upper_bound", f.get("upper_bounds", [float(p) + 35.0 for p in point]))
            f_records.append({
                "sku_id": sku,
                "product_name": f.get("product_name", sku),
                "category": f.get("category", "General"),
                "retail_price": f.get("retail_price", 50.0),
                "point_8w": f.get("total_8w_demand", sum(point)),
                **{f"pred_w_{i+1}": point[i] for i in range(8)},
                **{f"low_w_{i+1}": low[i] for i in range(8)},
                **{f"up_w_{i+1}": up[i] for i in range(8)},
                # Model predictions if present
                "ens_curve": point,
                "base_curve": f.get("model_predictions", {}).get("baseline", point),
                "ana_curve": f.get("model_predictions", {}).get("analogue", point),
                "ml_curve": f.get("model_predictions", {}).get("attribute_ml", f.get("model_predictions", {}).get("hist_gradient_boosting", point))
            })
        df_pred = pd.DataFrame(f_records)
        
        merged = pd.merge(df_pred, pivoted_hidden, on="sku_id", how="inner")
        if merged.empty:
            return {"status": "error", "message": "No matching SKUs between hidden actuals and forecasts."}
            
        y_cols = [f"w_{i}" for i in range(1, 9)]
        y_actual = merged[y_cols].values
        
        y_pred_ens = np.array([row["ens_curve"] for _, row in merged.iterrows()])
        y_pred_base = np.array([row["base_curve"] for _, row in merged.iterrows()])
        y_pred_ana = np.array([row["ana_curve"] for _, row in merged.iterrows()])
        y_pred_ml = np.array([row["ml_curve"] for _, row in merged.iterrows()])
        
        y_low = merged[[f"low_w_{i}" for i in range(1, 9)]].values
        y_up = merged[[f"up_w_{i}" for i in range(1, 9)]].values
        
        # 1. Model comparison on hidden actuals
        models_metrics = {
            "Category Baseline": {
                "wape": round(calculate_wape(y_actual, y_pred_base) * 100.0, 2),
                "mae": round(calculate_mae(y_actual, y_pred_base), 2),
                "rmse": round(calculate_rmse(y_actual, y_pred_base), 2)
            },
            "Analogue Model (Gower)": {
                "wape": round(calculate_wape(y_actual, y_pred_ana) * 100.0, 2),
                "mae": round(calculate_mae(y_actual, y_pred_ana), 2),
                "rmse": round(calculate_rmse(y_actual, y_pred_ana), 2)
            },
            "Attribute ML (HistGBM)": {
                "wape": round(calculate_wape(y_actual, y_pred_ml) * 100.0, 2),
                "mae": round(calculate_mae(y_actual, y_pred_ml), 2),
                "rmse": round(calculate_rmse(y_actual, y_pred_ml), 2)
            },
            "Ensemble Model (Final)": {
                "wape": round(calculate_wape(y_actual, y_pred_ens) * 100.0, 2),
                "mae": round(calculate_mae(y_actual, y_pred_ens), 2),
                "rmse": round(calculate_rmse(y_actual, y_pred_ens), 2)
            }
        }
        
        # 2. Conformal Interval empirical coverage on hidden actuals
        in_bounds_mask = (y_actual >= y_low) & (y_actual <= y_up)
        empirical_picp = float(np.mean(in_bounds_mask)) * 100.0
        avg_interval_width = float(np.mean(y_up - y_low))
        
        # 3. Weekly breakdown (Weeks 1 to 8)
        weekly_breakdown = []
        for w in range(8):
            w_act = y_actual[:, w]
            w_pr = y_pred_ens[:, w]
            w_lo = y_low[:, w]
            w_hi = y_up[:, w]
            weekly_breakdown.append({
                "launch_week": f"Week {w+1}",
                "wape": round(calculate_wape(w_act, w_pr) * 100.0, 2),
                "mae": round(calculate_mae(w_act, w_pr), 2),
                "rmse": round(calculate_rmse(w_act, w_pr), 2),
                "avg_actual": round(float(np.mean(w_act)), 1),
                "avg_predicted": round(float(np.mean(w_pr)), 1),
                "coverage_pct": round(float(np.mean((w_act >= w_lo) & (w_act <= w_hi))) * 100.0, 1)
            })
            
        # 4. Category breakdown
        category_breakdown = []
        for cat in merged["category"].unique():
            c_mask = merged["category"] == cat
            c_act = y_actual[c_mask]
            c_pr = y_pred_ens[c_mask]
            category_breakdown.append({
                "category": cat,
                "n_skus": int(np.sum(c_mask)),
                "wape": round(calculate_wape(c_act, c_pr) * 100.0, 2),
                "mae": round(calculate_mae(c_act, c_pr), 2),
                "rmse": round(calculate_rmse(c_act, c_pr), 2),
                "avg_actual_8w": round(float(np.mean(np.sum(c_act, axis=1))), 1),
                "avg_predicted_8w": round(float(np.mean(np.sum(c_pr, axis=1))), 1)
            })
            
        # 5. SKU-level comparison list
        sku_comparisons = []
        for i in range(len(merged)):
            row = merged.iloc[i]
            act_8w = int(np.sum(y_actual[i]))
            pred_8w = round(float(np.sum(y_pred_ens[i])), 1)
            abs_err = round(abs(pred_8w - act_8w), 1)
            sku_wape = round((abs_err / max(1.0, act_8w)) * 100.0, 1)
            in_bounds = bool(np.all((y_actual[i] >= y_low[i]) & (y_actual[i] <= y_up[i])))
            
            sku_comparisons.append({
                "sku_id": row["sku_id"],
                "product_name": row["product_name"],
                "category": row["category"],
                "retail_price": row["retail_price"],
                "actual_8w_sales": act_8w,
                "predicted_8w_demand": pred_8w,
                "absolute_error": abs_err,
                "wape_pct": sku_wape,
                "in_prediction_bounds": in_bounds,
                "actual_curve": [int(x) for x in y_actual[i]],
                "predicted_curve": [round(float(x), 1) for x in y_pred_ens[i]],
                "lower_bounds": [round(float(x), 1) for x in y_low[i]],
                "upper_bounds": [round(float(x), 1) for x in y_up[i]]
            })
            
        return {
            "status": "success",
            "evaluation_type": "hidden_actuals",
            "disclosure": "Out-of-sample evaluation on strictly held-out hidden actual sales for 150 new SKUs.",
            "total_evaluated_skus": len(merged),
            "overall_wape": round(calculate_wape(y_actual, y_pred_ens) * 100.0, 2),
            "overall_mae": round(calculate_mae(y_actual, y_pred_ens), 2),
            "overall_rmse": round(calculate_rmse(y_actual, y_pred_ens), 2),
            "conformal_coverage": {
                "nominal_target": 80.0,
                "empirical_picp": round(empirical_picp, 2),
                "mpiw": round(avg_interval_width, 2)
            },
            "model_comparison": models_metrics,
            "weekly_breakdown": weekly_breakdown,
            "category_breakdown": category_breakdown,
            "sku_comparisons": sku_comparisons
        }
