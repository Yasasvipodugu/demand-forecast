from typing import Dict, Any, List, Tuple
import numpy as np
import pandas as pd

class CalibratedConformalEngine:
    def __init__(self, confidence_level: float = 0.80):
        self.confidence_level = confidence_level
        self.is_calibrated = False
        # Calibrated residual quantiles per horizon week (1 to 8)
        self.horizon_quantiles_80 = np.zeros(8)
        self.horizon_quantiles_90 = np.zeros(8)
        self.calibration_metrics = {}
        
    def calibrate(self, y_true: np.ndarray, y_pred: np.ndarray):
        """
        Calibrate prediction intervals using Split Conformal Prediction on held-out validation launches.
        y_true, y_pred are shape (N_val, 8).
        """
        n_val = y_true.shape[0]
        residuals = np.abs(y_true - y_pred)  # (N_val, 8)
        
        # Conformal quantile level adjusted for finite-sample validity: ceil((n + 1)(1 - alpha)) / n
        level_80 = min(1.0, np.ceil((n_val + 1) * 0.80) / n_val)
        level_90 = min(1.0, np.ceil((n_val + 1) * 0.90) / n_val)
        
        for w in range(8):
            w_res = residuals[:, w]
            self.horizon_quantiles_80[w] = float(np.quantile(w_res, level_80))
            self.horizon_quantiles_90[w] = float(np.quantile(w_res, level_90))
            
        # Compute empirical validation coverage & width on calibration split
        l_80 = np.maximum(0.0, y_pred - self.horizon_quantiles_80)
        u_80 = y_pred + self.horizon_quantiles_80
        
        l_90 = np.maximum(0.0, y_pred - self.horizon_quantiles_90)
        u_90 = y_pred + self.horizon_quantiles_90
        
        coverage_80 = float(np.mean((y_true >= l_80) & (y_true <= u_80)))
        mpiw_80 = float(np.mean(u_80 - l_80))
        
        coverage_90 = float(np.mean((y_true >= l_90) & (y_true <= u_90)))
        mpiw_90 = float(np.mean(u_90 - l_90))
        
        self.calibration_metrics = {
            "n_calibration_samples": n_val,
            "nominal_coverage_80": 0.80,
            "empirical_picp_80": round(coverage_80, 4),
            "mpiw_80": round(mpiw_80, 2),
            "nominal_coverage_90": 0.90,
            "empirical_picp_90": round(coverage_90, 4),
            "mpiw_90": round(mpiw_90, 2),
            "is_calibrated": True
        }
        self.is_calibrated = True
        return self

    def calculate_bounds(
        self, 
        point_forecast: List[float], 
        top_similarity: float = 85.0,
        model_disagreement: float = 5.0,
        confidence_level: float = 0.80
    ) -> Dict[str, Any]:
        """
        Produces lower and upper prediction bounds scaled by SKU cold-start uncertainty.
        If similarity to historical analogues is low (<70%), prediction interval naturally widens.
        """
        arr_pred = np.array(point_forecast)
        
        # Base conformal quantiles
        if confidence_level >= 0.89:
            base_q = self.horizon_quantiles_90.copy()
        else:
            base_q = self.horizon_quantiles_80.copy()
            
        # Uncertainty modifier based on cold-start distance and model disagreement
        # High similarity (>85%) -> factor ~1.0
        # Low similarity (<60%) -> factor up to 1.45
        sim_penalty = max(0.0, (85.0 - top_similarity) / 85.0) * 0.45
        disagree_penalty = min(0.35, (model_disagreement / 25.0) * 0.35)
        scale_factor = 1.0 + sim_penalty + disagree_penalty
        
        scaled_q = base_q * scale_factor
        
        lower_bound = np.maximum(0.0, np.round(arr_pred - scaled_q, 1))
        upper_bound = np.round(arr_pred + scaled_q, 1)
        
        total_lower = round(float(np.sum(lower_bound)), 1)
        total_upper = round(float(np.sum(upper_bound)), 1)
        total_pred = round(float(np.sum(arr_pred)), 1)
        
        # Relative uncertainty score (0 - 100)
        relative_width = (total_upper - total_lower) / max(1.0, total_pred)
        uncertainty_score = min(100.0, round(relative_width * 50.0, 1))
        
        return {
            "confidence_level": confidence_level,
            "scale_factor": round(float(scale_factor), 3),
            "lower_bounds": lower_bound.tolist(),
            "upper_bounds": upper_bound.tolist(),
            "total_lower_8w": total_lower,
            "total_upper_8w": total_upper,
            "uncertainty_score": uncertainty_score,
            "interval_width_8w": round(total_upper - total_lower, 1)
        }
