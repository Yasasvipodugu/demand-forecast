from typing import Dict, Any, List, Tuple, Optional
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, HistGradientBoostingRegressor
from sklearn.multioutput import MultiOutputRegressor
from app.models.feature_engineering import FeaturePipeline
from app.models.similarity import AnalogueSimilarityEngine

class ForecastingEngine:
    def __init__(self):
        self.feature_pipeline = FeaturePipeline()
        self.rf_model = None
        self.hgb_model = None
        self.similarity_engine = None
        self.is_trained = False
        self.feature_names = []
        self.training_metrics = {}
        
        # Category / Subcategory Launch-Curve Baselines
        self.subcategory_baselines = {}
        self.category_baselines = {}
        self.global_baseline = [50.0] * 8
        
    def train(self, historical_attributes: pd.DataFrame, historical_launch_curves: pd.DataFrame):
        # 1. Initialize similarity engine
        self.similarity_engine = AnalogueSimilarityEngine(
            historical_attributes, 
            historical_launch_curves
        )
        
        # 2. Pivot historical launch curves to matrix: [sku_id, w_1, w_2, ..., w_8]
        pivoted_curves = historical_launch_curves.pivot(
            index="sku_id", 
            columns="launch_week", 
            values="sales_units"
        ).dropna()
        pivoted_curves.columns = [f"w_{c}" for c in pivoted_curves.columns]
        
        # Merge with attributes to align rows
        merged = pd.merge(
            historical_attributes, 
            pivoted_curves, 
            on="sku_id", 
            how="inner"
        )
        
        # 3. Compute Category & Sub-Category Launch-Curve Baselines
        y_cols = [f"w_{i}" for i in range(1, 9)]
        
        # Global mean launch curve
        self.global_baseline = [float(merged[col].mean()) for col in y_cols]
        
        # Category mean launch curves
        for cat, grp in merged.groupby("category"):
            self.category_baselines[str(cat).strip().lower()] = [
                float(grp[col].mean()) for col in y_cols
            ]
            
        # Subcategory mean launch curves
        for (cat, subcat), grp in merged.groupby(["category", "subcategory"]):
            key = f"{str(cat).strip().lower()}::{str(subcat).strip().lower()}"
            self.subcategory_baselines[key] = [
                float(grp[col].mean()) for col in y_cols
            ]
        
        # 4. Fit feature pipeline on attributes
        X = self.feature_pipeline.fit_transform(merged)
        self.feature_names = self.feature_pipeline.feature_names
        
        # Y is 8-dimensional weekly sales
        y = merged[y_cols].values
        
        # 5. Train Random Forest (multi-output)
        self.rf_model = MultiOutputRegressor(
            RandomForestRegressor(
                n_estimators=30,
                max_depth=10,
                min_samples_split=4,
                random_state=42,
                n_jobs=-1
            )
        )
        self.rf_model.fit(X, y)
        
        # 6. Train HistGradientBoosting (multi-output)
        self.hgb_model = MultiOutputRegressor(
            HistGradientBoostingRegressor(
                max_iter=30,
                max_depth=6,
                learning_rate=0.08,
                random_state=42
            )
        )
        self.hgb_model.fit(X, y)
        
        self.is_trained = True
        return self

    def get_baseline_curve(self, sku_dict: Dict[str, Any]) -> List[float]:
        cat = str(sku_dict.get("category", "")).strip().lower()
        subcat = str(sku_dict.get("subcategory", "")).strip().lower()
        key = f"{cat}::{subcat}"
        
        if key in self.subcategory_baselines:
            return self.subcategory_baselines[key]
        elif cat in self.category_baselines:
            return self.category_baselines[cat]
        return self.global_baseline

    def predict_sku(
        self, 
        sku_dict: Dict[str, Any], 
        model_type: str = "ensemble"
    ) -> Dict[str, Any]:
        if not self.is_trained:
            raise ValueError("ForecastingEngine has not been trained yet.")
            
        df_single = pd.DataFrame([sku_dict])
        X = self.feature_pipeline.transform(df_single)
        
        # Predict using individual models
        rf_pred = self.rf_model.predict(X)[0]
        hgb_pred = self.hgb_model.predict(X)[0]
        analogue_pred, analogues = self.similarity_engine.predict_analogue_curve(sku_dict, top_k=5)
        baseline_curve = self.get_baseline_curve(sku_dict)
        
        rf_curve = [max(0.0, float(x)) for x in rf_pred]
        hgb_curve = [max(0.0, float(x)) for x in hgb_pred]
        analogue_curve = [max(0.0, float(x)) for x in analogue_pred]
        baseline_curve = [max(0.0, float(x)) for x in baseline_curve]
        
        # Fallback mechanism: check analogue reliability
        top_sim = analogues[0]["similarity_score"] if analogues else 0.0
        fallback_applied = False
        fallback_method = None
        fallback_reason = None
        
        if top_sim < 50.0 or len(analogues) < 3:
            fallback_applied = True
            fallback_method = "Category/Subcategory Launch-Curve Baseline"
            fallback_reason = (
                f"Nearest historical analogue has only {top_sim:.1f}% similarity (<50% threshold). "
                f"Falling back to category/subcategory launch-curve prior with reduced confidence."
            )
            # Blend analogue curve 70% with baseline for stabilization
            analogue_curve = [
                0.30 * a + 0.70 * b for a, b in zip(analogue_curve, baseline_curve)
            ]
        
        # Ensemble: 40% Analogue + 35% HistGBM + 25% RF
        ensemble_curve = [
            0.40 * a + 0.35 * h + 0.25 * r
            for a, h, r in zip(analogue_curve, hgb_curve, rf_curve)
        ]
        
        if model_type == "analogue":
            chosen_curve = analogue_curve
        elif model_type in ["attribute_ml", "hist_gradient_boosting"]:
            chosen_curve = hgb_curve
        elif model_type == "random_forest":
            chosen_curve = rf_curve
        elif model_type == "baseline":
            chosen_curve = baseline_curve
        else:
            chosen_curve = ensemble_curve
            
        # Model disagreement / variance across the 4 approaches
        stacked = np.array([analogue_curve, rf_curve, hgb_curve, baseline_curve])
        disagreement_std = float(np.std(stacked, axis=0).mean())
        
        confidence_tier = "Guarded (Low Confidence)" if fallback_applied or disagreement_std > 16.0 else "Normal (Calibrated)"
        
        return {
            "sku_id": sku_dict.get("sku_id"),
            "product_name": sku_dict.get("product_name", sku_dict.get("sku_id")),
            "category": sku_dict.get("category"),
            "subcategory": sku_dict.get("subcategory"),
            "retail_price": float(sku_dict.get("retail_price", 0.0)),
            "cost_price": float(sku_dict.get("cost_price", 0.0)),
            "brand_tier": sku_dict.get("brand_tier"),
            "chosen_model": model_type,
            "point_forecast": [round(x, 1) for x in chosen_curve],
            "total_8w_demand": round(float(sum(chosen_curve)), 1),
            "model_predictions": {
                "baseline": [round(x, 1) for x in baseline_curve],
                "attribute_ml": [round(x, 1) for x in hgb_curve],
                "random_forest": [round(x, 1) for x in rf_curve],
                "hist_gradient_boosting": [round(x, 1) for x in hgb_curve],
                "analogue": [round(x, 1) for x in analogue_curve],
                "ensemble": [round(x, 1) for x in ensemble_curve]
            },
            "model_disagreement_std": round(disagreement_std, 2),
            "top_analogues": analogues,
            "top_similarity_score": round(top_sim, 1),
            "fallback_applied": fallback_applied,
            "fallback_method": fallback_method,
            "fallback_reason": fallback_reason,
            "confidence_tier": confidence_tier
        }

    def predict_batch(
        self,
        df: pd.DataFrame,
        model_type: str = "ensemble"
    ) -> List[Dict[str, Any]]:
        if not self.is_trained:
            raise ValueError("ForecastingEngine has not been trained yet.")
            
        X = self.feature_pipeline.transform(df)
        rf_preds = self.rf_model.predict(X)
        hgb_preds = self.hgb_model.predict(X)
        
        records = df.to_dict(orient="records")
        results = []
        
        for i, sku_dict in enumerate(records):
            rf_curve = [max(0.0, float(x)) for x in rf_preds[i]]
            hgb_curve = [max(0.0, float(x)) for x in hgb_preds[i]]
            analogue_pred, analogues = self.similarity_engine.predict_analogue_curve(sku_dict, top_k=5)
            baseline_curve = self.get_baseline_curve(sku_dict)
            
            analogue_curve = [max(0.0, float(x)) for x in analogue_pred]
            baseline_curve = [max(0.0, float(x)) for x in baseline_curve]
            
            top_sim = analogues[0]["similarity_score"] if analogues else 0.0
            fallback_applied = False
            fallback_method = None
            fallback_reason = None
            
            if top_sim < 50.0 or len(analogues) < 3:
                fallback_applied = True
                fallback_method = "Category/Subcategory Launch-Curve Baseline"
                fallback_reason = (
                    f"Nearest historical analogue has only {top_sim:.1f}% similarity (<50% threshold). "
                    f"Defaulted to category launch-curve prior with reduced confidence."
                )
                analogue_curve = [
                    0.30 * a + 0.70 * b for a, b in zip(analogue_curve, baseline_curve)
                ]
            
            ensemble_curve = [
                0.40 * a + 0.35 * h + 0.25 * r
                for a, h, r in zip(analogue_curve, hgb_curve, rf_curve)
            ]
            
            if model_type == "analogue":
                chosen_curve = analogue_curve
            elif model_type in ["attribute_ml", "hist_gradient_boosting"]:
                chosen_curve = hgb_curve
            elif model_type == "random_forest":
                chosen_curve = rf_curve
            elif model_type == "baseline":
                chosen_curve = baseline_curve
            else:
                chosen_curve = ensemble_curve
                
            stacked = np.array([analogue_curve, rf_curve, hgb_curve, baseline_curve])
            disagreement_std = float(np.std(stacked, axis=0).mean())
            
            confidence_tier = "Guarded (Low Confidence)" if fallback_applied or disagreement_std > 16.0 else "Normal (Calibrated)"
            
            results.append({
                "sku_id": sku_dict.get("sku_id"),
                "product_name": sku_dict.get("product_name", sku_dict.get("sku_id")),
                "category": sku_dict.get("category"),
                "subcategory": sku_dict.get("subcategory"),
                "retail_price": float(sku_dict.get("retail_price", 0.0)),
                "cost_price": float(sku_dict.get("cost_price", 0.0)),
                "brand_tier": sku_dict.get("brand_tier"),
                "chosen_model": model_type,
                "point_forecast": [round(x, 1) for x in chosen_curve],
                "total_8w_demand": round(float(sum(chosen_curve)), 1),
                "model_predictions": {
                    "baseline": [round(x, 1) for x in baseline_curve],
                    "attribute_ml": [round(x, 1) for x in hgb_curve],
                    "random_forest": [round(x, 1) for x in rf_curve],
                    "hist_gradient_boosting": [round(x, 1) for x in hgb_curve],
                    "analogue": [round(x, 1) for x in analogue_curve],
                    "ensemble": [round(x, 1) for x in ensemble_curve]
                },
                "model_disagreement_std": round(disagreement_std, 2),
                "top_analogues": analogues,
                "top_similarity_score": round(top_sim, 1),
                "fallback_applied": fallback_applied,
                "fallback_method": fallback_method,
                "fallback_reason": fallback_reason,
                "confidence_tier": confidence_tier
            })
            
        return results

    def get_feature_importances(self, top_n: int = 10) -> List[Dict[str, Any]]:
        if not self.is_trained or not self.rf_model:
            return []
            
        # Average feature importances across the 8 multi-output trees
        importances = np.mean([
            estimator.feature_importances_ for estimator in self.rf_model.estimators_
        ], axis=0)
        
        feature_tuples = []
        for name, imp in zip(self.feature_names, importances):
            clean_name = name.replace("num__", "").replace("cat__", "").replace("_", " ").title()
            feature_tuples.append((clean_name, float(imp)))
            
        feature_tuples.sort(key=lambda x: x[1], reverse=True)
        return [
            {"feature": f[0], "importance": round(f[1] * 100.0, 2)}
            for f in feature_tuples[:top_n]
        ]
