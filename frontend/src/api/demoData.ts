import type { 
  SKUForecast, 
  Product, 
  SaleTransaction, 
  SalesMetrics, 
  InventorySummary, 
  InventoryTransaction,
  EvaluationResults,
  LeastConfidentSKU,
  ClusterAllocationResult
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
      similarity_matching: 180,
      gradient_boosting: 188,
      category_baseline: 175
    },
    top_analogues: [
      { sku_id: 'MAT-SKU-042', product_name: 'Smart Speaker v2', similarity: 0.91, category: 'Electronics' },
      { sku_id: 'MAT-SKU-108', product_name: 'Connected Bridge Hub', similarity: 0.87, category: 'Electronics' }
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
      similarity_matching: 148,
      gradient_boosting: 156,
      category_baseline: 142
    },
    top_analogues: [
      { sku_id: 'MAT-SKU-205', product_name: 'Merino Wool Cardigan', similarity: 0.88, category: 'Apparel' }
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
      similarity_matching: 140,
      gradient_boosting: 142,
      category_baseline: 135
    },
    top_analogues: [
      { sku_id: 'MAT-SKU-312', product_name: 'Stoneware Service 12pc', similarity: 0.89, category: 'Home & Kitchen' }
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
      similarity_matching: 119,
      gradient_boosting: 127,
      category_baseline: 115
    },
    top_analogues: [
      { sku_id: 'MAT-SKU-488', product_name: 'Trail Running Vest', similarity: 0.84, category: 'Outdoor & Sports' }
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
      similarity_matching: 222,
      gradient_boosting: 230,
      category_baseline: 210
    },
    top_analogues: [
      { sku_id: 'MAT-SKU-012', product_name: 'True Wireless Earbuds v2', similarity: 0.93, category: 'Electronics' }
    ],
    fallback_applied: false,
    confidence_tier: 'High Confidence'
  }
];

export const DEMO_PRODUCTS: Product[] = DEMO_FORECASTS.map((f, idx) => ({
  id: idx + 1,
  sku_id: f.sku_id,
  product_name: f.product_name,
  category: f.category,
  subcategory: f.subcategory,
  brand_tier: f.brand_tier,
  retail_price: f.retail_price,
  cost_price: f.cost_price,
  current_stock: Math.round(f.recommended_buy_quantity * 0.75),
  safety_stock: f.safety_stock,
  lead_time_days: 14,
  supplier: 'Global Logistics Partner',
  status: 'Active',
  created_at: new Date().toISOString()
}));

export const DEMO_SALES: SaleTransaction[] = [
  {
    id: 1,
    transaction_id: 'TXN-9021',
    sku_id: 'NEW-SKU-001',
    product_name: 'Smart Home Hub Pro (NextGen)',
    category: 'Electronics',
    quantity: 4,
    unit_price: 189.99,
    total_amount: 759.96,
    channel: 'Online Store',
    store_cluster: 'Cluster A (Metro Flagships)',
    sale_date: new Date().toISOString()
  },
  {
    id: 2,
    transaction_id: 'TXN-9022',
    sku_id: 'NEW-SKU-002',
    product_name: 'Cashmere Blend Minimalist Cardigan',
    category: 'Apparel',
    quantity: 2,
    unit_price: 245.00,
    total_amount: 490.00,
    channel: 'In-Store POS',
    store_cluster: 'Cluster B (High Street Boutiques)',
    sale_date: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: 3,
    transaction_id: 'TXN-9023',
    sku_id: 'NEW-SKU-005',
    product_name: 'Noise-Cancelling Wireless Earbuds X3',
    category: 'Electronics',
    quantity: 3,
    unit_price: 159.00,
    total_amount: 477.00,
    channel: 'Mobile App',
    store_cluster: 'Cluster A (Metro Flagships)',
    sale_date: new Date(Date.now() - 3600000 * 8).toISOString()
  }
];

export const DEMO_SALES_METRICS: SalesMetrics = {
  total_revenue: 1726.96,
  total_units: 9,
  order_count: 3,
  average_order_value: 575.65,
  gross_margin_pct: 48.7,
  top_selling_category: 'Electronics'
};

export const DEMO_INVENTORY_SUMMARY: InventorySummary = {
  total_skus: 5,
  total_units_on_hand: 685,
  inventory_valuation: 82450.00,
  low_stock_count: 0,
  out_of_stock_count: 0,
  stockout_risk_items: 1,
  active_purchase_orders: 4
};

export const DEMO_ALLOCATIONS: ClusterAllocationResult = {
  total_quantity: 215,
  category: 'Electronics',
  brand_tier: 'Premium',
  clusters: [
    {
      cluster_id: 1,
      name: 'Cluster A (Tier-1 Metro Flagships)',
      share_pct: 42.5,
      allocated_units: 91,
      stores_count: 14,
      avg_per_store: 6.5
    },
    {
      cluster_id: 2,
      name: 'Cluster B (High-Street Commercial)',
      share_pct: 32.0,
      allocated_units: 69,
      stores_count: 18,
      avg_per_store: 3.8
    },
    {
      cluster_id: 3,
      name: 'Cluster C (Suburban Malls)',
      share_pct: 16.5,
      allocated_units: 35,
      stores_count: 22,
      avg_per_store: 1.6
    },
    {
      cluster_id: 4,
      name: 'Cluster D (Regional Outlet Stores)',
      share_pct: 9.0,
      allocated_units: 20,
      stores_count: 12,
      avg_per_store: 1.7
    }
  ]
};
