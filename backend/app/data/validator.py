import io
from typing import Dict, Any, List, Optional
import numpy as np
import pandas as pd

REQUIRED_SCHEMAS = {
    "historical_attributes": {
        "required_cols": ["sku_id", "category", "subcategory", "retail_price", "cost_price", "brand_tier"],
        "numeric_cols": ["retail_price", "cost_price"]
    },
    "historical_launch_curves": {
        "required_cols": ["sku_id", "launch_week", "sales_units"],
        "numeric_cols": ["launch_week", "sales_units"]
    },
    "new_sku_attributes": {
        "required_cols": ["sku_id", "category", "retail_price", "cost_price"],
        "numeric_cols": ["retail_price", "cost_price"]
    },
    "store_clusters": {
        "required_cols": ["cluster_id", "cluster_name", "store_count", "base_capacity_weight"],
        "numeric_cols": ["store_count", "base_capacity_weight"]
    },
    "holiday_calendar": {
        "required_cols": ["date", "event_name", "demand_lift_factor"],
        "numeric_cols": ["demand_lift_factor"]
    },
    "hidden_actual_sales": {
        "required_cols": ["sku_id", "launch_week", "sales_units"],
        "numeric_cols": ["launch_week", "sales_units"]
    }
}

COLUMN_SYNONYMS = {
    "sku_id": ["sku", "item_id", "product_id", "skuid", "item_code", "style_id", "id", "article_number"],
    "category": ["cat", "dept", "department", "division", "prod_cat", "category_name"],
    "subcategory": ["sub_category", "subcat", "product_class", "type", "sub_cat"],
    "retail_price": ["price", "msrp", "unit_price", "selling_price", "retail", "list_price"],
    "cost_price": ["cost", "unit_cost", "cogs", "wholesale_price", "purchase_price"],
    "color": ["colour", "shade", "hue", "colorway"],
    "material": ["fabric", "composition", "make", "textile"],
    "brand_tier": ["tier", "brand_segment", "brand", "brand_level"],
    "launch_month": ["month", "release_month", "launch_period", "drop_month"],
    "marketing_level": ["marketing", "promo_level", "marketing_tier", "ad_tier"],
    "marketing_spend_flag": ["mktg_flag", "spend_flag", "marketing_spend", "promo_flag", "has_marketing"],
    "launch_week": ["week", "launch_wk", "wk", "horizon_week", "week_num"],
    "sales_units": ["units", "qty", "demand", "sales", "volume", "sales_quantity", "actual_sales"]
}

class DataValidator:
    @staticmethod
    def validate_dataframe(df: pd.DataFrame, dataset_type: str = "new_sku_attributes") -> Dict[str, Any]:
        schema = REQUIRED_SCHEMAS.get(dataset_type, REQUIRED_SCHEMAS["new_sku_attributes"])
        required_cols = schema["required_cols"]
        numeric_cols = schema.get("numeric_cols", [])
        
        errors = []
        warnings = []
        
        # 1. Check missing columns
        missing_cols = [c for c in required_cols if c not in df.columns]
        if missing_cols:
            errors.append(f"Missing required columns: {', '.join(missing_cols)}")
            
        # 2. Duplicate rows / SKU checks
        duplicate_rows = int(df.duplicated().sum())
        if duplicate_rows > 0:
            warnings.append(f"Found {duplicate_rows} duplicate rows in dataset.")
            
        if "sku_id" in df.columns:
            duplicate_skus = int(df["sku_id"].duplicated().sum())
            if duplicate_skus > 0 and dataset_type in ["historical_attributes", "new_sku_attributes"]:
                errors.append(f"Found {duplicate_skus} duplicate sku_id entries; sku_id must be unique.")
                
        # 3. Missing values analysis
        missing_counts = df.isnull().sum().to_dict()
        total_cells = df.shape[0] * df.shape[1] if df.shape[0] > 0 else 1
        total_missing = sum(missing_counts.values())
        missing_rate = float(total_missing / total_cells)
        
        if missing_rate > 0.15:
            errors.append(f"High missing value rate: {missing_rate:.1%}. Dataset quality insufficient.")
        elif missing_rate > 0:
            warnings.append(f"Found {total_missing} missing values ({missing_rate:.1%} of data). Imputation applied.")
            
        # 4. Numeric validity
        for col in numeric_cols:
            if col in df.columns:
                non_num = df[col].apply(lambda x: not isinstance(x, (int, float, np.number)) or np.isnan(x)).sum()
                if non_num > 0:
                    warnings.append(f"Column '{col}' has {int(non_num)} non-numeric or NaN values.")
                # Non-negative check
                valid_nums = pd.to_numeric(df[col], errors='coerce').dropna()
                if (valid_nums < 0).any():
                    errors.append(f"Column '{col}' contains negative numbers where only positive values are allowed.")
                    
        # 5. Calculate data quality score (0 - 100)
        quality_score = 100.0
        quality_score -= len(errors) * 25.0
        quality_score -= len(warnings) * 5.0
        quality_score -= min(30.0, missing_rate * 100.0)
        quality_score = max(0.0, min(100.0, round(quality_score, 1)))
        
        # Column mapping detection / suggestions using synonyms
        column_mapping = {}
        for col in df.columns:
            lowered = col.lower().strip().replace(" ", "_").replace("-", "_")
            matched = False
            # Check exact match
            for req in required_cols:
                if lowered == req:
                    column_mapping[col] = req
                    matched = True
                    break
            # Check synonyms
            if not matched:
                for req in required_cols:
                    syns = COLUMN_SYNONYMS.get(req, [])
                    if lowered in syns or any(s in lowered for s in syns):
                        column_mapping[col] = req
                        matched = True
                        break
            if not matched:
                column_mapping[col] = col
                
        return {
            "is_valid": len(errors) == 0,
            "quality_score": quality_score,
            "row_count": len(df),
            "column_count": len(df.columns),
            "columns": list(df.columns),
            "errors": errors,
            "warnings": warnings,
            "missing_counts": {k: int(v) for k, v in missing_counts.items() if v > 0},
            "duplicate_count": duplicate_rows,
            "column_mapping": column_mapping,
            "preview": df.head(10).to_dict(orient="records")
        }

    @staticmethod
    def generate_quality_report_csv(validation_result: Dict[str, Any]) -> str:
        report_lines = [
            "Data Quality Audit Report - LaunchWise AI",
            f"Overall Quality Score,{validation_result['quality_score']}%",
            f"Valid,{validation_result['is_valid']}",
            f"Row Count,{validation_result['row_count']}",
            f"Column Count,{validation_result['column_count']}",
            f"Duplicate Rows,{validation_result['duplicate_count']}",
            "",
            "Identified Errors:"
        ]
        if validation_result["errors"]:
            for e in validation_result["errors"]:
                report_lines.append(f"ERROR,{e.replace(',', ';')}")
        else:
            report_lines.append("None,No critical validation errors identified.")
            
        report_lines.append("")
        report_lines.append("Identified Warnings / Advisories:")
        if validation_result["warnings"]:
            for w in validation_result["warnings"]:
                report_lines.append(f"WARNING,{w.replace(',', ';')}")
        else:
            report_lines.append("None,No warnings identified.")
            
        return "\n".join(report_lines)
