#!/usr/bin/env python3
"""
LaunchWise AI - Standalone Evaluation Script
Tagline: Predict demand. Plan purchases. Manage inventory smarter.

Computes WAPE, MAE, RMSE, and Conformal Prediction Interval Calibration (PICP/MPIW)
on held-out cold-start product launch curves and out-of-sample hidden actuals.
"""
import sys
import os
import argparse
from pathlib import Path

# Add backend to path
sys.path.insert(0, str(Path(__file__).resolve().parent / "backend"))

import pandas as pd
from app.core.config import SYNTHETIC_DATA_DIR
from app.models.evaluation import BenchmarkEvaluator
from app.models.forecasting import ForecastingEngine
from app.models.uncertainty import CalibratedConformalEngine
from app.data.generator import generate_synthetic_benchmark

import json

def main():
    parser = argparse.ArgumentParser(description="Evaluate LaunchWise AI Forecasting Models")
    parser.add_argument("--data-dir", type=str, default=str(SYNTHETIC_DATA_DIR), help="Directory containing dataset CSVs")
    parser.add_argument("--test-size", type=float, default=0.20, help="Held-out validation launch fraction")
    parser.add_argument("--eval-hidden", action="store_true", help="Evaluate forecasts against 150 New SKUs hidden actuals")
    parser.add_argument("--output-dir", type=str, default=".", help="Directory to save evaluation reports and predictions")
    args = parser.parse_args()

    data_path = Path(args.data_dir)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    hist_attr_path = data_path / "historical_attributes.csv"
    hist_curves_path = data_path / "historical_launch_curves.csv"
    hidden_actuals_path = data_path / "hidden_actual_sales.csv"
    new_attr_path = data_path / "new_sku_attributes.csv"

    if not hist_attr_path.exists() or not hist_curves_path.exists():
        print(f"Dataset files not found in {data_path}. Generating synthetic benchmark dataset...")
        generate_synthetic_benchmark()

    print("=" * 70)
    print("LAUNCHWISE AI — MODEL EVALUATION BENCHMARK")
    print("Tagline: Predict demand. Plan purchases. Manage inventory smarter.")
    print("=" * 70)
    
    print("\nLoading historical attributes and launch curves...")
    df_attr = pd.read_csv(hist_attr_path)
    df_curves = pd.read_csv(hist_curves_path)
    print(f"Loaded {len(df_attr)} historical SKUs and {len(df_curves)} weekly launch records.")

    print(f"\nRunning Leakage-Safe Launch-Level Evaluation (Test Size: {args.test_size:.0%})...")
    evaluator = BenchmarkEvaluator()
    results = evaluator.evaluate(df_attr, df_curves, test_size=args.test_size)

    print("\n" + "=" * 65)
    print("MODEL PERFORMANCE COMPARISON (WAPE / MAE / RMSE)")
    print("=" * 65)
    print(f"{'Model Name':<28} | {'WAPE (%)':<10} | {'MAE':<8} | {'RMSE':<8}")
    print("-" * 65)
    for model_name, metrics in results["model_comparison"].items():
        print(f"{model_name:<28} | {metrics['wape']:<10.2f} | {metrics['mae']:<8.2f} | {metrics['rmse']:<8.2f}")
    print("=" * 65)

    unc = results["uncertainty_calibration"]
    print("\nCONFORMAL UNCERTAINTY CALIBRATION (80% Nominal Target):")
    print(f"  - Empirical PICP (Coverage): {unc['empirical_picp_80']}% (Target: {unc['nominal_coverage_80']}%)")
    print(f"  - Mean Prediction Interval Width (MPIW): {unc['mpiw_80']} units/week")

    print("\nWEEKLY WAPE BREAKDOWN (LAUNCH WEEKS 1 TO 8):")
    for w in results["weekly_breakdown"]:
        print(f"  - {w['launch_week']}: WAPE = {w['wape']:.2f}%, MAE = {w['mae']:.2f}, Avg Sales = {w['avg_actual']}")

    print("\nCATEGORY PERFORMANCE:")
    for c in results["category_breakdown"]:
        print(f"  - {c['category']:<20}: WAPE = {c['wape']:.2f}%, N = {c['n_skus']}")
        
    predictions_rows = []
    active_eval_report = results
    eval_type_label = "historical_holdout_test"

    if args.eval_hidden and hidden_actuals_path.exists() and new_attr_path.exists():
        print("\n" + "=" * 65)
        print("OUT-OF-SAMPLE BENCHMARK: 150 NEW SKUS HIDDEN ACTUAL SALES")
        print("=" * 65)
        df_hidden = pd.read_csv(hidden_actuals_path)
        df_new = pd.read_csv(new_attr_path)
        eval_type_label = "blind_cold_start_hidden_actuals"
        
        # Train engine and generate forecasts
        engine = ForecastingEngine()
        engine.train(df_attr, df_curves)
        forecasts = engine.predict_batch(df_new, model_type="ensemble")
        
        # Calibrate conformal engine for interval coverage calculation
        sample_hist = df_attr.sample(n=min(200, len(df_attr)), random_state=42)
        pivoted = df_curves.pivot(index="sku_id", columns="launch_week", values="sales_units").dropna()
        pivoted.columns = [f"w_{c}" for c in pivoted.columns]
        merged_c = pd.merge(sample_hist, pivoted, on="sku_id", how="inner")
        y_true_c = merged_c[[f"w_{i}" for i in range(1, 9)]].values
        X_c = engine.feature_pipeline.transform(merged_c)
        y_pred_c = 0.5 * engine.rf_model.predict(X_c) + 0.5 * engine.hgb_model.predict(X_c)
        conformal = CalibratedConformalEngine(confidence_level=0.80)
        conformal.calibrate(y_true_c, y_pred_c)
        
        for f in forecasts:
            b = conformal.calculate_bounds(f["point_forecast"], top_similarity=f.get("top_similarity_score", 75.0), model_disagreement=f.get("model_disagreement_std", 5.0))
            f["weekly_lower_bound"] = b["lower_bounds"]
            f["weekly_upper_bound"] = b["upper_bounds"]
            f["lower_bounds"] = b["lower_bounds"]
            f["upper_bounds"] = b["upper_bounds"]
        
        hidden_res = evaluator.evaluate_hidden_actuals(forecasts, df_hidden, df_new)
        active_eval_report = hidden_res
        print(f"Total Evaluated Cold-Start SKUs: {hidden_res['total_evaluated_skus']}")
        print(f"Overall Ensemble WAPE on Hidden Actuals: {hidden_res['overall_wape']:.2f}%")
        print(f"Overall Ensemble MAE on Hidden Actuals:  {hidden_res['overall_mae']:.2f} units/week")
        print(f"Conformal Empirical Coverage:          {hidden_res['conformal_coverage']['empirical_picp']}% (Target: 80%)")
        print("\nModel Comparison on Hidden Actuals:")
        for m_name, m_met in hidden_res["model_comparison"].items():
            print(f"  - {m_name:<28}: WAPE = {m_met['wape']:<6.2f}%, MAE = {m_met['mae']:<6.2f}")

        # Build granular predictions.csv rows from hidden evaluation
        for s in hidden_res.get("sku_comparisons", []):
            for wk_idx in range(8):
                act = s["actual_curve"][wk_idx]
                pred = s["predicted_curve"][wk_idx]
                predictions_rows.append({
                    "sku_id": s["sku_id"],
                    "product_name": s["product_name"],
                    "category": s["category"],
                    "launch_week": f"Week {wk_idx + 1}",
                    "predicted_demand": round(pred, 2),
                    "lower_bound_80": round(s["lower_bounds"][wk_idx], 2),
                    "upper_bound_80": round(s["upper_bounds"][wk_idx], 2),
                    "actual_demand": act,
                    "absolute_error": round(abs(act - pred), 2)
                })
    else:
        # Build predictions.csv rows from hold-out sample curves
        for sc in results.get("sample_curves", []):
            for wk_idx in range(8):
                act = sc["actual"][wk_idx]
                pred = sc["predicted"][wk_idx]
                predictions_rows.append({
                    "sku_id": sc["sku_id"],
                    "product_name": sc["product_name"],
                    "category": sc["category"],
                    "launch_week": f"Week {wk_idx + 1}",
                    "predicted_demand": round(pred, 2),
                    "lower_bound_80": round(sc["lower_80"][wk_idx], 2),
                    "upper_bound_80": round(sc["upper_80"][wk_idx], 2),
                    "actual_demand": act,
                    "absolute_error": round(abs(act - pred), 2)
                })

    # 1. Output predictions.csv
    pred_path = output_dir / "predictions.csv"
    if predictions_rows:
        df_pred_out = pd.DataFrame(predictions_rows)
        df_pred_out.to_csv(pred_path, index=False)
        print(f"\n[SAVED]: Detailed predictions saved to {pred_path} ({len(df_pred_out)} rows)")

    # 2. Output evaluation_report.json
    json_path = output_dir / "evaluation_report.json"
    with open(json_path, "w") as f:
        json.dump(active_eval_report, f, indent=2)
    print(f"[SAVED]: Machine-readable evaluation report saved to {json_path}")

    # 3. Output evaluation_report.csv
    csv_report_path = output_dir / "evaluation_report.csv"
    report_rows = []
    for model_name, m in active_eval_report.get("model_comparison", {}).items():
        report_rows.append({
            "model_architecture": model_name,
            "wape_pct": round(m.get("wape", 0.0), 2),
            "mae_units": round(m.get("mae", 0.0), 2),
            "rmse_units": round(m.get("rmse", 0.0), 2),
            "evaluation_type": eval_type_label,
            "sample_size": active_eval_report.get("total_evaluated_skus", active_eval_report.get("test_sample_size", 0))
        })
    df_report = pd.DataFrame(report_rows)
    df_report.to_csv(csv_report_path, index=False)
    print(f"[SAVED]: Formatted benchmark summary saved to {csv_report_path}")

    print("\n" + "=" * 70)
    print("REPRODUCIBLE EXECUTION INSTRUCTIONS:")
    print("  1. Standard held-out evaluation:  python evaluate.py --test-size 0.20")
    print("  2. Blind cold-start benchmark:    python evaluate.py --eval-hidden")
    print("=" * 70)
    print("[DISCLOSURE]: Synthetic benchmark results for methodology demonstration.")
    print("Never claim synthetic results represent real undisclosed commercial performance.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
