import sys
from pathlib import Path
import pytest
import numpy as np
import pandas as pd

# Add backend to path
BACKEND_DIR = Path(__file__).resolve().parent.parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))

from app.core.config import SYNTHETIC_DATA_DIR
from app.data.validator import DataValidator
from app.data.generator import generate_synthetic_benchmark
from app.models.similarity import AnalogueSimilarityEngine
from app.models.forecasting import ForecastingEngine
from app.models.uncertainty import CalibratedConformalEngine
from app.models.inventory import NewsvendorOptimizer
from app.models.allocation import StoreClusterAllocator
from app.models.risk import RiskAnalyzer

@pytest.fixture(scope="module")
def benchmark_data():
    hist_attr_path = SYNTHETIC_DATA_DIR / "historical_attributes.csv"
    hist_curves_path = SYNTHETIC_DATA_DIR / "historical_launch_curves.csv"
    new_attr_path = SYNTHETIC_DATA_DIR / "new_sku_attributes.csv"
    
    if not hist_attr_path.exists() or not hist_curves_path.exists():
        generate_synthetic_benchmark()
        
    df_attr = pd.read_csv(hist_attr_path)
    df_curves = pd.read_csv(hist_curves_path)
    df_new = pd.read_csv(new_attr_path)
    return df_attr, df_curves, df_new

def test_data_validation(benchmark_data):
    df_attr, df_curves, df_new = benchmark_data
    val_new = DataValidator.validate_dataframe(df_new, dataset_type="new_sku_attributes")
    assert val_new["is_valid"] is True
    assert val_new["quality_score"] >= 90.0
    assert val_new["row_count"] == len(df_new)
    assert len(val_new["errors"]) == 0

def test_similarity_matching(benchmark_data):
    df_attr, df_curves, df_new = benchmark_data
    engine = AnalogueSimilarityEngine(df_attr.head(200), df_curves)
    sample_new = df_new.iloc[0].to_dict()
    
    analogues = engine.find_top_analogues(sample_new, top_k=5)
    assert len(analogues) == 5
    for a in analogues:
        assert 0.0 <= a["similarity_score"] <= 100.0
        assert len(a["launch_curve"]) == 8
        assert all(x >= 0 for x in a["launch_curve"])

def test_forecasting_pipeline(benchmark_data):
    df_attr, df_curves, df_new = benchmark_data
    engine = ForecastingEngine()
    engine.train(df_attr.head(300), df_curves)
    
    sample_new = df_new.iloc[0].to_dict()
    res = engine.predict_sku(sample_new, model_type="ensemble")
    
    assert len(res["point_forecast"]) == 8
    assert res["total_8w_demand"] > 0
    assert "analogue" in res["model_predictions"]
    assert "random_forest" in res["model_predictions"]
    assert "hist_gradient_boosting" in res["model_predictions"]
    assert "ensemble" in res["model_predictions"]

def test_conformal_uncertainty():
    conformal = CalibratedConformalEngine(confidence_level=0.80)
    # Mock residuals
    y_true = np.ones((50, 8)) * 100.0
    y_pred = np.ones((50, 8)) * 90.0
    conformal.calibrate(y_true, y_pred)
    
    bounds_80 = conformal.calculate_bounds([100.0] * 8, confidence_level=0.80)
    bounds_90 = conformal.calculate_bounds([100.0] * 8, confidence_level=0.90)
    
    assert len(bounds_80["lower_bounds"]) == 8
    assert len(bounds_80["upper_bounds"]) == 8
    # 90% confidence interval width should be >= 80% confidence interval width
    assert bounds_90["interval_width_8w"] >= bounds_80["interval_width_8w"]
    assert bounds_80["total_lower_8w"] <= bounds_80["total_upper_8w"]

def test_newsvendor_inventory_optimization():
    # Test case 1: High understocking cost (Cu >> Co) -> Should order MORE than expected demand
    rec_high = NewsvendorOptimizer.calculate_recommendation(
        total_forecast_demand=500.0,
        interval_lower=350.0,
        interval_upper=650.0,
        understock_cost=70.0,
        overstock_cost=10.0
    )
    assert rec_high["critical_fractile"] > 0.80
    assert rec_high["recommended_initial_buy"] > 500
    assert rec_high["safety_stock"] > 0
    
    # Test case 2: Low understocking cost (Co >> Cu) -> Should order LESS than expected demand
    rec_low = NewsvendorOptimizer.calculate_recommendation(
        total_forecast_demand=500.0,
        interval_lower=350.0,
        interval_upper=650.0,
        understock_cost=10.0,
        overstock_cost=70.0
    )
    assert rec_low["critical_fractile"] < 0.20
    assert rec_low["recommended_initial_buy"] < 500
    assert rec_low["safety_stock"] < 0

def test_store_allocation_exact_sum():
    # Test that store cluster allocator EXACTLY sums to Q* across various numbers
    for test_qty in [0, 1, 7, 33, 100, 523, 1489, 10000]:
        res = StoreClusterAllocator.allocate_inventory(
            total_quantity=test_qty,
            category="Footwear",
            brand_tier="Premium"
        )
        assert res["reconciliation_check"] is True
        assert res["allocated_sum"] == test_qty
        assert sum(c["allocated_units"] for c in res["clusters"]) == test_qty

def test_baseline_and_fallback_mechanism(benchmark_data):
    df_attr, df_curves, df_new = benchmark_data
    engine = ForecastingEngine()
    engine.train(df_attr.head(300), df_curves)
    
    sample_new = df_new.iloc[0].to_dict()
    res_base = engine.predict_sku(sample_new, model_type="baseline")
    assert len(res_base["point_forecast"]) == 8
    assert res_base["chosen_model"] == "baseline"
    assert "baseline" in res_base["model_predictions"]
    
    # Check fallback structure exists
    assert "fallback_applied" in res_base
    assert "confidence_tier" in res_base

def test_hidden_actuals_evaluation(benchmark_data):
    from app.models.evaluation import BenchmarkEvaluator
    df_attr, df_curves, df_new = benchmark_data
    hidden_path = SYNTHETIC_DATA_DIR / "hidden_actual_sales.csv"
    if hidden_path.exists():
        df_hidden = pd.read_csv(hidden_path)
        engine = ForecastingEngine()
        engine.train(df_attr.head(300), df_curves)
        batch_preds = engine.predict_batch(df_new.head(20), model_type="ensemble")
        
        evaluator = BenchmarkEvaluator()
        res = evaluator.evaluate_hidden_actuals(batch_preds, df_hidden, df_new.head(20))
        assert res["status"] == "success"
        assert res["overall_wape"] > 0
        assert "model_comparison" in res
        assert "Ensemble Model (Final)" in res["model_comparison"]
