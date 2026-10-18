from typing import List, Dict, Any
import numpy as np

class RiskAnalyzer:
    @staticmethod
    def identify_least_confident_skus(
        forecast_results: List[Dict[str, Any]], 
        top_n: int = 10
    ) -> List[Dict[str, Any]]:
        """
        Ranks and extracts the Top N Least-Confident SKUs based on multi-criteria uncertainty:
        1. Relative Prediction Interval Width ((Upper - Lower) / Point)
        2. Analogue Novelty (1 - Top Similarity Score)
        3. Inter-Model Disagreement Standard Deviation
        4. Category volatility
        """
        scored_skus = []
        
        for item in forecast_results:
            sku_id = item.get("sku_id")
            pt = max(1.0, float(item.get("total_8w_demand", 100.0)))
            lower = float(item.get("total_lower_8w", 0.0))
            upper = float(item.get("total_upper_8w", 200.0))
            sim = float(item.get("top_similarity_score", 75.0))
            disagree = float(item.get("model_disagreement_std", 5.0))
            
            # 1. Relative Interval Width component (0 to 40 pts)
            rel_width = (upper - lower) / pt
            interval_score = min(40.0, rel_width * 20.0)
            
            # 2. Analogue Novelty component (0 to 35 pts)
            # 85% sim -> 0 penalty; 50% sim -> 35 penalty
            novelty_score = max(0.0, min(35.0, (85.0 - sim) * 1.0))
            
            # 3. Model Disagreement component (0 to 25 pts)
            rel_disagree = disagree / pt
            disagree_score = min(25.0, rel_disagree * 100.0)
            
            composite_risk = round(interval_score + novelty_score + disagree_score, 1)
            composite_risk = min(100.0, max(5.0, composite_risk))
            
            # Risk drivers
            drivers = []
            if sim < 70.0:
                drivers.append(f"High product novelty: Nearest analogue has only {sim:.1f}% attribute similarity.")
            if rel_width > 1.2:
                drivers.append(f"Wide 8-week prediction spread ({int(lower)} to {int(upper)} units; {rel_width:.1f}x of mean).")
            if disagree > 15.0 or rel_disagree > 0.15:
                drivers.append(f"High model divergence (Analogue vs ML spread: ±{disagree:.1f} units/week).")
            if not drivers:
                drivers.append("Moderate launch uncertainty across early sales ramp.")
                
            # Recommended buyer actions based on risk profile
            if composite_risk >= 75.0:
                tier = "Critical Uncertainty"
                action = "Split Initial Buy: Commit to 40% initial order with supplier reorder lead-time trigger after Week 2 sell-through data."
            elif composite_risk >= 55.0:
                tier = "High Uncertainty"
                action = "Concentrated Cluster Rollout: Restrict first wave allocation to Flagship & High-Volume Suburban stores to preserve liquidity."
            else:
                tier = "Elevated Caution"
                action = "Safety Stock Hedging: Apply conservative 0.55 critical fractile to limit markdown exposure."

            scored_skus.append({
                "sku_id": sku_id,
                "product_name": item.get("product_name", sku_id),
                "category": item.get("category", "General"),
                "subcategory": item.get("subcategory", "General"),
                "brand_tier": item.get("brand_tier", "Mainstream"),
                "retail_price": float(item.get("retail_price", 50.0)),
                "point_forecast_8w": round(pt, 1),
                "total_lower_8w": round(lower, 1),
                "total_upper_8w": round(upper, 1),
                "interval_width_8w": round(upper - lower, 1),
                "top_similarity_score": round(sim, 1),
                "model_disagreement_std": round(disagree, 2),
                "composite_risk_score": composite_risk,
                "risk_tier": tier,
                "risk_drivers": drivers,
                "recommended_buyer_action": action
            })
            
        # Sort descending by composite risk score
        scored_skus.sort(key=lambda x: x["composite_risk_score"], reverse=True)
        return scored_skus[:top_n]
