import type { 
  SKUForecast, 
  SKUExplanation, 
  LeastConfidentSKU, 
  EvaluationResults, 
  InventoryRecommendation, 
  ClusterAllocationResult,
  DatasetValidation,
  User,
  AuthResponse,
  HiddenActualsEvaluationResult,
  ColumnMappingPreviewResult,
  Product,
  SaleTransaction,
  SalesMetrics,
  InventoryTransaction,
  InventorySummary
} from '../types';

const API_BASE = 'http://127.0.0.1:8000/api';

export const apiClient = {
  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Health check failed');
    return res.json();
  },

  async getDatasets() {
    const res = await fetch(`${API_BASE}/datasets`);
    if (!res.ok) throw new Error('Failed to fetch datasets');
    return res.json();
  },

  async validateDataset(datasetType: string = 'new_sku_attributes'): Promise<DatasetValidation> {
    const res = await fetch(`${API_BASE}/datasets/validate?dataset_type=${encodeURIComponent(datasetType)}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Validation failed');
    return res.json();
  },

  async uploadDataset(file: File, datasetType: string): Promise<{ filename: string; validation: DatasetValidation }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_type', datasetType);

    const res = await fetch(`${API_BASE}/datasets/upload`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Dataset upload failed');
    return res.json();
  },

  async trainModels() {
    const res = await fetch(`${API_BASE}/models/train`, { method: 'POST' });
    if (!res.ok) throw new Error('Model training failed');
    return res.json();
  },

  async getModelStatus() {
    const res = await fetch(`${API_BASE}/models/status`);
    if (!res.ok) throw new Error('Failed to get model status');
    return res.json();
  },

  async runForecasts(modelType: string = 'ensemble', confidenceLevel: number = 0.80) {
    const res = await fetch(`${API_BASE}/forecasts/run?model_type=${modelType}&confidence_level=${confidenceLevel}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Forecasting run failed');
    return res.json();
  },

  async getForecasts(category?: string, brandTier?: string) {
    const params = new URLSearchParams();
    if (category && category !== 'All') params.append('category', category);
    if (brandTier && brandTier !== 'All') params.append('brand_tier', brandTier);
    
    const res = await fetch(`${API_BASE}/forecasts?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch forecasts');
    return res.json();
  },

  async getSkuForecast(skuId: string): Promise<SKUForecast> {
    const res = await fetch(`${API_BASE}/forecasts/${encodeURIComponent(skuId)}`);
    if (!res.ok) throw new Error(`Failed to fetch forecast for SKU ${skuId}`);
    return res.json();
  },

  async getSkuExplanations(skuId: string): Promise<SKUExplanation> {
    const res = await fetch(`${API_BASE}/forecasts/${encodeURIComponent(skuId)}/explanations`);
    if (!res.ok) throw new Error(`Failed to fetch explanations for SKU ${skuId}`);
    return res.json();
  },

  async recalculateInventory(params: {
    totalDemand: number;
    intervalLower: number;
    intervalUpper: number;
    understockCost: number;
    overstockCost: number;
    retailPrice?: number;
    unitCost?: number;
  }): Promise<InventoryRecommendation> {
    const formData = new FormData();
    formData.append('total_demand', params.totalDemand.toString());
    formData.append('interval_lower', params.intervalLower.toString());
    formData.append('interval_upper', params.intervalUpper.toString());
    formData.append('understock_cost', params.understockCost.toString());
    formData.append('overstock_cost', params.overstockCost.toString());
    if (params.retailPrice) formData.append('retail_price', params.retailPrice.toString());
    if (params.unitCost) formData.append('unit_cost', params.unitCost.toString());

    const res = await fetch(`${API_BASE}/inventory/recommend`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to recalculate inventory');
    return res.json();
  },

  async getEvaluationResults(): Promise<EvaluationResults> {
    const res = await fetch(`${API_BASE}/evaluation/results`);
    if (!res.ok) throw new Error('Failed to fetch evaluation results');
    return res.json();
  },

  async runEvaluation(testSize: number = 0.20): Promise<EvaluationResults> {
    const res = await fetch(`${API_BASE}/evaluation/run?test_size=${testSize}`, {
      method: 'POST'
    });
    if (!res.ok) throw new Error('Failed to run evaluation benchmark');
    return res.json();
  },

  async getLeastConfidentSkus(topN: number = 10): Promise<{ count: number; least_confident_skus: LeastConfidentSKU[] }> {
    const res = await fetch(`${API_BASE}/risk/least-confident?top_n=${topN}`);
    if (!res.ok) throw new Error('Failed to fetch risk analysis');
    return res.json();
  },

  async allocateStoreInventory(params: {
    totalQuantity: number;
    category: string;
    brandTier: string;
  }): Promise<ClusterAllocationResult> {
    const formData = new FormData();
    formData.append('total_quantity', params.totalQuantity.toString());
    formData.append('category', params.category);
    formData.append('brand_tier', params.brandTier);

    const res = await fetch(`${API_BASE}/inventory/allocate`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to allocate store inventory');
    return res.json();
  },

  async getHiddenActualsEvaluation(): Promise<HiddenActualsEvaluationResult> {
    const res = await fetch(`${API_BASE}/evaluation/hidden-actuals`);
    if (!res.ok) throw new Error('Failed to run hidden actuals evaluation');
    return res.json();
  },

  async previewColumnMapping(file: File, datasetType: string): Promise<ColumnMappingPreviewResult> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('dataset_type', datasetType);

    const res = await fetch(`${API_BASE}/datasets/column-mapping-preview`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) throw new Error('Failed to parse and preview column mapping');
    return res.json();
  },

  async applyColumnMapping(params: {
    tempFilename: string;
    datasetType: string;
    columnMapping: Record<string, string>;
  }): Promise<{ status: string; message: string; filename: string; rows: number; validation: DatasetValidation }> {
    const res = await fetch(`${API_BASE}/datasets/apply-column-mapping`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        temp_filename: params.tempFilename,
        dataset_type: params.datasetType,
        column_mapping: params.columnMapping
      })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Failed to apply column mapping');
    return data;
  },

  getExportForecastsUrl() {
    return `${API_BASE}/forecasts/export`;
  },

  getExportPurchaseOrdersUrl() {
    return `${API_BASE}/export/purchase-orders`;
  },

  getExportAllocationsUrl() {
    return `${API_BASE}/export/allocations`;
  },

  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Login failed');
    return data;
  },

  async register(params: { name: string; email: string; company: string; role: string; password: string }): Promise<AuthResponse> {
    const res = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Registration failed');
    return data;
  },

  async getMe(token: string): Promise<{ status: string; user: User }> {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to get user profile');
    return data;
  },

  async forgotPassword(email: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Password reset failed');
    return data;
  },

  // ---------------- Shop Management APIs ----------------
  async getShopProducts(params?: { search?: string; category?: string; brandTier?: string; limit?: number }): Promise<{ total: number; products: Product[] }> {
    const q = new URLSearchParams();
    if (params?.search) q.append('search', params.search);
    if (params?.category && params.category !== 'All') q.append('category', params.category);
    if (params?.brandTier && params.brandTier !== 'All') q.append('brand_tier', params.brandTier);
    if (params?.limit) q.append('limit', params.limit.toString());
    
    const res = await fetch(`${API_BASE}/shop/products?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch shop products');
    return res.json();
  },

  async getSingleProduct(skuId: string): Promise<Product> {
    const res = await fetch(`${API_BASE}/shop/products/${encodeURIComponent(skuId)}`);
    if (!res.ok) throw new Error(`Product ${skuId} not found`);
    return res.json();
  },

  async createShopProduct(product: Partial<Product>): Promise<{ status: string; message: string; product: Product }> {
    const res = await fetch(`${API_BASE}/shop/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to create product');
    return data;
  },

  async updateShopProduct(skuId: string, updates: Partial<Product>): Promise<{ status: string; message: string; product: Product }> {
    const res = await fetch(`${API_BASE}/shop/products/${encodeURIComponent(skuId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update product');
    return data;
  },

  async deleteShopProduct(skuId: string): Promise<{ status: string; message: string }> {
    const res = await fetch(`${API_BASE}/shop/products/${encodeURIComponent(skuId)}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to delete product');
    return data;
  },

  async getShopSales(limit: number = 100, skuId?: string): Promise<{ total: number; sales: SaleTransaction[] }> {
    const q = new URLSearchParams();
    q.append('limit', limit.toString());
    if (skuId) q.append('sku_id', skuId);
    const res = await fetch(`${API_BASE}/shop/sales?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch sales log');
    return res.json();
  },

  async getShopSalesMetrics(): Promise<SalesMetrics> {
    const res = await fetch(`${API_BASE}/shop/sales/metrics`);
    if (!res.ok) throw new Error('Failed to fetch sales metrics');
    return res.json();
  },

  async recordShopSale(params: {
    sku_id: string;
    quantity: number;
    unit_price?: number;
    channel?: string;
    sale_date?: string;
  }): Promise<{ status: string; message: string; sale: any }> {
    const res = await fetch(`${API_BASE}/shop/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to record sale');
    return data;
  },

  async getInventorySummary(): Promise<InventorySummary> {
    const res = await fetch(`${API_BASE}/shop/inventory/summary`);
    if (!res.ok) throw new Error('Failed to fetch inventory summary');
    return res.json();
  },

  async getInventoryTransactions(limit: number = 100, skuId?: string): Promise<{ total: number; transactions: InventoryTransaction[] }> {
    const q = new URLSearchParams();
    q.append('limit', limit.toString());
    if (skuId) q.append('sku_id', skuId);
    const res = await fetch(`${API_BASE}/shop/inventory/transactions?${q.toString()}`);
    if (!res.ok) throw new Error('Failed to fetch inventory transactions');
    return res.json();
  },

  async adjustInventoryStock(params: {
    sku_id: string;
    adjustment_type: string;
    quantity_delta: number;
    notes?: string;
  }): Promise<{ status: string; message: string; result: any }> {
    const res = await fetch(`${API_BASE}/shop/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to adjust stock');
    return data;
  },

  async getShopSettings(): Promise<Record<string, string>> {
    const res = await fetch(`${API_BASE}/shop/settings`);
    if (!res.ok) throw new Error('Failed to fetch shop settings');
    return res.json();
  },

  async updateShopSettings(settings: Record<string, string>): Promise<{ status: string; message: string; settings: Record<string, string> }> {
    const res = await fetch(`${API_BASE}/shop/settings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ settings })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Failed to update shop settings');
    return data;
  }
};

