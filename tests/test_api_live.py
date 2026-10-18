import urllib.request
import json

BASE_URL = "http://127.0.0.1:8000/api"

def make_req(endpoint, method="GET", data=None):
    url = f"{BASE_URL}{endpoint}"
    req = urllib.request.Request(url, method=method, data=data)
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode())

def run_tests():
    print("Testing /api/health...")
    health = make_req("/health")
    assert health["status"] == "healthy"
    print("  -> Health OK:", health["status"], health["dataset_source"])

    print("Testing /api/forecasts/run...")
    fc_run = make_req("/forecasts/run?model_type=ensemble&confidence_level=0.8", method="POST", data=b"")
    assert fc_run["status"] == "success"
    print("  -> Forecasts generated count:", fc_run["forecast_count"])

    print("Testing /api/forecasts...")
    forecasts = make_req("/forecasts?limit=10")
    assert forecasts["total_skus"] > 0
    sku_id = forecasts["forecasts"][0]["sku_id"]
    print("  -> Total SKUs:", forecasts["total_skus"], "Sample SKU:", sku_id)

    print(f"Testing /api/forecasts/{sku_id}...")
    sku_detail = make_req(f"/forecasts/{sku_id}")
    assert len(sku_detail["weekly_forecast"]) == 8
    print("  -> 8-Wk Trajectory:", sku_detail["weekly_forecast"])

    print(f"Testing /api/forecasts/{sku_id}/explanations...")
    expl = make_req(f"/forecasts/{sku_id}/explanations")
    assert len(expl["top_analogues"]) == 5
    print("  -> Top Analogue:", expl["top_analogues"][0]["product_name"], "Match:", expl["top_analogues"][0]["similarity_score"])

    print("Testing /api/risk/least-confident...")
    risk = make_req("/risk/least-confident?top_n=10")
    assert len(risk["least_confident_skus"]) == 10
    print("  -> Top 10 Least Confident SKUs identified. Worst risk:", risk["least_confident_skus"][0]["composite_risk_score"])

    print("Testing /api/inventory/recommend...")
    import urllib.parse
    inv_data = urllib.parse.urlencode({
        "total_demand": 500,
        "interval_lower": 350,
        "interval_upper": 650,
        "understock_cost": 40,
        "overstock_cost": 15,
        "retail_price": 65,
        "unit_cost": 25
    }).encode()
    inv = make_req("/inventory/recommend", method="POST", data=inv_data)
    assert inv["recommended_initial_buy"] > 0
    print("  -> Newsvendor Recommendation Q*:", inv["recommended_initial_buy"], "Safety stock:", inv["safety_stock"])

    print("Testing /api/inventory/allocate...")
    alloc_data = urllib.parse.urlencode({
        "total_quantity": inv["recommended_initial_buy"],
        "category": "Footwear",
        "brand_tier": "Premium"
    }).encode()
    alloc = make_req("/inventory/allocate", method="POST", data=alloc_data)
    assert alloc["reconciliation_check"] is True
    print("  -> Store Allocation exact sum check:", alloc["reconciliation_check"], "Sum:", alloc["allocated_sum"])

    print("Testing /api/datasets...")
    ds = make_req("/datasets")
    assert ds["is_synthetic"] is True
    print("  -> Datasets loaded:", ds["tables"])

    print("\nALL LIVE API ENDPOINTS VERIFIED AND PASSING SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
