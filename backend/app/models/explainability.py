from typing import Dict, Any, List
import numpy as np
import pandas as pd

class ExplainabilityEngine:
    @staticmethod
    def explain_sku_forecast(
        sku_dict: Dict[str, Any],
        top_analogues: List[Dict[str, Any]],
        feature_importances: List[Dict[str, Any]],
        uncertainty_info: Dict[str, Any],
        model_predictions: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates genuine explainability artifact for retail buyers:
        - Analogue comparisons
        - Positive/negative demand drivers
        - Model consensus
        - Plain English narrative
        """
        sku_id = sku_dict.get("sku_id", "Unknown")
        cat = sku_dict.get("category", "General")
        subcat = sku_dict.get("subcategory", "General")
        price = float(sku_dict.get("retail_price", 50.0))
        brand = sku_dict.get("brand_tier", "Mainstream")
        mktg = sku_dict.get("marketing_level", "Standard")
        
        # 1. Attribute Driver Decomposition (Impact vs Category Baseline)
        drivers = []
        
        # Brand tier impact
        if brand in ["Premium", "Luxury"]:
            drivers.append({
                "factor": f"Brand Tier ({brand})",
                "direction": "negative_volume_positive_margin",
                "impact_pct": -22.0 if brand == "Premium" else -45.0,
                "description": f"Higher price positioning dampens unit volume by ~{22 if brand=='Premium' else 45}%, compensated by premium gross margin."
            })
        elif brand == "Budget":
            drivers.append({
                "factor": "Brand Tier (Budget)",
                "direction": "positive_volume",
                "impact_pct": 35.0,
                "description": "Mass-market value pricing drives ~35% higher baseline unit sales uptake."
            })
            
        # Marketing impact
        if mktg in ["High Impact", "Omnichannel Launch"]:
            lift = 35.0 if mktg == "High Impact" else 65.0
            drivers.append({
                "factor": f"Marketing Campaign ({mktg})",
                "direction": "positive_volume",
                "impact_pct": lift,
                "description": f"Dedicated launch campaign provides estimated +{int(lift)}% early-week launch curve acceleration."
            })
        elif mktg == "None":
            drivers.append({
                "factor": "Marketing Level (None)",
                "direction": "negative_volume",
                "impact_pct": -15.0,
                "description": "Lack of promotional launch push depresses week 1-2 discovery volume by ~15%."
            })
            
        # Price positioning
        if price > 120.0:
            drivers.append({
                "factor": f"Price Point (${price:.2f})",
                "direction": "negative_volume",
                "impact_pct": -18.0,
                "description": f"Retail price above $120 incurs consumer price sensitivity and slower velocity."
            })
        elif price < 35.0:
            drivers.append({
                "factor": f"Accessible Price Point (${price:.2f})",
                "direction": "positive_volume",
                "impact_pct": 20.0,
                "description": "Impulse purchase price band boosts introductory conversion rates."
            })

        # 2. Evaluate Analogue Match Quality
        top_sim = top_analogues[0]["similarity_score"] if top_analogues else 0.0
        avg_top3_sim = np.mean([a["similarity_score"] for a in top_analogues[:3]]) if top_analogues else 0.0
        
        uncertainty_reasons = []
        if top_sim < 72.0:
            uncertainty_reasons.append(
                f"Low maximum historical analogue similarity ({top_sim:.1f}%). No close historical twin exists in the catalog."
            )
        else:
            uncertainty_reasons.append(
                f"Strong analogue match ({top_sim:.1f}%) with historical bestseller '{top_analogues[0]['product_name']}'."
            )
            
        # Check model agreement
        analogue_tot = sum(model_predictions.get("analogue", [0]))
        ml_tot = sum(model_predictions.get("hist_gradient_boosting", [0]))
        model_spread = abs(analogue_tot - ml_tot)
        if model_spread > 40:
            uncertainty_reasons.append(
                f"Model divergence: Analogue curve suggests {int(analogue_tot)} units whereas Gradient Boosting projects {int(ml_tot)} units (spread: {int(model_spread)} units)."
            )
            
        if uncertainty_info.get("uncertainty_score", 0) > 45:
            uncertainty_reasons.append(
                "Prediction interval is wide due to volatility in early launch weeks (weeks 1-3)."
            )

        # 3. Buyer-Friendly Natural Language Executive Summary
        analogue_name = top_analogues[0]["product_name"] if top_analogues else "similar historical items"
        summary_text = (
            f"Forecast for {sku_id} ({brand} {subcat}) is anchored primarily on historical performance of "
            f"'{analogue_name}' (match: {top_sim:.1f}%). "
            f"Key demand drivers include {mktg} marketing support and {brand} brand positioning. "
            f"Uncertainty rating is {uncertainty_info.get('uncertainty_score', 30):.0f}/100. "
            f"Buyers should monitor Week 1 sell-through closely to validate whether adoption follows the "
            f"{'optimistic' if analogue_tot > ml_tot else 'conservative'} projection."
        )

        return {
            "sku_id": sku_id,
            "executive_summary": summary_text,
            "demand_drivers": drivers,
            "top_analogues": top_analogues,
            "feature_importances": feature_importances,
            "uncertainty_reasons": uncertainty_reasons,
            "analogue_fit_score": round(float(avg_top3_sim), 1),
            "model_predictions": model_predictions
        }
