import os
from pathlib import Path

# Paths
BASE_DIR = Path(__file__).resolve().parent.parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent.parent
DATA_DIR = BASE_DIR / "data"
SYNTHETIC_DATA_DIR = DATA_DIR / "synthetic"
UPLOAD_DATA_DIR = DATA_DIR / "uploads"
EXPORT_DATA_DIR = DATA_DIR / "exports"

for d in [DATA_DIR, SYNTHETIC_DATA_DIR, UPLOAD_DATA_DIR, EXPORT_DATA_DIR]:
    d.mkdir(parents=True, exist_ok=True)

# Application Branding
APP_NAME = "LaunchWise AI"
APP_TAGLINE = "Predict demand. Plan purchases. Manage inventory smarter."

# Forecasting settings
HORIZON_WEEKS = 8
CONFIDENCE_LEVELS = [0.80, 0.90]
DEFAULT_CONFIDENCE_LEVEL = 0.80

# Default Newsvendor Cost Parameters ($)
DEFAULT_UNIT_PRICE = 65.0
DEFAULT_UNIT_COST = 25.0
DEFAULT_SALVAGE_VALUE = 10.0

# Cu = Lost gross margin per unit = Price - Cost = 65 - 25 = 40
# Co = Excess inventory loss = Cost - Salvage = 25 - 10 = 15
DEFAULT_UNDERSTOCK_COST = 40.0
DEFAULT_OVERSTOCK_COST = 15.0

# Store clusters
STORE_CLUSTERS = [
    {"id": "cluster_1", "name": "Flagship Urban Metro", "store_count": 25, "capacity_weight": 0.32},
    {"id": "cluster_2", "name": "Suburban Power Center", "store_count": 55, "capacity_weight": 0.28},
    {"id": "cluster_3", "name": "High-Street Boutique", "store_count": 40, "capacity_weight": 0.18},
    {"id": "cluster_4", "name": "Regional Standard Mall", "store_count": 60, "capacity_weight": 0.14},
    {"id": "cluster_5", "name": "E-Commerce Digital Hub", "store_count": 1, "capacity_weight": 0.08},
]
