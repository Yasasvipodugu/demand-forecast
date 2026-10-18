from typing import Dict, Any, List
import numpy as np
from scipy.stats import norm, lognorm

class NewsvendorOptimizer:
    @staticmethod
    def calculate_recommendation(
        total_forecast_demand: float,
        interval_lower: float,
        interval_upper: float,
        understock_cost: float = 40.0,
        overstock_cost: float = 15.0,
        retail_price: float = 65.0,
        unit_cost: float = 25.0
    ) -> Dict[str, Any]:
        """
        Implements classical Newsvendor Q* = F^-1( Cu / (Cu + Co) ).
        Demand distribution approximated using forecast mean and calibrated interval dispersion.
        """
        # Ensure positive costs
        cu = max(0.01, float(understock_cost))
        co = max(0.01, float(overstock_cost))
        
        # 1. Critical Fractile (Service Level)
        critical_fractile = cu / (cu + co)
        critical_fractile = min(0.999, max(0.001, critical_fractile))
        
        # 2. Demand distribution parameters
        mu = max(1.0, float(total_forecast_demand))
        # Interval represents 80% coverage (z = 1.28155)
        # sigma derived from prediction interval width
        half_width = max(1.0, (interval_upper - interval_lower) / 2.0)
        sigma = max(1.0, half_width / 1.28155)
        
        # 3. Compute Q* using Gaussian / Truncated Normal inverse CDF
        z_score = float(norm.ppf(critical_fractile))
        q_star_raw = mu + z_score * sigma
        q_star = max(0, int(np.round(q_star_raw)))
        
        # Safety stock
        safety_stock = q_star - int(np.round(mu))
        
        # 4. Probabilities
        # Stockout risk: P(Demand > Q*)
        stockout_risk = float(1.0 - norm.cdf((q_star - mu) / sigma))
        # Excess risk: P(Demand <= Q*)
        excess_risk = float(norm.cdf((q_star - mu) / sigma))
        
        # Expected leftover & shortages
        # E[Leftover] = integral_0^Q (Q - x) f(x) dx
        std_z = (q_star - mu) / sigma
        expected_shortage = float(sigma * (norm.pdf(std_z) - std_z * (1.0 - norm.cdf(std_z))))
        expected_leftover = float(q_star - mu + expected_shortage)
        
        # Expected profit compared to ordering exactly point forecast mu
        # Profit(Q) = Price * Min(D, Q) - Cost * Q + Salvage * Max(0, Q - D)
        # Expected value added from newsvendor optimization
        opt_loss = cu * expected_shortage + co * expected_leftover
        
        # 5. Natural Language Explanation
        if critical_fractile >= 0.70:
            rationale = (
                f"High-margin regime (Critical Fractile: {critical_fractile:.1%}). Because understocking cost "
                f"(${cu:.2f}) significantly outweighs overstocking cost (${co:.2f}), the algorithm recommends "
                f"a safety buffer of +{safety_stock} units ({q_star} total) to guard against costly lost revenue."
            )
        elif critical_fractile <= 0.40:
            rationale = (
                f"Cost-sensitive / markdown-risk regime (Critical Fractile: {critical_fractile:.1%}). Overstocking cost "
                f"(${co:.2f}) is substantially higher than understocking cost (${cu:.2f}). The algorithm recommends a "
                f"conservative order quantity of {q_star} units ({safety_stock} units below expected demand) to minimize inventory write-downs."
            )
        else:
            rationale = (
                f"Balanced cost profile (Critical Fractile: {critical_fractile:.1%}). Understocking and overstocking risks "
                f"are comparable. Recommended initial order of {q_star} units aligns closely with the expected 8-week forecast."
            )
            
        # 6. Sensitivity curve data (varying critical fractile from 0.1 to 0.9)
        sensitivity_curve = []
        for cf in [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70, 0.80, 0.90]:
            z = float(norm.ppf(cf))
            q_cf = max(0, int(np.round(mu + z * sigma)))
            sensitivity_curve.append({
                "critical_fractile": round(cf, 2),
                "fractile_pct": f"{int(cf*100)}%",
                "recommended_q": q_cf,
                "safety_stock": q_cf - int(np.round(mu))
            })

        return {
            "expected_demand_8w": round(mu, 1),
            "recommended_initial_buy": q_star,
            "safety_stock": safety_stock,
            "understock_cost": cu,
            "overstock_cost": co,
            "critical_fractile": round(critical_fractile, 3),
            "critical_fractile_pct": round(critical_fractile * 100.0, 1),
            "stockout_risk_pct": round(stockout_risk * 100.0, 1),
            "excess_risk_pct": round(excess_risk * 100.0, 1),
            "expected_shortage_units": round(expected_shortage, 1),
            "expected_leftover_units": round(expected_leftover, 1),
            "explanation": rationale,
            "sensitivity_curve": sensitivity_curve
        }
