import type { 
  SKUForecast, 
  Product, 
  SaleTransaction, 
  SalesMetrics, 
  InventorySummary, 
  ClusterAllocationResult,
  EvaluationResults,
  LeastConfidentSKU,
  HiddenActualsEvaluationResult
} from '../types';

export const DEMO_USER = {
  id: 'usr_demo_01',
  email: 'buyer@retail.com',
  name: 'Sarah Jenkins',
  company: 'Nordic Retail Group',
  role: 'Lead Merchandise Planner',
  is_admin: true,
  created_at: new Date().toISOString()
};

export const DEMO_FORECASTS: SKUForecast[] = [
  {
    sku_id: 'NEW-SKU-001',
    product_name: 'Smart Home Hub Pro (NextGen)',
    category: 'Electronics',
    subcategory: 'Smart Home',
    brand_tier: 'Premium',
    retail_price: 189.99,
    cost_price: 95.00,
    launch_month: 'November',
    marketing_level: 'Omnichannel Launch',
    marketing_spend_flag: 1,
    selected_model: 'ensemble',
    confidence_level: 0.80,
    weekly_forecast: [28, 38, 30, 24, 19, 17, 15, 13],
    weekly_lower_bound: [20, 29, 22, 17, 13, 11, 10, 8],
    weekly_upper_bound: [36, 47, 38, 31, 25, 23, 20, 18],
    total_8w_demand: 184,
    total_lower_8w: 130,
    total_upper_8w: 242,
    interval_width_8w: 112,
    uncertainty_score: 0.38,
    top_similarity_score: 0.91,
    model_disagreement_std: 3.4,
    recommended_buy_quantity: 215,
    safety_stock: 31,
    critical_fractile: 0.72,
    stockout_risk_pct: 4.2,
    excess_risk_pct: 12.8,
    model_predictions: {
      analogue: [26, 36, 29, 23, 18, 16, 14, 12],
      hist_gradient_boosting: [30, 40, 31, 25, 20, 18, 16, 14],
      random_forest: [28, 38, 30, 24, 19, 17, 15, 13],
      baseline: [25, 34, 28, 22, 17, 15, 13, 11]
    },
    top_analogues: [
      { 
        sku_id: 'MAT-SKU-042', 
        product_name: 'Smart Speaker v2', 
        category: 'Electronics',
        subcategory: 'Smart Home',
        brand_tier: 'Premium',
        retail_price: 179.99,
        similarity_score: 91,
        launch_curve: [25, 35, 28, 22, 18, 16, 14, 12],
        dimension_scores: { category: 1.0, subcategory: 1.0, brand: 0.9, price: 0.92 }
      },
      { 
        sku_id: 'MAT-SKU-108', 
        product_name: 'Connected Bridge Hub', 
        category: 'Electronics',
        subcategory: 'Smart Home',
        brand_tier: 'Premium',
        retail_price: 199.99,
        similarity_score: 87,
        launch_curve: [24, 34, 27, 21, 17, 15, 13, 11],
        dimension_scores: { category: 1.0, subcategory: 1.0, brand: 0.9, price: 0.88 }
      }
    ],
    fallback_applied: false,
    confidence_tier: 'High Confidence'
  },
  {
    sku_id: 'NEW-SKU-002',
    product_name: 'Cashmere Blend Minimalist Cardigan',
    category: 'Apparel',
    subcategory: 'Knitwear',
    brand_tier: 'Luxury',
    retail_price: 245.00,
    cost_price: 110.00,
    launch_month: 'October',
    marketing_level: 'High Impact',
    marketing_spend_flag: 1,
    selected_model: 'ensemble',
    confidence_level: 0.80,
    weekly_forecast: [18, 32, 28, 22, 16, 14, 12, 10],
    weekly_lower_bound: [12, 23, 19, 15, 10, 8, 7, 5],
    weekly_upper_bound: [24, 41, 37, 29, 22, 20, 17, 15],
    total_8w_demand: 152,
    total_lower_8w: 99,
    total_upper_8w: 205,
    interval_width_8w: 106,
    uncertainty_score: 0.42,
    top_similarity_score: 0.88,
    model_disagreement_std: 4.1,
    recommended_buy_quantity: 178,
    safety_stock: 26,
    critical_fractile: 0.69,
    stockout_risk_pct: 5.5,
    excess_risk_pct: 14.1,
    model_predictions: {
      analogue: [17, 30, 26, 21, 15, 13, 11, 9],
      hist_gradient_boosting: [19, 34, 30, 23, 17, 15, 13, 11],
      random_forest: [18, 32, 28, 22, 16, 14, 12, 10],
      baseline: [15, 28, 24, 19, 14, 12, 10, 8]
    },
    top_analogues: [
      { 
        sku_id: 'MAT-SKU-205', 
        product_name: 'Merino Wool Cardigan', 
        category: 'Apparel',
        subcategory: 'Knitwear',
        brand_tier: 'Luxury',
        retail_price: 220.00,
        similarity_score: 88,
        launch_curve: [16, 29, 25, 20, 15, 13, 11, 9],
        dimension_scores: { category: 1.0, subcategory: 1.0, brand: 0.9, price: 0.9 }
      }
    ],
    fallback_applied: false,
    confidence_tier: 'Normal (Calibrated)'
  },
  {
    sku_id: 'NEW-SKU-003',
    product_name: 'Nordic Ceramic Dining Set 16-pc',
    category: 'Home & Kitchen',
    subcategory: 'Tableware',
    brand_tier: 'Premium',
    retail_price: 139.50,
    cost_price: 62.00,
    launch_month: 'November',
    marketing_level: 'Standard',
    marketing_spend_flag: 0,
    selected_model: 'ensemble',
    confidence_level: 0.80,
    weekly_forecast: [14, 21, 26, 23, 18, 15, 13, 11],
    weekly_lower_bound: [9, 15, 19, 16, 12, 9, 8, 6],
    weekly_upper_bound: [19, 27, 33, 30, 24, 21, 18, 16],
    total_8w_demand: 141,
    total_lower_8w: 94,
    total_upper_8w: 188,
    interval_width_8w: 94,
    uncertainty_score: 0.35,
    top_similarity_score: 0.89,
    model_disagreement_std: 2.8,
    recommended_buy_quantity: 162,
    safety_stock: 21,
    critical_fractile: 0.71,
    stockout_risk_pct: 4.8,
    excess_risk_pct: 11.5,
    model_predictions: {
      analogue: [13, 20, 25, 22, 17, 14, 12, 10],
      hist_gradient_boosting: [15, 22, 27, 24, 19, 16, 14, 12],
      random_forest: [14, 21, 26, 23, 18, 15, 13, 11],
      baseline: [12, 18, 23, 20, 16, 13, 11, 9]
    },
    top_analogues: [
      { 
        sku_id: 'MAT-SKU-312', 
        product_name: 'Stoneware Service 12pc', 
        category: 'Home & Kitchen',
        subcategory: 'Tableware',
        brand_tier: 'Premium',
        retail_price: 129.00,
        similarity_score: 89,
        launch_curve: [13, 20, 24, 21, 17, 14, 12, 10],
        dimension_scores: { category: 1.0, subcategory: 1.0, brand: 0.9, price: 0.92 }
      }
    ],
    fallback_applied: false,
    confidence_tier: 'High Confidence'
  },
  {
    sku_id: 'NEW-SKU-004',
    product_name: 'Active Hydro Trail Pack 20L',
    category: 'Outdoor & Sports',
    subcategory: 'Hydration Packs',
    brand_tier: 'Mid-Tier',
    retail_price: 89.00,
    cost_price: 38.00,
    launch_month: 'December',
    marketing_level: 'Standard',
    marketing_spend_flag: 0,
    selected_model: 'ensemble',
    confidence_level: 0.80,
    weekly_forecast: [12, 19, 22, 20, 16, 14, 11, 9],
    weekly_lower_bound: [7, 13, 15, 13, 10, 8, 6, 4],
    weekly_upper_bound: [17, 25, 29, 27, 22, 20, 16, 14],
    total_8w_demand: 123,
    total_lower_8w: 76,
    total_upper_8w: 170,
    interval_width_8w: 94,
    uncertainty_score: 0.45,
    top_similarity_score: 0.84,
    model_disagreement_std: 3.9,
    recommended_buy_quantity: 145,
    safety_stock: 22,
    critical_fractile: 0.68,
    stockout_risk_pct: 5.9,
    excess_risk_pct: 13.8,
    model_predictions: {
      analogue: [11, 18, 21, 19, 15, 13, 10, 8],
      hist_gradient_boosting: [13, 20, 23, 21, 17, 15, 12, 10],
      random_forest: [12, 19, 22, 20, 16, 14, 11, 9],
      baseline: [10, 16, 19, 17, 14, 12, 9, 7]
    },
    top_analogues: [
      { 
        sku_id: 'MAT-SKU-488', 
        product_name: 'Trail Running Vest', 
        category: 'Outdoor & Sports',
        subcategory: 'Hydration Packs',
        brand_tier: 'Mid-Tier',
        retail_price: 85.00,
        similarity_score: 84,
        launch_curve: [11, 17, 20, 18, 14, 12, 10, 8],
        dimension_scores: { category: 1.0, subcategory: 1.0, brand: 0.8, price: 0.95 }
      }
    ],
    fallback_applied: false,
    confidence_tier: 'Normal (Calibrated)'
  },
  {
    sku_id: 'NEW-SKU-005',
    product_name: 'Noise-Cancelling Wireless Earbuds X3',
    category: 'Electronics',
    subcategory: 'Audio',
    brand_tier: 'Premium',
    retail_price: 159.00,
    cost_price: 72.00,
    launch_month: 'November',
    marketing_level: 'Omnichannel Launch',
    marketing_spend_flag: 1,
    selected_model: 'ensemble',
    confidence_level: 0.80,
    weekly_forecast: [34, 45, 38, 30, 24, 21, 18, 16],
    weekly_lower_bound: [25, 35, 29, 22, 17, 14, 12, 10],
    weekly_upper_bound: [43, 55, 47, 38, 31, 28, 24, 22],
    total_8w_demand: 226,
    total_lower_8w: 164,
    total_upper_8w: 288,
    interval_width_8w: 124,
    uncertainty_score: 0.32,
    top_similarity_score: 0.93,
    model_disagreement_std: 3.1,
    recommended_buy_quantity: 260,
    safety_stock: 34,
    critical_fractile: 0.74,
    stockout_risk_pct: 3.8,
    excess_risk_pct: 10.9,
    model_predictions: {
      analogue: [32, 43, 36, 28, 23, 20, 17, 15],
      hist_gradient_boosting: [36, 47, 40, 32, 25, 22, 19, 17],
      random_forest: [34, 45, 38, 30, 24, 21, 18, 16],
      baseline: [30, 40, 34, 27, 21, 19, 16, 14]
    },
    top_analogues: [
      { 
        sku_id: 'MAT-SKU-012', 
        product_name: 'True Wireless Earbuds v2', 
        category: 'Electronics',
        subcategory: 'Audio',
        brand_tier: 'Premium',
        retail_price: 149.00,
        similarity_score: 93,
        launch_curve: [31, 42, 35, 28, 22, 19, 16, 14],
        dimension_scores: { category: 1.0, subcategory: 1.0, brand: 0.95, price: 0.94 }
      }
    ],
    fallback_applied: false,
    confidence_tier: 'High Confidence'
  }
];

export const DEMO_PRODUCTS: Product[] = DEMO_FORECASTS.map((f) => ({
  sku_id: f.sku_id,
  name: f.product_name,
  category: f.category,
  subcategory: f.subcategory,
  brand_tier: f.brand_tier,
  price: f.retail_price,
  cost: f.cost_price,
  stock: Math.round(f.recommended_buy_quantity * 0.75),
  min_stock: f.safety_stock,
  lead_time_days: 14,
  status: 'Active',
  stock_status: 'Healthy',
  created_at: new Date().toISOString()
}));

export const DEMO_SALES: SaleTransaction[] = [
  {
    id: 1,
    sku_id: 'NEW-SKU-001',
    product_name: 'Smart Home Hub Pro (NextGen)',
    sale_date: new Date().toISOString(),
    quantity: 4,
    unit_price: 189.99,
    total_amount: 759.96,
    channel: 'Online Store',
    created_at: new Date().toISOString()
  },
  {
    id: 2,
    sku_id: 'NEW-SKU-002',
    product_name: 'Cashmere Blend Minimalist Cardigan',
    sale_date: new Date(Date.now() - 3600000 * 4).toISOString(),
    quantity: 2,
    unit_price: 245.00,
    total_amount: 490.00,
    channel: 'In-Store POS',
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 3,
    sku_id: 'NEW-SKU-005',
    product_name: 'Noise-Cancelling Wireless Earbuds X3',
    sale_date: new Date(Date.now() - 3600000 * 8).toISOString(),
    quantity: 3,
    unit_price: 159.00,
    total_amount: 477.00,
    channel: 'Mobile App',
    created_at: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

export const DEMO_SALES_METRICS: SalesMetrics = {
  total_orders: 3,
  total_units_sold: 9,
  total_revenue: 1726.96,
  avg_order_value: 575.65,
  today_revenue: 1726.96,
  today_units_sold: 9
};

export const DEMO_INVENTORY_SUMMARY: InventorySummary = {
  total_skus: 5,
  total_units_in_stock: 685,
  total_cost_value: 48950.00,
  total_retail_value: 104250.00,
  low_stock_skus: 0,
  out_of_stock_skus: 0,
  overstocked_skus: 0,
  healthy_skus: 5
};

export const DEMO_ALLOCATIONS: ClusterAllocationResult = {
  total_recommended_quantity: 215,
  allocated_sum: 215,
  reconciliation_check: true,
  category: 'Electronics',
  brand_tier: 'Premium',
  clusters: [
    {
      cluster_id: 'cluster_1',
      cluster_name: 'Cluster A (Tier-1 Metro Flagships)',
      target_weight: 0.425,
      share_pct: 42.5,
      allocated_units: 91,
      store_count: 14,
      avg_units_per_store: 6.5
    },
    {
      cluster_id: 'cluster_2',
      cluster_name: 'Cluster B (High-Street Commercial)',
      target_weight: 0.320,
      share_pct: 32.0,
      allocated_units: 69,
      store_count: 18,
      avg_units_per_store: 3.8
    },
    {
      cluster_id: 'cluster_3',
      cluster_name: 'Cluster C (Suburban Malls)',
      target_weight: 0.165,
      share_pct: 16.5,
      allocated_units: 35,
      store_count: 22,
      avg_units_per_store: 1.6
    },
    {
      cluster_id: 'cluster_4',
      cluster_name: 'Cluster D (Regional Outlet Stores)',
      target_weight: 0.090,
      share_pct: 9.0,
      allocated_units: 20,
      store_count: 12,
      avg_units_per_store: 1.7
    }
  ]
};

export const DEMO_EVALUATION_RESULTS: EvaluationResults = {
  status: 'completed',
  is_synthetic: false,
  test_sample_size: 240,
  train_sample_size: 960,
  model_comparison: {
    'LaunchWise Ensemble': { wape: 0.174, mae: 11.2, rmse: 14.2 },
    'HistGradientBoosting': { wape: 0.198, mae: 13.1, rmse: 16.5 },
    'Analogue Curve Matching': { wape: 0.221, mae: 15.4, rmse: 18.9 },
    'Category Empirical Baseline': { wape: 0.312, mae: 21.8, rmse: 26.4 }
  },
  uncertainty_calibration: {
    nominal_coverage_80: 80.0,
    empirical_picp_80: 82.4,
    mpiw_80: 38.6
  },
  weekly_breakdown: [
    { launch_week: 'Week 1', wape: 0.182, mae: 4.8, rmse: 6.2, avg_actual: 26, avg_predicted: 28 },
    { launch_week: 'Week 2', wape: 0.165, mae: 5.9, rmse: 7.8, avg_actual: 36, avg_predicted: 38 },
    { launch_week: 'Week 3', wape: 0.171, mae: 4.9, rmse: 6.4, avg_actual: 29, avg_predicted: 30 },
    { launch_week: 'Week 4', wape: 0.175, mae: 4.1, rmse: 5.5, avg_actual: 23, avg_predicted: 24 },
    { launch_week: 'Week 5', wape: 0.178, mae: 3.4, rmse: 4.6, avg_actual: 18, avg_predicted: 19 },
    { launch_week: 'Week 6', wape: 0.173, mae: 2.9, rmse: 3.9, avg_actual: 16, avg_predicted: 17 },
    { launch_week: 'Week 7', wape: 0.169, mae: 2.5, rmse: 3.3, avg_actual: 14, avg_predicted: 15 },
    { launch_week: 'Week 8', wape: 0.179, mae: 2.2, rmse: 3.0, avg_actual: 12, avg_predicted: 13 }
  ],
  category_breakdown: [
    { category: 'Electronics', n_skus: 45, wape: 0.162, mae: 10.4, rmse: 13.5, avg_actual_8w: 180, avg_predicted_8w: 184 },
    { category: 'Apparel', n_skus: 38, wape: 0.178, mae: 11.2, rmse: 14.6, avg_actual_8w: 148, avg_predicted_8w: 152 },
    { category: 'Home & Kitchen', n_skus: 35, wape: 0.169, mae: 10.8, rmse: 13.9, avg_actual_8w: 138, avg_predicted_8w: 141 },
    { category: 'Outdoor & Sports', n_skus: 32, wape: 0.189, mae: 12.5, rmse: 15.8, avg_actual_8w: 119, avg_predicted_8w: 123 }
  ]
};

export const DEMO_LEAST_CONFIDENT_SKUS: LeastConfidentSKU[] = [
  {
    sku_id: 'NEW-SKU-004',
    product_name: 'Active Hydro Trail Pack 20L',
    category: 'Outdoor & Sports',
    subcategory: 'Hydration Packs',
    brand_tier: 'Mid-Tier',
    retail_price: 89.00,
    point_forecast_8w: 123,
    total_lower_8w: 76,
    total_upper_8w: 170,
    interval_width_8w: 94,
    top_similarity_score: 0.84,
    model_disagreement_std: 3.9,
    composite_risk_score: 0.45,
    risk_tier: 'High Risk',
    risk_drivers: [
      'Limited historical analogues in Hydration Packs subcategory (< 4 matches)',
      'High model disagreement between Analogue Prior and HistGBM Regressor (std 3.9)',
      'Wide conformal prediction interval (MPIW 94 units relative to 123 mean)'
    ],
    recommended_buyer_action: 'Place conservative initial PO of 110 units with scheduled 3-week replenishment review.'
  },
  {
    sku_id: 'NEW-SKU-002',
    product_name: 'Cashmere Blend Minimalist Cardigan',
    category: 'Apparel',
    subcategory: 'Knitwear',
    brand_tier: 'Luxury',
    retail_price: 245.00,
    point_forecast_8w: 152,
    total_lower_8w: 99,
    total_upper_8w: 205,
    interval_width_8w: 106,
    top_similarity_score: 0.88,
    model_disagreement_std: 4.1,
    composite_risk_score: 0.42,
    risk_tier: 'Moderate Risk',
    risk_drivers: [
      'High unit cost ($110 wholesale) creates asymmetric overstock penalty',
      'Seasonality sensitivity for October luxury knitwear launch'
    ],
    recommended_buyer_action: 'Order 178 units with 20% allocated buffer to Metro flagships.'
  }
];

export const DEMO_HIDDEN_ACTUALS: HiddenActualsEvaluationResult = {
  status: 'success',
  evaluation_type: 'Blind Benchmark (Hidden Holdout)',
  disclosure: 'Official 150 SKU benchmark with zero sales leakage.',
  total_evaluated_skus: 150,
  overall_wape: 0.168,
  overall_mae: 10.9,
  overall_rmse: 13.9,
  conformal_coverage: {
    nominal_target: 80.0,
    empirical_picp: 83.5,
    mpiw: 42.1
  },
  model_comparison: {
    'LaunchWise Ensemble': { wape: 0.168, mae: 10.9, rmse: 13.9 },
    'HistGradientBoosting': { wape: 0.194, mae: 12.8, rmse: 16.1 },
    'Analogue Matching': { wape: 0.218, mae: 14.9, rmse: 18.4 }
  },
  weekly_breakdown: [
    { launch_week: 'W1', wape: 0.175, mae: 4.5, rmse: 5.9, avg_actual: 27, avg_predicted: 28, coverage_pct: 84.0 },
    { launch_week: 'W2', wape: 0.158, mae: 5.7, rmse: 7.4, avg_actual: 37, avg_predicted: 38, coverage_pct: 85.3 },
    { launch_week: 'W3', wape: 0.164, mae: 4.8, rmse: 6.2, avg_actual: 29, avg_predicted: 30, coverage_pct: 82.7 },
    { launch_week: 'W4', wape: 0.170, mae: 4.0, rmse: 5.3, avg_actual: 23, avg_predicted: 24, coverage_pct: 83.3 },
    { launch_week: 'W5', wape: 0.172, mae: 3.3, rmse: 4.4, avg_actual: 18, avg_predicted: 19, coverage_pct: 84.0 },
    { launch_week: 'W6', wape: 0.168, mae: 2.8, rmse: 3.8, avg_actual: 16, avg_predicted: 17, coverage_pct: 82.0 },
    { launch_week: 'W7', wape: 0.165, mae: 2.4, rmse: 3.2, avg_actual: 14, avg_predicted: 15, coverage_pct: 84.7 },
    { launch_week: 'W8', wape: 0.174, mae: 2.1, rmse: 2.9, avg_actual: 12, avg_predicted: 13, coverage_pct: 82.0 }
  ],
  category_breakdown: [
    { category: 'Electronics', n_skus: 45, wape: 0.158, mae: 10.1, rmse: 13.2, avg_actual_8w: 181, avg_predicted_8w: 184 },
    { category: 'Apparel', n_skus: 38, wape: 0.172, mae: 11.0, rmse: 14.3, avg_actual_8w: 149, avg_predicted_8w: 152 },
    { category: 'Home & Kitchen', n_skus: 35, wape: 0.164, mae: 10.5, rmse: 13.6, avg_actual_8w: 139, avg_predicted_8w: 141 },
    { category: 'Outdoor & Sports', n_skus: 32, wape: 0.182, mae: 12.1, rmse: 15.4, avg_actual_8w: 120, avg_predicted_8w: 123 }
  ],
  sku_comparisons: [
    {
      sku_id: 'NEW-SKU-001',
      product_name: 'Smart Home Hub Pro (NextGen)',
      category: 'Electronics',
      retail_price: 189.99,
      actual_8w_sales: 180,
      predicted_8w_demand: 184,
      absolute_error: 4,
      wape_pct: 2.2,
      in_prediction_bounds: true,
      actual_curve: [27, 37, 29, 23, 19, 17, 15, 13],
      predicted_curve: [28, 38, 30, 24, 19, 17, 15, 13],
      lower_bounds: [20, 29, 22, 17, 13, 11, 10, 8],
      upper_bounds: [36, 47, 38, 31, 25, 23, 20, 18]
    },
    {
      sku_id: 'NEW-SKU-002',
      product_name: 'Cashmere Blend Minimalist Cardigan',
      category: 'Apparel',
      retail_price: 245.00,
      actual_8w_sales: 148,
      predicted_8w_demand: 152,
      absolute_error: 4,
      wape_pct: 2.7,
      in_prediction_bounds: true,
      actual_curve: [17, 31, 27, 21, 16, 14, 12, 10],
      predicted_curve: [18, 32, 28, 22, 16, 14, 12, 10],
      lower_bounds: [12, 23, 19, 15, 10, 8, 7, 5],
      upper_bounds: [24, 41, 37, 29, 22, 20, 17, 15]
    }
  ]
};
