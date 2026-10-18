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

import { FORECASTS_150 } from './forecasts_150';

export const DEMO_FORECASTS: SKUForecast[] = FORECASTS_150 as unknown as SKUForecast[];

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

export const DEMO_LEAST_CONFIDENT_SKUS: LeastConfidentSKU[] = [...DEMO_FORECASTS]
  .sort((a, b) => (b.uncertainty_score || 0) - (a.uncertainty_score || 0))
  .slice(0, 10)
  .map(f => ({
    sku_id: f.sku_id,
    product_name: f.product_name,
    category: f.category,
    subcategory: f.subcategory,
    brand_tier: f.brand_tier,
    retail_price: f.retail_price,
    point_forecast_8w: Math.round(f.total_8w_demand),
    total_lower_8w: Math.round(f.total_lower_8w),
    total_upper_8w: Math.round(f.total_upper_8w),
    interval_width_8w: Math.round(f.interval_width_8w),
    top_similarity_score: Math.round(f.top_similarity_score || 80),
    model_disagreement_std: Math.round((f.model_disagreement_std || 3.5) * 10) / 10,
    composite_risk_score: Math.round((f.uncertainty_score || 45) * 10) / 10,
    risk_tier: (f.uncertainty_score || 0) > 40 ? 'High Risk' : 'Moderate Risk',
    risk_drivers: [
      `High model disagreement across Gower analogue prior and HistGBM regressor (±${Math.round((f.model_disagreement_std || 3.5) * 10) / 10} u/wk)`,
      `Wide conformal prediction interval (±${Math.round(f.interval_width_8w / 2)} units relative to ${Math.round(f.total_8w_demand)} mean)`,
      `Novel cold-start product in ${f.category} (${f.subcategory}) with no historical brand sales history`
    ],
    recommended_buyer_action: `Order initial conservative quantity of ${Math.round(f.total_lower_8w)} units (lower bound) with a scheduled replenishment review at Week 3.`
  }));

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
