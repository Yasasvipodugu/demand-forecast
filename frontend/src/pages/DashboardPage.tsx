import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  TrendingUp, 
  Boxes, 
  AlertTriangle, 
  Award, 
  Sparkles, 
  DollarSign,
  ArrowUpRight,
  Plus,
  ShoppingBag,
  ShoppingCart,
  Package,
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { StatusBadge } from '../components/StatusBadge';
import type { SKUForecast, EvaluationResults, LeastConfidentSKU, InventorySummary, SalesMetrics, Product } from '../types';
import { apiClient } from '../api/client';

interface DashboardPageProps {
  forecasts: SKUForecast[];
  evaluation: EvaluationResults | null;
  riskSkus: LeastConfidentSKU[];
  onNavigateTab: (tab: string) => void;
  isLoading: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  forecasts,
  evaluation,
  riskSkus,
  onNavigateTab,
  isLoading
}) => {
  const [invSummary, setInvSummary] = useState<InventorySummary | null>(null);
  const [salesMetrics, setSalesMetrics] = useState<SalesMetrics | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchStoreStatus = async () => {
      try {
        const [sum, metrics, prodRes] = await Promise.all([
          apiClient.getInventorySummary(),
          apiClient.getShopSalesMetrics(),
          apiClient.getShopProducts({ limit: 100 })
        ]);
        setInvSummary(sum);
        setSalesMetrics(metrics);
        const low = (prodRes.products || []).filter(p => p.stock <= p.min_stock).slice(0, 5);
        setLowStockProducts(low);
      } catch (e) {
        console.error('Store status error:', e);
      }
    };
    fetchStoreStatus();
  }, []);

  if (isLoading || forecasts.length === 0) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-24 bg-slate-200 rounded-2xl"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  // Key Metrics
  const totalForecastDemand = forecasts.reduce((acc, f) => acc + f.total_8w_demand, 0);
  const totalRecommendedBuy = forecasts.reduce((acc, f) => acc + f.recommended_buy_quantity, 0);
  const totalCapitalRequired = forecasts.reduce((acc, f) => acc + (f.recommended_buy_quantity * (f.cost_price || 25)), 0);

  // 1. Aggregated 8-Week Launch Demand Trajectory
  const weeklyAggregated = [1, 2, 3, 4, 5, 6, 7, 8].map((w, idx) => {
    const point = forecasts.reduce((acc, f) => acc + (f.weekly_forecast[idx] || 0), 0);
    const lower = forecasts.reduce((acc, f) => acc + (f.weekly_lower_bound[idx] || 0), 0);
    const upper = forecasts.reduce((acc, f) => acc + (f.weekly_upper_bound[idx] || 0), 0);
    return {
      week: `Week ${w}`,
      demand: Math.round(point),
      lower: Math.round(lower),
      upper: Math.round(upper)
    };
  });

  // 2. Category Breakdown
  const categoryMap: Record<string, { forecast: number; inventory: number }> = {};
  forecasts.forEach((f) => {
    if (!categoryMap[f.category]) {
      categoryMap[f.category] = { forecast: 0, inventory: 0 };
    }
    categoryMap[f.category].forecast += f.total_8w_demand;
    categoryMap[f.category].inventory += f.recommended_buy_quantity;
  });

  const categoryChartData = Object.keys(categoryMap).map((cat) => ({
    category: cat,
    forecast: Math.round(categoryMap[cat].forecast),
    inventory: Math.round(categoryMap[cat].inventory)
  }));

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Welcome & Quick Actions Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-semibold tracking-wider text-cyan-400 uppercase">
              Nordic Flagship Store #104 &bull; Intelligence Active
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
            Executive Merchandising & Inventory Dashboard
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Predict demand for new products with zero sales history. Plan optimal purchase quantities ($Q^*$) and maintain healthy stock levels.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={() => onNavigateTab('products')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4 text-cyan-400" />
            <span>Add Product</span>
          </button>

          <button
            onClick={() => onNavigateTab('sales')}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold backdrop-blur-md border border-white/10 flex items-center space-x-1.5 transition-all"
          >
            <ShoppingBag className="w-4 h-4 text-emerald-400" />
            <span>Record Sale</span>
          </button>

          <button
            onClick={() => onNavigateTab('forecasting')}
            className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow-md shadow-cyan-500/20 flex items-center space-x-1.5 transition-all"
          >
            <TrendingUp className="w-4 h-4" />
            <span>Run Forecast</span>
          </button>

          <button
            onClick={() => onNavigateTab('purchasing')}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/30 flex items-center space-x-1.5 transition-all"
          >
            <ShoppingCart className="w-4 h-4 text-indigo-200" />
            <span>Purchase Orders</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Projected 8-Wk Demand</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {Math.round(totalForecastDemand).toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Across {forecasts.length} launch products
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Optimal Purchase Orders (Q*)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-indigo-700">
            {totalRecommendedBuy.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400">
            PO Capital: ${totalCapitalRequired.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Store Sales Volume</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            ${salesMetrics ? salesMetrics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-[11px] text-slate-400">
            {salesMetrics?.total_units_sold || 0} units sold ({salesMetrics?.total_orders || 0} orders)
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Stock Reorder Triggers</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {invSummary ? invSummary.low_stock_skus : 0} <span className="text-xs font-normal text-slate-400">SKUs</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Units on hand &le; safety threshold
          </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Aggregate 8-Week Launch Curve */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Aggregate 8-Week Launch Curve</h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Summed launch demand across all cold-start SKUs with 80% conformal confidence interval bounds
              </p>
            </div>
            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
              Peak: Week 2
            </span>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyAggregated}>
                <defs>
                  <linearGradient id="dashInterval" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  formatter={(val: any) => [`${val.toLocaleString()} units`]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Area type="monotone" dataKey="upper" stroke="#93c5fd" fill="url(#dashInterval)" name="Upper Bound (80%)" />
                <Area type="monotone" dataKey="lower" stroke="#93c5fd" fill="#ffffff" fillOpacity={1} name="Lower Bound (80%)" />
                <Area type="monotone" dataKey="demand" stroke="#4f46e5" strokeWidth={3} fillOpacity={0} dot={{ r: 4 }} name="Expected Launch Demand" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Category Distribution */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="pb-3 border-b border-slate-100">
            <h2 className="text-sm font-bold text-slate-900">Category Demand vs Recommended Orders</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Comparison between expected launch sales and Newsvendor Q* purchases
            </p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryChartData} layout="vertical" margin={{ left: 15, right: 15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={11} />
                <YAxis dataKey="category" type="category" stroke="#64748b" fontSize={11} width={80} />
                <Tooltip 
                  formatter={(val: any) => [`${val.toLocaleString()} units`]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px', color: '#fff', fontSize: '11px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="forecast" fill="#94a3b8" radius={[0, 4, 4, 0]} name="Expected Demand" />
                <Bar dataKey="inventory" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Recommended Buy (Q*)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tables Row: Urgent Reorders Watchlist & Top Forecasted Products */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Urgent Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Urgent Reorder Alert Watchlist
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Items currently at or below their safety stock reorder point</p>
            </div>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>View All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {lowStockProducts.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                <ShieldCheck className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
                <p className="font-semibold text-slate-700">All stock levels healthy!</p>
                <p className="text-[11px]">No products currently breaching safety stock thresholds.</p>
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.sku_id} className="p-3 rounded-xl bg-amber-50/60 border border-amber-200/80 flex items-center justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-xs text-indigo-700">{p.sku_id}</span>
                      <span className="text-xs font-semibold text-slate-900">{p.name}</span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      Category: {p.category} &bull; Lead Time: {p.lead_time_days} days
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-bold text-rose-600 block font-mono">
                      {p.stock} / {p.min_stock} units
                    </span>
                    <button
                      onClick={() => onNavigateTab('purchasing')}
                      className="text-[10px] text-indigo-600 font-bold hover:underline"
                    >
                      Reorder Now &rarr;
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top Demand New Products */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-500" />
                Top Forecasted Cold-Start Products
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Highest projected first-8-week demand trajectories</p>
            </div>
            <button
              onClick={() => onNavigateTab('forecasting')}
              className="text-xs text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
            >
              <span>Explore All</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-2.5">
            {forecasts.slice(0, 5).map((f) => (
              <div key={f.sku_id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between hover:bg-slate-100/60 transition-colors">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-mono font-bold text-xs text-indigo-700">{f.sku_id}</span>
                    <span className="text-xs font-semibold text-slate-900">{f.product_name}</span>
                  </div>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    Tier: {f.brand_tier} &bull; Retail: ${f.retail_price.toFixed(2)}
                  </span>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-slate-900 block">
                    {Math.round(f.total_8w_demand)} units
                  </span>
                  <span className="text-[10px] text-indigo-600 font-semibold">
                    Buy Q*: {f.recommended_buy_quantity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
