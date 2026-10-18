from typing import Tuple, List, Dict, Any
import numpy as np
import pandas as pd
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer

CATEGORICAL_FEATURES = [
    "category", "subcategory", "color", "material",
    "price_band", "brand_tier", "launch_month", "marketing_level"
]

NUMERICAL_FEATURES = [
    "retail_price", "cost_price", "margin_rate"
]

class FeaturePipeline:
    def __init__(self):
        self.preprocessor = None
        self.feature_names = []
        self.is_fitted = False
        
    def _prepare_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        df_clean = df.copy()
        df_clean.columns = [str(c) for c in df_clean.columns]
        
        # Ensure numeric fields exist
        if "retail_price" not in df_clean.columns:
            df_clean["retail_price"] = 50.0
        if "cost_price" not in df_clean.columns:
            df_clean["cost_price"] = df_clean["retail_price"] * 0.5
            
        df_clean["retail_price"] = pd.to_numeric(df_clean["retail_price"], errors="coerce").fillna(50.0)
        df_clean["cost_price"] = pd.to_numeric(df_clean["cost_price"], errors="coerce").fillna(25.0)
        df_clean["margin_rate"] = (df_clean["retail_price"] - df_clean["cost_price"]) / np.maximum(df_clean["retail_price"], 1.0)
        
        # Fill missing categoricals
        for col in CATEGORICAL_FEATURES:
            if col not in df_clean.columns:
                df_clean[col] = "Unknown"
            else:
                df_clean[col] = df_clean[col].fillna("Unknown").astype(str)
                
        return df_clean

    def fit(self, df: pd.DataFrame):
        df_prep = self._prepare_dataframe(df)
        
        cat_present = [c for c in CATEGORICAL_FEATURES if c in df_prep.columns]
        num_present = [n for n in NUMERICAL_FEATURES if n in df_prep.columns]
        
        self.preprocessor = ColumnTransformer(
            transformers=[
                ("num", StandardScaler(), num_present),
                ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), cat_present)
            ]
        )
        self.preprocessor.fit(df_prep)
        
        # Build human-readable feature names
        num_names = [f"num__{n}" for n in num_present]
        cat_encoder = self.preprocessor.named_transformers_["cat"]
        cat_names = [f"cat__{name}" for name in cat_encoder.get_feature_names_out(cat_present)]
        self.feature_names = num_names + cat_names
        self.is_fitted = True
        return self

    def transform(self, df: pd.DataFrame) -> np.ndarray:
        if not self.is_fitted:
            raise ValueError("FeaturePipeline must be fitted before transforming.")
        df_prep = self._prepare_dataframe(df)
        return self.preprocessor.transform(df_prep)

    def fit_transform(self, df: pd.DataFrame) -> np.ndarray:
        return self.fit(df).transform(df)
