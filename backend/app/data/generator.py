import json
import random
from datetime import datetime, timedelta
import numpy as np
import pandas as pd
from app.core.config import SYNTHETIC_DATA_DIR, STORE_CLUSTERS

CATEGORIES = {
    "Apparel": {
        "subcategories": ["Hoodies & Sweats", "T-Shirts", "Denim & Pants", "Dresses", "Jackets & Coats"],
        "materials": ["Organic Cotton", "Polyester Blend", "Linen", "Denim", "Recycled Wool"],
        "base_price_range": (25.0, 180.0),
        "base_weekly_sales": 85.0
    },
    "Footwear": {
        "subcategories": ["Running Sneakers", "Lifestyle Trainers", "Leather Boots", "Slip-on Loafers", "Sandals"],
        "materials": ["Mesh & EVA", "Full-Grain Leather", "Suede", "Canvas", "Synthetic Leather"],
        "base_price_range": (55.0, 240.0),
        "base_weekly_sales": 70.0
    },
    "Electronics": {
        "subcategories": ["Wireless Earbuds", "Smart Home Hubs", "Power Banks", "Bluetooth Speakers", "Fitness Trackers"],
        "materials": ["Anodized Aluminum", "Recycled Plastic", "Silicone", "Tempered Glass", "Polycarbonate"],
        "base_price_range": (35.0, 220.0),
        "base_weekly_sales": 95.0
    },
    "Home & Living": {
        "subcategories": ["Ceramic Dinnerware", "Aroma Diffusers", "Linen Throw Blankets", "Desk Organizers", "Wall Clocks"],
        "materials": ["Ceramic", "Bamboo & Wood", "Woven Cotton", "Brushed Brass", "Stoneware"],
        "base_price_range": (20.0, 140.0),
        "base_weekly_sales": 50.0
    },
    "Beauty & Grooming": {
        "subcategories": ["Hydrating Serums", "Botanical Cleansers", "Mineral Sunscreen", "Beard Oils", "Clay Masks"],
        "materials": ["Glass Bottle", "Aluminum Tube", "Bio-Plastic", "Post-Consumer Resin", "Amber Jar"],
        "base_price_range": (18.0, 95.0),
        "base_weekly_sales": 110.0
    }
}

COLORS = [
    "Midnight Black", "Arctic White", "Slate Navy", "Sage Green",
    "Terracotta", "Heather Gray", "Sand Beige", "Deep Burgundy",
    "Cobalt Blue", "Mustard Ochre"
]

BRAND_TIERS = {
    "Budget": {"multiplier": 1.40, "price_mult": 0.65, "margin": 0.35},
    "Mainstream": {"multiplier": 1.00, "price_mult": 1.00, "margin": 0.45},
    "Premium": {"multiplier": 0.75, "price_mult": 1.60, "margin": 0.58},
    "Luxury": {"multiplier": 0.45, "price_mult": 2.40, "margin": 0.70}
}

MARKETING_LEVELS = {
    "None": 0.85,
    "Standard": 1.00,
    "High Impact": 1.35,
    "Omnichannel Launch": 1.70
}

def determine_price_band(price: float) -> str:
    if price < 40:
        return "Under $40"
    elif price < 80:
        return "$40 - $80"
    elif price < 150:
        return "$80 - $150"
    else:
        return "Over $150"

def generate_holiday_calendar() -> pd.DataFrame:
    base_year = 2023
    holidays = []
    
    events = [
        ("New Year Promotion", 1, 1, 1.25),
        ("Valentine Special", 2, 14, 1.30),
        ("Spring Refresh", 3, 20, 1.15),
        ("Memorial Day Sale", 5, 27, 1.45),
        ("Summer Clearance", 7, 4, 1.35),
        ("Back to School", 8, 20, 1.50),
        ("Labor Day Blitz", 9, 2, 1.40),
        ("Fall Fashion Drop", 10, 15, 1.25),
        ("Black Friday", 11, 24, 2.60),
        ("Cyber Week", 11, 28, 2.40),
        ("Super Saturday", 12, 18, 2.10),
        ("Holiday Peak / Boxing Day", 12, 26, 1.80)
    ]
    
    for year in range(base_year, base_year + 3):
        for name, m, d, lift in events:
            date_str = f"{year}-{m:02d}-{min(d, 28):02d}"
            holidays.append({
                "date": date_str,
                "event_name": name,
                "year": year,
                "month": m,
                "demand_lift_factor": lift
            })
            
    df = pd.DataFrame(holidays)
    return df

def generate_synthetic_benchmark(
    n_historical: int = 1200,
    n_new: int = 150,
    n_weeks: int = 156,
    seed: int = 42
):
    np.random.seed(seed)
    random.seed(seed)
    
    categories_list = list(CATEGORIES.keys())
    
    # 1. Generate Historical Product Attributes
    hist_records = []
    start_date = datetime(2023, 1, 2)
    
    for i in range(1, n_historical + 1):
        sku_id = f"HIST-SKU-{i:04d}"
        cat = random.choice(categories_list)
        cat_info = CATEGORIES[cat]
        subcat = random.choice(cat_info["subcategories"])
        color = random.choice(COLORS)
        material = random.choice(cat_info["materials"])
        brand_tier = np.random.choice(
            list(BRAND_TIERS.keys()), 
            p=[0.25, 0.45, 0.22, 0.08]
        )
        marketing = np.random.choice(
            list(MARKETING_LEVELS.keys()), 
            p=[0.30, 0.40, 0.20, 0.10]
        )
        
        # Pricing
        p_min, p_max = cat_info["base_price_range"]
        raw_price = np.random.uniform(p_min, p_max) * BRAND_TIERS[brand_tier]["price_mult"]
        retail_price = round(raw_price / 5.0) * 5.0 - 0.01  # e.g. 79.99
        margin = BRAND_TIERS[brand_tier]["margin"]
        cost_price = round(retail_price * (1.0 - margin), 2)
        price_band = determine_price_band(retail_price)
        
        # Historical launch week index (staggered across first 104 weeks)
        launch_week_idx = random.randint(0, 100)
        launch_date = start_date + timedelta(weeks=launch_week_idx)
        launch_month = launch_date.strftime("%B")
        
        # Base product appeal factor (intrinsic quality/buzz)
        appeal_factor = np.random.lognormal(mean=0.0, sigma=0.28)
        
        hist_records.append({
            "sku_id": sku_id,
            "product_name": f"{brand_tier} {color} {subcat}",
            "category": cat,
            "subcategory": subcat,
            "color": color,
            "material": material,
            "price_band": price_band,
            "brand_tier": brand_tier,
            "retail_price": retail_price,
            "cost_price": cost_price,
            "launch_date": launch_date.strftime("%Y-%m-%d"),
            "launch_month": launch_month,
            "marketing_level": marketing,
            "marketing_spend_flag": 1 if marketing in ["High Impact", "Omnichannel Launch"] else 0,
            "launch_week_idx": launch_week_idx,
            "appeal_factor": appeal_factor
        })
        
    df_hist_attr = pd.DataFrame(hist_records)
    
    # 2. Generate 150 Cold-Start New SKUs (NO sales history, attributes only)
    new_records = []
    for i in range(1, n_new + 1):
        sku_id = f"NEW-SKU-{i:03d}"
        cat = random.choice(categories_list)
        cat_info = CATEGORIES[cat]
        subcat = random.choice(cat_info["subcategories"])
        color = random.choice(COLORS)
        material = random.choice(cat_info["materials"])
        brand_tier = np.random.choice(
            list(BRAND_TIERS.keys()), 
            p=[0.25, 0.45, 0.22, 0.08]
        )
        marketing = np.random.choice(
            list(MARKETING_LEVELS.keys()), 
            p=[0.25, 0.45, 0.20, 0.10]
        )
        
        p_min, p_max = cat_info["base_price_range"]
        raw_price = np.random.uniform(p_min, p_max) * BRAND_TIERS[brand_tier]["price_mult"]
        retail_price = round(raw_price / 5.0) * 5.0 - 0.01
        margin = BRAND_TIERS[brand_tier]["margin"]
        cost_price = round(retail_price * (1.0 - margin), 2)
        price_band = determine_price_band(retail_price)
        
        # New launches scheduled for next quarter
        launch_date = datetime(2026, 11, 1) + timedelta(weeks=random.randint(0, 4))
        launch_month = launch_date.strftime("%B")
        
        new_records.append({
            "sku_id": sku_id,
            "product_name": f"{brand_tier} {color} {subcat} (NextGen)",
            "category": cat,
            "subcategory": subcat,
            "color": color,
            "material": material,
            "price_band": price_band,
            "brand_tier": brand_tier,
            "retail_price": retail_price,
            "cost_price": cost_price,
            "launch_date": launch_date.strftime("%Y-%m-%d"),
            "launch_month": launch_month,
            "marketing_level": marketing,
            "marketing_spend_flag": 1 if marketing in ["High Impact", "Omnichannel Launch"] else 0,
            "notes": "Cold-start product awaiting 8-week launch forecast and inventory recommendation"
        })
        
    df_new_attr = pd.DataFrame(new_records)
    
    # 3. Generate Historical Launch Curves (Weeks 1 to 8 of launch)
    # Retail launch curves typically feature:
    # W1: Buzz/launch spike (1.3x)
    # W2: Peak customer uptake (1.5x)
    # W3: Sustained interest (1.25x)
    # W4-W8: Transition to steady-state baseline with slight decay
    launch_curve_profiles = {
        "High Impact Launch": [1.45, 1.80, 1.40, 1.15, 1.00, 0.92, 0.88, 0.85],
        "Steady Growth": [0.80, 1.05, 1.25, 1.35, 1.30, 1.20, 1.15, 1.10],
        "Standard Retail Drop": [1.25, 1.45, 1.20, 1.00, 0.95, 0.90, 0.85, 0.80],
        "Early Flash": [1.70, 1.50, 1.10, 0.85, 0.75, 0.70, 0.65, 0.60]
    }
    
    launch_records = []
    
    for idx, row in df_hist_attr.iterrows():
        sku = row["sku_id"]
        cat = row["category"]
        base_sales = CATEGORIES[cat]["base_weekly_sales"]
        b_mult = BRAND_TIERS[row["brand_tier"]]["multiplier"]
        m_mult = MARKETING_LEVELS[row["marketing_level"]]
        appeal = row["appeal_factor"]
        
        # Pick launch profile archetype
        if row["marketing_level"] in ["Omnichannel Launch", "High Impact"]:
            profile_name = "High Impact Launch"
        elif row["brand_tier"] in ["Premium", "Luxury"]:
            profile_name = "Steady Growth"
        else:
            profile_name = np.random.choice(["Standard Retail Drop", "Early Flash"], p=[0.7, 0.3])
            
        profile = launch_curve_profiles[profile_name]
        
        expected_scale = base_sales * b_mult * m_mult * appeal
        
        for w in range(1, 9):
            shape_factor = profile[w - 1]
            # Realistic Poisson-Gamma variation for demand
            mean_demand = max(5.0, expected_scale * shape_factor)
            actual_sales = int(np.random.negative_binomial(
                n=max(2.0, mean_demand / 3.0),
                p=1.0 / (1.0 + 3.0)
            ))
            
            launch_records.append({
                "sku_id": sku,
                "launch_week": w,
                "sales_units": actual_sales,
                "mean_expected": round(mean_demand, 1),
                "profile_archetype": profile_name
            })
            
    df_launch_curves = pd.DataFrame(launch_records)
    
    # 4. Generate Store Clusters
    cluster_records = []
    cat_weights = {
        "cluster_1": {"Apparel": 0.30, "Footwear": 0.35, "Electronics": 0.35, "Home & Living": 0.28, "Beauty & Grooming": 0.32},
        "cluster_2": {"Apparel": 0.28, "Footwear": 0.26, "Electronics": 0.27, "Home & Living": 0.32, "Beauty & Grooming": 0.28},
        "cluster_3": {"Apparel": 0.20, "Footwear": 0.18, "Electronics": 0.12, "Home & Living": 0.15, "Beauty & Grooming": 0.24},
        "cluster_4": {"Apparel": 0.14, "Footwear": 0.13, "Electronics": 0.16, "Home & Living": 0.17, "Beauty & Grooming": 0.10},
        "cluster_5": {"Apparel": 0.08, "Footwear": 0.08, "Electronics": 0.10, "Home & Living": 0.08, "Beauty & Grooming": 0.06},
    }
    
    for c in STORE_CLUSTERS:
        cid = c["id"]
        cluster_records.append({
            "cluster_id": cid,
            "cluster_name": c["name"],
            "store_count": c["store_count"],
            "base_capacity_weight": c["capacity_weight"],
            "category_affinity_json": json.dumps(cat_weights[cid])
        })
    df_clusters = pd.DataFrame(cluster_records)
    
    # 5. Generate Holiday Calendar
    df_holidays = generate_holiday_calendar()
    
    # 6. Generate Hidden Actual First-Eight-Week Sales for the 150 New SKUs
    # CRITICAL: These hidden actuals are strictly held out for benchmark evaluation
    # and MUST NEVER be fed into the forecasting models during training or inference.
    hidden_actual_records = []
    for idx, row in df_new_attr.iterrows():
        sku = row["sku_id"]
        cat = row["category"]
        base_sales = CATEGORIES[cat]["base_weekly_sales"]
        b_mult = BRAND_TIERS[row["brand_tier"]]["multiplier"]
        m_mult = MARKETING_LEVELS[row["marketing_level"]]
        
        # Real-world demand includes unobserved product appeal and market reaction
        appeal = np.random.lognormal(mean=0.0, sigma=0.25)
        
        if row["marketing_level"] in ["Omnichannel Launch", "High Impact"]:
            profile_name = "High Impact Launch"
        elif row["brand_tier"] in ["Premium", "Luxury"]:
            profile_name = "Steady Growth"
        else:
            profile_name = np.random.choice(["Standard Retail Drop", "Early Flash"], p=[0.7, 0.3])
            
        profile = launch_curve_profiles[profile_name]
        expected_scale = base_sales * b_mult * m_mult * appeal
        
        for w in range(1, 9):
            shape_factor = profile[w - 1]
            mean_demand = max(5.0, expected_scale * shape_factor)
            actual_sales = int(np.random.negative_binomial(
                n=max(2.0, mean_demand / 3.0),
                p=1.0 / (1.0 + 3.0)
            ))
            hidden_actual_records.append({
                "sku_id": sku,
                "launch_week": w,
                "sales_units": actual_sales,
                "mean_expected": round(mean_demand, 1),
                "revenue": round(actual_sales * row["retail_price"], 2)
            })
    df_hidden_actuals = pd.DataFrame(hidden_actual_records)
    
    # 7. Generate 3 Years of Weekly Sales (156 weeks) for Mature SKUs
    # A realistic sample of 156 weeks for historical SKUs
    three_year_records = []
    for idx, row in df_hist_attr.head(100).iterrows(): # Representative sample across 156 weeks
        sku = row["sku_id"]
        cat = row["category"]
        base_sales = CATEGORIES[cat]["base_weekly_sales"] * BRAND_TIERS[row["brand_tier"]]["multiplier"]
        for week_num in range(1, min(157, n_weeks + 1)):
            # Annual seasonality + noise
            seasonality = 1.0 + 0.25 * np.sin(2 * np.pi * (week_num % 52) / 52.0)
            sales = max(0, int(np.random.poisson(base_sales * seasonality)))
            three_year_records.append({
                "sku_id": sku,
                "calendar_week": week_num,
                "sales_units": sales
            })
    df_three_year = pd.DataFrame(three_year_records)
    
    # Save CSVs to synthetic dir
    df_hist_attr.to_csv(SYNTHETIC_DATA_DIR / "historical_attributes.csv", index=False)
    df_new_attr.to_csv(SYNTHETIC_DATA_DIR / "new_sku_attributes.csv", index=False)
    df_launch_curves.to_csv(SYNTHETIC_DATA_DIR / "historical_launch_curves.csv", index=False)
    df_clusters.to_csv(SYNTHETIC_DATA_DIR / "store_clusters.csv", index=False)
    df_holidays.to_csv(SYNTHETIC_DATA_DIR / "holiday_calendar.csv", index=False)
    df_hidden_actuals.to_csv(SYNTHETIC_DATA_DIR / "hidden_actual_sales.csv", index=False)
    df_three_year.to_csv(SYNTHETIC_DATA_DIR / "three_year_weekly_sales.csv", index=False)
    
    metadata = {
        "dataset_name": "LaunchWise AI Retail Benchmark Dataset (Synthetic)",
        "is_synthetic": True,
        "disclosure": "Synthetically generated benchmark designed specifically for cold-start new product demand forecasting evaluation without sales data leakage. Never claim synthetic results are official benchmark results or that they represent performance on real hidden actuals.",
        "created_at": datetime.now().isoformat(),
        "n_historical_skus": n_historical,
        "n_new_skus": n_new,
        "launch_horizon_weeks": 8,
        "categories": categories_list,
        "files": [
            "historical_attributes.csv",
            "new_sku_attributes.csv",
            "historical_launch_curves.csv",
            "store_clusters.csv",
            "holiday_calendar.csv",
            "hidden_actual_sales.csv",
            "three_year_weekly_sales.csv"
        ]
    }
    with open(SYNTHETIC_DATA_DIR / "metadata.json", "w") as f:
        json.dump(metadata, f, indent=2)
        
    print(f"Generated synthetic benchmark for LaunchWise AI: {n_historical} hist SKUs, {n_new} new SKUs (with hidden actuals), {len(df_launch_curves)} launch weeks.")
    return df_hist_attr, df_new_attr, df_launch_curves, df_clusters, df_holidays, df_hidden_actuals, df_three_year

if __name__ == "__main__":
    generate_synthetic_benchmark()
