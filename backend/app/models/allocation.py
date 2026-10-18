import json
from typing import List, Dict, Any
import numpy as np
import pandas as pd
from app.core.config import STORE_CLUSTERS

class StoreClusterAllocator:
    @staticmethod
    def allocate_inventory(
        total_quantity: int,
        category: str = "Apparel",
        brand_tier: str = "Mainstream",
        clusters_df: pd.DataFrame = None
    ) -> Dict[str, Any]:
        """
        Allocates total recommended initial inventory Q* across store clusters.
        Guarantees EXACT integer sum reconciliation using the Largest Remainder Method (Hamilton-Hare).
        """
        q_target = max(0, int(total_quantity))
        if q_target == 0:
            return {
                "total_recommended_quantity": 0,
                "allocated_sum": 0,
                "reconciliation_check": True,
                "clusters": []
            }
            
        cluster_list = STORE_CLUSTERS
        if clusters_df is not None and not clusters_df.empty:
            # Load custom clusters if provided
            cluster_list = []
            for _, row in clusters_df.iterrows():
                cluster_list.append({
                    "id": str(row.get("cluster_id", f"c_{_}")),
                    "name": str(row.get("cluster_name", f"Cluster {_}")),
                    "store_count": int(row.get("store_count", 20)),
                    "capacity_weight": float(row.get("base_capacity_weight", 0.20))
                })

        # Calculate affinity-adjusted weights
        raw_weights = []
        for c in cluster_list:
            base_w = c["capacity_weight"]
            
            # Affinity adjustments
            mult = 1.0
            if brand_tier in ["Premium", "Luxury"]:
                if "Flagship" in c["name"] or "Boutique" in c["name"]:
                    mult = 1.35
                elif "Regional" in c["name"]:
                    mult = 0.70
            elif brand_tier == "Budget":
                if "Power Center" in c["name"] or "Regional" in c["name"]:
                    mult = 1.30
                elif "Boutique" in c["name"]:
                    mult = 0.60
                    
            raw_weights.append(base_w * mult)
            
        total_w = sum(raw_weights)
        norm_weights = [w / total_w for w in raw_weights]
        
        # Largest Remainder Method (Hamilton-Hare)
        raw_quotas = [q_target * w for w in norm_weights]
        integer_allocations = [int(np.floor(q)) for q in raw_quotas]
        remainders = [q - int(np.floor(q)) for q in raw_quotas]
        
        shortfall = q_target - sum(integer_allocations)
        
        # Rank by largest remainder
        ranked_indices = np.argsort(remainders)[::-1]
        for i in range(shortfall):
            idx = ranked_indices[i]
            integer_allocations[idx] += 1
            
        # Compile cluster allocation records
        results = []
        for i, c in enumerate(cluster_list):
            alloc_qty = integer_allocations[i]
            store_cnt = max(1, c["store_count"])
            avg_per_store = round(alloc_qty / store_cnt, 1)
            pct_share = round((alloc_qty / q_target) * 100.0, 1) if q_target > 0 else 0.0
            
            results.append({
                "cluster_id": c["id"],
                "cluster_name": c["name"],
                "store_count": store_cnt,
                "allocated_units": alloc_qty,
                "share_pct": pct_share,
                "avg_units_per_store": avg_per_store,
                "target_weight": round(norm_weights[i] * 100.0, 1)
            })
            
        allocated_sum = sum(integer_allocations)
        
        return {
            "total_recommended_quantity": q_target,
            "allocated_sum": allocated_sum,
            "reconciliation_check": allocated_sum == q_target,
            "category": category,
            "brand_tier": brand_tier,
            "clusters": results
        }
