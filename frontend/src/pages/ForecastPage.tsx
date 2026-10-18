import React, { useState } from 'react';
import { 
  LineChart, 
  Line, 
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
  Play, 
  Filter, 
  Download, 
  Search, 
  Sparkles, 
  TrendingUp, 
  ChevronRight,
  Eye,
  RefreshCw,
  AlertTriangle,
  ShieldAlert
} from 'lucide-react';
import { StatusBadge } from '../components/StatusBadge';
import type { SKUForecast } from '../types';
import { apiClient } from '../api/client';

interface ForecastPageProps {
  forecasts: SKUForecast[];
  selectedModel: string;
  confidenceLevel: number;
  onRunForecasts: (model: string, conf: number) => void;
  onSelectSkuForExplain: (skuId: string) => void;
  isProcessing: boolean;
}

export const ForecastPage: React.FC<ForecastPageProps> = ({
  forecasts,
  selectedModel,
  confidenceLevel,
  onRunForecasts,
  onSelectSkuForExplain,
  isProcessing
}) => {
  const [modelChoice, setModelChoice] = useState<string>(selectedModel);
  const [confChoice, setConfChoice] = useState<number>(confidenceLevel);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [brandFilter, setBrandFilter] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedSkuId, setSelectedSkuId] = useState<string>(forecasts[0]?.sku_id || '');

  // Filtered forecasts
  const filtered = forecasts.filter((f) => {
    const matchCat = categoryFilter === 'All' || f.category === categoryFilter;
    const matchBrand = brandFilter === 'All' || f.brand_tier === brandFilter;
    const matchSearch = searchTerm === '' || 
      f.sku_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.product_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchBrand && matchSearch;
  });

  const activeSku = forecasts.find((f) => f.sku_id === selectedSkuId) || forecasts[0];

  // 8-week chart data for active SKU
  const chartData = activeSku
    ? [1, 2, 3, 4, 5, 6, 7, 8].map((w, idx) => ({
        week: `Week ${w}`,
        point: activeSku.weekly_forecast[idx],
        lower: activeSku.weekly_lower_bound[idx],
        upper: activeSku.weekly_upper_bound[idx],
        analogue: activeSku.model_predictions?.analogue?.[idx] ?? activeSku.weekly_forecast[idx],
        rf: activeSku.model_predictions?.random_forest?.[idx] ?? activeSku.weekly_forecast[idx],
        hgb: activeSku.model_predictions?.hist_gradient_boosting?.[idx] ?? activeSku.weekly_forecast[idx],
        baseline: activeSku.model_predictions?.baseline?.[idx] ?? activeSku.weekly_forecast[idx]
      }))
    : [];

  const handleStartForecastJob = () => {
    onRunForecasts(modelChoice, confChoice);
  };

  const handleExportCsv = () => {
    const headers = ['SKU ID', 'Product Name', 'Category', 'Subcategory', 'Brand Tier', 'Price', 'W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'Total 8W', 'Lower 8W', 'Upper 8W', 'Recommended Buy (Q*)', 'Safety Stock'];
    const rows = forecasts.map(f => [
      f.sku_id,
      `"${f.product_name.replace(/"/g, '""')}"`,
      f.category,
      f.subcategory,
      f.brand_tier,
      f.retail_price,
      ...f.weekly_forecast,
      f.total_8w_demand,
      f.total_lower_8w,
      f.total_upper_8w,
      f.recommended_buy_quantity,
      f.safety_stock
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `launchwise_forecasts_8w_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 space-y-6">
      {/* Data Source & Distinction Protocol Banner */}
      <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-white flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-cyan-400" /> Data Protocol:
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-indigo-950 text-indigo-300 border border-indigo-800/60 font-mono text-[11px]">
            1,200 Historical SKUs (Training Prior)
          </span>
          <span className="text-slate-500 font-bold">&rarr;</span>
          <span className="px-2.5 py-1 rounded-lg bg-cyan-950 text-cyan-300 border border-cyan-800/60 font-mono text-[11px] font-bold">
            150 Cold-Start SKUs (8-Wk Predictions & Bounds)
          </span>
          <span className="text-slate-500 font-bold">&rarr;</span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-mono text-[11px]">
            Hidden Actuals (Held-Out Evaluation Only)
          </span>
        </div>
        <div className="text-[11px] text-cyan-400 font-mono font-medium">
          Zero Sales Leakage
        </div>
      </div>

      {/* Control Bar: Model, Confidence, Run Action */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Forecasting Model
            </label>
            <select
              value={modelChoice}
              onChange={(e) => setModelChoice(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-hidden"
            >
              <option value="ensemble">Ensemble (Analogue + HistGBM + RF)</option>
              <option value="analogue">Historical Analogue Curve Prior</option>
              <option value="hist_gradient_boosting">HistGradientBoosting Regressor</option>
              <option value="random_forest">Random Forest Multi-Horizon</option>
              <option value="baseline">Category & Subcategory Launch Baseline</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Prediction Interval
            </label>
            <select
              value={confChoice}
              onChange={(e) => setConfChoice(parseFloat(e.target.value))}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 font-medium focus:ring-2 focus:ring-brand-blue/30 focus:border-brand-blue outline-hidden"
            >
              <option value={0.80}>80% Conformal Bounds</option>
              <option value={0.90}>90% Conformal Bounds</option>
            </select>
          </div>

          <button
            onClick={handleStartForecastJob}
            disabled={isProcessing}
            className="mt-4 px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Generating 8-Wk Trajectories...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Generate Forecasts</span>
              </>
            )}
          </button>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Forecasts (.csv)</span>
        </button>
      </div>

      {/* Interactive Detail Chart for Selected SKU */}
      {activeSku && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-brand-blue">{activeSku.sku_id}</span>
                <span className="text-sm font-bold text-slate-800">{activeSku.product_name}</span>
                <StatusBadge type="brand" value={activeSku.brand_tier} />
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Category: <strong>{activeSku.category}</strong> • Retail: <strong>${activeSku.retail_price.toFixed(2)}</strong> • Marketing: <strong>{activeSku.marketing_level}</strong>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Total 8-Week Expected</span>
                <span className="text-lg font-bold text-slate-900 font-mono">
                  {Math.round(activeSku.total_8w_demand)} units
                </span>
              </div>
              <div className="text-right pl-4 border-l border-slate-200">
                <span className="text-[11px] text-slate-500 block">Initial Buy (Q*)</span>
                <span className="text-lg font-bold text-brand-teal font-mono">
                  {activeSku.recommended_buy_quantity} units
                </span>
              </div>
              <button
                onClick={() => onSelectSkuForExplain(activeSku.sku_id)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-brand-teal" /> Explain Forecast
              </button>
            </div>
          </div>

          {/* Fallback Warning Banner */}
          {activeSku.fallback_applied && (
            <div className="mb-4 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-amber-950">Analogue Fallback Activated</span>
                  <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-mono font-bold">
                    {activeSku.confidence_tier || 'Guarded (Low Confidence)'}
                  </span>
                </div>
                <p className="text-amber-800 mt-0.5 leading-relaxed">
                  {activeSku.fallback_reason || `Top analogue similarity is below threshold (<50%) or insufficient analogues (<3). Trajectory stabilized toward Category (${activeSku.category}) Launch Baseline.`}
                </p>
              </div>
            </div>
          )}

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="skuInterval" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.03}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} />
                <Tooltip 
                  formatter={(val: any) => [Number(val).toLocaleString() + ' units']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="upper" stroke="#93c5fd" fillOpacity={1} fill="url(#skuInterval)" name={`Upper Bound (${Math.round(confidenceLevel * 100)}%)`} />
                <Area type="monotone" dataKey="lower" stroke="#93c5fd" fill="#ffffff" fillOpacity={1} name={`Lower Bound (${Math.round(confidenceLevel * 100)}%)`} />
                <Line type="monotone" dataKey="point" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} name="Point Forecast (Selected)" />
                <Line type="monotone" dataKey="analogue" stroke="#0d9488" strokeWidth={1.5} strokeDasharray="4 4" dot={false} name="Analogue Prior" />
                <Line type="monotone" dataKey="hgb" stroke="#8b5cf6" strokeWidth={1.5} strokeDasharray="2 2" dot={false} name="HistGBM Regressor" />
                <Line type="monotone" dataKey="baseline" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 3" dot={false} name="Category Baseline" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Forecast Table with Search & Filters */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Table Filters */}
        <div className="p-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search SKU or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-56 focus:outline-hidden focus:ring-2 focus:ring-brand-blue/20"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg text-xs px-2.5 py-1.5 text-slate-700"
            >
              <option value="All">All Categories</option>
              <option value="Apparel">Apparel</option>
              <option value="Footwear">Footwear</option>
              <option value="Electronics">Electronics</option>
              <option value="Home & Living">Home & Living</option>
              <option value="Beauty & Grooming">Beauty & Grooming</option>
            </select>

            <select
              value={brandFilter}
              onChange={(e) => setBrandFilter(e.target.value)}
              className="bg-white border border-slate-300 rounded-lg text-xs px-2.5 py-1.5 text-slate-700"
            >
              <option value="All">All Brand Tiers</option>
              <option value="Luxury">Luxury</option>
              <option value="Premium">Premium</option>
              <option value="Mainstream">Mainstream</option>
              <option value="Budget">Budget</option>
            </select>
          </div>

          <span className="text-xs text-slate-500 font-mono">
            Showing {filtered.length} of {forecasts.length} cold-start SKUs
          </span>
        </div>

        {/* Forecast Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">SKU ID</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Price</th>
                <th className="px-4 py-3">Analogue Match</th>
                <th className="px-4 py-3">8-Wk Demand</th>
                <th className="px-4 py-3">Prediction Interval</th>
                <th className="px-4 py-3">Recommended Buy (Q*)</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filtered.slice(0, 30).map((f) => {
                const isSelected = f.sku_id === activeSku?.sku_id;
                return (
                  <tr
                    key={f.sku_id}
                    onClick={() => setSelectedSkuId(f.sku_id)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-blue-50/70 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-2.5 text-brand-blue font-bold">{f.sku_id}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-900 truncate max-w-[180px]">
                      {f.product_name}
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      <StatusBadge type="category" value={f.category} />
                    </td>
                    <td className="px-4 py-2.5">${f.retail_price.toFixed(2)}</td>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-1.5 font-sans">
                        <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-brand-teal rounded-full"
                            style={{ width: `${f.top_similarity_score}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-mono">{f.top_similarity_score}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-2.5 font-bold text-slate-900">
                      {Math.round(f.total_8w_demand)}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500">
                      [{Math.round(f.total_lower_8w)} — {Math.round(f.total_upper_8w)}]
                    </td>
                    <td className="px-4 py-2.5 font-bold text-brand-teal">
                      {f.recommended_buy_quantity}
                    </td>
                    <td className="px-4 py-2.5 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSkuForExplain(f.sku_id);
                        }}
                        className="p-1 hover:bg-slate-200 text-slate-600 rounded transition-colors"
                        title="Explain forecast"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
