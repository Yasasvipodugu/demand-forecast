from typing import List, Dict, Any, Tuple
import numpy as np
import pandas as pd

class AnalogueSimilarityEngine:
    def __init__(self, historical_attributes: pd.DataFrame, historical_launch_curves: pd.DataFrame):
        self.hist_attr = historical_attributes.copy()
        self.hist_curves = historical_launch_curves.copy()
        
        # Precompute price range for continuous normalization
        self.min_price = float(self.hist_attr["retail_price"].min())
        self.max_price = float(self.hist_attr["retail_price"].max())
        self.price_range = max(1.0, self.max_price - self.min_price)
        
        # Group historical launch curves by sku_id: sku_id -> list of 8 week sales
        self.curve_lookup = {}
        for sku, group in self.hist_curves.groupby("sku_id"):
            sorted_weeks = group.sort_values("launch_week")
            weeks_sales = sorted_weeks["sales_units"].values[:8].tolist()
            if len(weeks_sales) == 8:
                self.curve_lookup[sku] = weeks_sales

        # Precompute dict records for 100x faster similarity iterations
        self.hist_records = self.hist_attr.to_dict(orient="records")

    def calculate_similarity_pair(self, item_a: Dict[str, Any], item_b: Dict[str, Any]) -> Tuple[float, Dict[str, float]]:
        """
        Mixed-attribute Gower similarity metric in [0, 1].
        Calculates categorical overlap and continuous price proximity.
        """
        cat_match = 1.0 if str(item_a.get("category", "")).strip().lower() == str(item_b.get("category", "")).strip().lower() else 0.0
        subcat_match = 1.0 if str(item_a.get("subcategory", "")).strip().lower() == str(item_b.get("subcategory", "")).strip().lower() else 0.0
        brand_match = 1.0 if str(item_a.get("brand_tier", "")).strip().lower() == str(item_b.get("brand_tier", "")).strip().lower() else 0.0
        material_match = 1.0 if str(item_a.get("material", "")).strip().lower() == str(item_b.get("material", "")).strip().lower() else 0.0
        color_match = 1.0 if str(item_a.get("color", "")).strip().lower() == str(item_b.get("color", "")).strip().lower() else 0.0
        
        # Marketing spend flag / level match
        flag_a = int(item_a.get("marketing_spend_flag", 1 if str(item_a.get("marketing_level")) in ["High Impact", "Omnichannel Launch"] else 0))
        flag_b = int(item_b.get("marketing_spend_flag", 1 if str(item_b.get("marketing_level")) in ["High Impact", "Omnichannel Launch"] else 0))
        marketing_match = 1.0 if flag_a == flag_b else 0.0
        
        # Launch month match (seasonal proximity)
        month_a = str(item_a.get("launch_month", "")).strip().lower()
        month_b = str(item_b.get("launch_month", "")).strip().lower()
        month_match = 1.0 if month_a == month_b else 0.0
        
        # Normalized continuous price similarity
        price_a = float(item_a.get("retail_price", 50.0))
        price_b = float(item_b.get("retail_price", 50.0))
        price_diff = abs(price_a - price_b) / self.price_range
        price_sim = max(0.0, 1.0 - price_diff)
        
        # Standard weights reflecting retail cold-start importance
        weights = {
            "category": 0.30,
            "subcategory": 0.20,
            "price": 0.15,
            "brand_tier": 0.10,
            "launch_month": 0.10,
            "marketing_spend": 0.05,
            "material": 0.05,
            "color": 0.05
        }
        
        dim_scores = {
            "category": cat_match,
            "subcategory": subcat_match,
            "price": price_sim,
            "brand_tier": brand_match,
            "launch_month": month_match,
            "marketing_spend": marketing_match,
            "material": material_match,
            "color": color_match
        }
        
        # If category completely differs, penalize heavily
        if cat_match == 0.0:
            total_sim = 0.20 * sum(dim_scores[k] * weights[k] for k in weights)
        else:
            total_sim = sum(dim_scores[k] * weights[k] for k in weights)
            
        return round(float(total_sim), 4), dim_scores

    def find_top_analogues(self, new_sku_dict: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Retrieves top K historical analogues with similarity score and launch curve.
        """
        cat = str(new_sku_dict.get("category", "")).lower()
        candidates = [r for r in self.hist_records if str(r.get("category", "")).lower() == cat]
        if not candidates or len(candidates) < top_k:
            candidates = self.hist_records
            
        scores = []
        for hist_row in candidates:
            hist_sku = hist_row["sku_id"]
            if hist_sku not in self.curve_lookup:
                continue
                
            sim, dim_scores = self.calculate_similarity_pair(new_sku_dict, hist_row)
            scores.append((sim, hist_row, dim_scores, self.curve_lookup[hist_sku]))
            
        # Sort descending by similarity
        scores.sort(key=lambda x: x[0], reverse=True)
        top_matches = scores[:top_k]
        
        results = []
        for sim, hist_row, dims, curve in top_matches:
            results.append({
                "sku_id": hist_row["sku_id"],
                "product_name": hist_row.get("product_name", hist_row["sku_id"]),
                "category": hist_row.get("category"),
                "subcategory": hist_row.get("subcategory"),
                "brand_tier": hist_row.get("brand_tier"),
                "retail_price": float(hist_row.get("retail_price", 0.0)),
                "color": hist_row.get("color"),
                "material": hist_row.get("material"),
                "similarity_score": round(sim * 100.0, 1),
                "launch_curve": [int(x) for x in curve],
                "dimension_scores": {k: round(v * 100.0, 1) for k, v in dims.items()}
            })
            
        return results

    def predict_analogue_curve(self, new_sku_dict: Dict[str, Any], top_k: int = 5) -> Tuple[List[float], List[Dict[str, Any]]]:
        """
        Produces weighted 8-week launch forecast based on top K analogues.
        """
        analogues = self.find_top_analogues(new_sku_dict, top_k=top_k)
        if not analogues:
            return [50.0] * 8, []
            
        # Weighted combination of launch curves
        sim_scores = [max(1e-4, a["similarity_score"]) for a in analogues]
        total_weight = sum(sim_scores)
        norm_weights = [s / total_weight for s in sim_scores]
        
        forecast = np.zeros(8)
        for w, a in zip(norm_weights, analogues):
            forecast += w * np.array(a["launch_curve"])
            
        return [round(float(x), 1) for x in forecast], analogues
