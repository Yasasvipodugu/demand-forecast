export interface SKUForecast {
  sku_id: string;
  product_name: string;
  category: string;
  subcategory: string;
  brand_tier: string;
  retail_price: number;
  cost_price: number;
  launch_month: string;
  marketing_level: string;
  selected_model: string;
  confidence_level: number;
  weekly_forecast: number[];
  weekly_lower_bound: number[];
  weekly_upper_bound: number[];
  total_8w_demand: number;
  total_lower_8w: number;
  total_upper_8w: number;
  interval_width_8w: number;
  uncertainty_score: number;
  top_similarity_score: number;
  model_disagreement_std: number;
  recommended_buy_quantity: number;
  safety_stock: number;
  critical_fractile: number;
  stockout_risk_pct: number;
  excess_risk_pct: number;
  marketing_spend_flag?: number;
  fallback_applied?: boolean;
  fallback_method?: string | null;
  fallback_reason?: string | null;
  confidence_tier?: string;
  model_predictions: {
    baseline?: number[];
    attribute_ml?: number[];
    random_forest?: number[];
    hist_gradient_boosting?: number[];
    analogue?: number[];
    ensemble?: number[];
  };
  top_analogues: Analogue[];
}

export interface Analogue {
  sku_id: string;
  product_name: string;
  category: string;
  subcategory: string;
  brand_tier: string;
  retail_price: number;
  color?: string;
  material?: string;
  similarity_score: number;
  launch_curve: number[];
  dimension_scores: Record<string, number>;
}

export interface DemandDriver {
  factor: string;
  direction: string;
  impact_pct: number;
  description: string;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface SKUExplanation {
  sku_id: string;
  executive_summary: string;
  demand_drivers: DemandDriver[];
  top_analogues: Analogue[];
  feature_importances: FeatureImportance[];
  uncertainty_reasons: string[];
  analogue_fit_score: number;
  model_predictions: Record<string, number[]>;
}

export interface LeastConfidentSKU {
  sku_id: string;
  product_name: string;
  category: string;
  subcategory: string;
  brand_tier: string;
  retail_price: number;
  point_forecast_8w: number;
  total_lower_8w: number;
  total_upper_8w: number;
  interval_width_8w: number;
  top_similarity_score: number;
  model_disagreement_std: number;
  composite_risk_score: number;
  risk_tier: string;
  risk_drivers: string[];
  recommended_buyer_action: string;
}

export interface StoreClusterAllocation {
  cluster_id: string;
  cluster_name: string;
  store_count: number;
  allocated_units: number;
  share_pct: number;
  avg_units_per_store: number;
  target_weight: number;
}

export interface ClusterAllocationResult {
  total_recommended_quantity: number;
  allocated_sum: number;
  reconciliation_check: boolean;
  category: string;
  brand_tier: string;
  clusters: StoreClusterAllocation[];
}

export interface EvaluationResults {
  status: string;
  is_synthetic: boolean;
  test_sample_size: number;
  train_sample_size: number;
  model_comparison: Record<string, { wape: number; mae: number; rmse: number }>;
  uncertainty_calibration: {
    nominal_coverage_80: number;
    empirical_picp_80: number;
    mpiw_80: number;
  };
  weekly_breakdown: Array<{
    launch_week: string;
    wape: number;
    mae: number;
    rmse: number;
    avg_actual: number;
    avg_predicted: number;
  }>;
  category_breakdown: Array<{
    category: string;
    n_skus: number;
    wape: number;
    mae: number;
    rmse: number;
  }>;
  sample_curves: Array<{
    sku_id: string;
    product_name: string;
    category: string;
    actual: number[];
    predicted: number[];
    lower_80: number[];
    upper_80: number[];
  }>;
}

export interface InventoryRecommendation {
  expected_demand_8w: number;
  recommended_initial_buy: number;
  safety_stock: number;
  understock_cost: number;
  overstock_cost: number;
  critical_fractile: number;
  critical_fractile_pct: number;
  stockout_risk_pct: number;
  excess_risk_pct: number;
  expected_shortage_units: number;
  expected_leftover_units: number;
  explanation: string;
  sensitivity_curve: Array<{
    critical_fractile: number;
    fractile_pct: string;
    recommended_q: number;
    safety_stock: number;
  }>;
}

export interface DatasetValidation {
  is_valid: boolean;
  quality_score: number;
  row_count: number;
  column_count: number;
  columns: string[];
  errors: string[];
  warnings: string[];
  missing_counts: Record<string, number>;
  duplicate_count: number;
  column_mapping: Record<string, string>;
  preview: Array<Record<string, any>>;
}

export interface User {
  id: number;
  email: string;
  name: string;
  company: string;
  role: string;
  created_at: string;
}

export interface AuthResponse {
  status: string;
  message: string;
  token: string;
  user: User;
}

export interface HiddenActualsEvaluationResult {
  status: string;
  evaluation_type: string;
  disclosure: string;
  total_evaluated_skus: number;
  overall_wape: number;
  overall_mae: number;
  overall_rmse: number;
  conformal_coverage: {
    nominal_target: number;
    empirical_picp: number;
    mpiw: number;
  };
  model_comparison: Record<string, { wape: number; mae: number; rmse: number }>;
  weekly_breakdown: Array<{
    launch_week: string;
    wape: number;
    mae: number;
    rmse: number;
    avg_actual: number;
    avg_predicted: number;
    coverage_pct: number;
  }>;
  category_breakdown: Array<{
    category: string;
    n_skus: number;
    wape: number;
    mae: number;
    rmse: number;
    avg_actual_8w: number;
    avg_predicted_8w: number;
  }>;
  sku_comparisons: Array<{
    sku_id: string;
    product_name: string;
    category: string;
    retail_price: number;
    actual_8w_sales: number;
    predicted_8w_demand: number;
    absolute_error: number;
    wape_pct: number;
    in_prediction_bounds: boolean;
    actual_curve: number[];
    predicted_curve: number[];
    lower_bounds: number[];
    upper_bounds: number[];
  }>;
}

export interface ColumnMappingPreviewResult {
  status: string;
  temp_filename: string;
  original_filename: string;
  dataset_type: string;
  columns: string[];
  suggested_mapping: Record<string, string>;
  validation: DatasetValidation;
  preview: Array<Record<string, any>>;
}
export interface Product {
  sku_id: string;
  name: string;
  category: string;
  subcategory: string;
  brand_tier: string;
  price: number;
  cost: number;
  stock: number;
  min_stock: number;
  lead_time_days: number;
  status: string;
  stock_status: string;
  created_at: string;
}

export interface SaleTransaction {
  id: number;
  sku_id: string;
  product_name: string;
  sale_date: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  channel: string;
  created_at: string;
}

export interface SalesMetrics {
  total_orders: number;
  total_units_sold: number;
  total_revenue: number;
  avg_order_value: number;
  today_revenue: number;
  today_units_sold: number;
}

export interface InventoryTransaction {
  id: number;
  sku_id: string;
  product_name: string;
  transaction_type: string;
  quantity_delta: number;
  stock_after: number;
  notes: string;
  created_at: string;
}

export interface InventorySummary {
  total_skus: number;
  total_units_in_stock: number;
  total_cost_value: number;
  total_retail_value: number;
  low_stock_skus: number;
  out_of_stock_skus: number;
  overstocked_skus: number;
  healthy_skus: number;
}
