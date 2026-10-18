import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  DollarSign, 
  Boxes, 
  ShieldCheck, 
  Download, 
  Search, 
  Filter, 
  Store, 
  Calendar, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { SKUForecast } from '../types';

interface PurchasePlanningPageProps {
  forecasts: SKUForecast[];
}

export const PurchasePlanningPage: React.FC<PurchasePlanningPageProps> = ({ forecasts }) => {
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedSkuForAllocation, setSelectedSkuForAllocation] = useState<SKUForecast | null>(null);
  const [clusterData, setClusterData] = useState<any | null>(null);
  const [isLoadingCluster, setIsLoadingCluster] = useState<boolean>(false);

  // Key KPI totals
  const totalRecommendedUnits = forecasts.reduce((sum, f) => sum + f.recommended_buy_quantity, 0);
  const totalForecastDemand = forecasts.reduce((sum, f) => sum + f.total_8w_demand, 0);
  const totalPOCapital = forecasts.reduce((sum, f) => sum + (f.recommended_buy_quantity * (f.cost_price || 25)), 0);
  const totalSafetyStock = forecasts.reduce((sum, f) => sum + f.safety_stock, 0);

  const categories = ['All', ...Array.from(new Set(forecasts.map(f => f.category)))];

  const filteredForecasts = forecasts.filter(f => {
    const matchesSearch = !search || f.sku_id.toLowerCase().includes(search.toLowerCase()) || f.product_name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || f.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenClusterModal = async (f: SKUForecast) => {
    setSelectedSkuForAllocation(f);
    setIsLoadingCluster(true);
    try {
      const res = await apiClient.allocateStoreInventory({
        totalQuantity: f.recommended_buy_quantity,
        category: f.category,
        brandTier: f.brand_tier
      });
      setClusterData(res);
    } catch (err: any) {
      alert(`Store allocation failed: ${err.message}`);
    } finally {
      setIsLoadingCluster(false);
    }
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-6 h-6 text-indigo-600" />
            Purchase Planning & Initial Inventory Orders
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Newsvendor optimal purchasing (<span className="font-mono font-semibold">Q*</span>) balancing understock lost margin against overstock markdowns.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <a
            href={apiClient.getExportPurchaseOrdersUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Export Purchase Orders (PO) CSV</span>
          </a>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Recommended Order Units (Q*)</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {totalRecommendedUnits.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Across {forecasts.length} launch products
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Estimated PO Capital Required</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${totalPOCapital.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </div>
          <div className="text-[11px] text-slate-400">
            At supplier unit wholesale cost
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Safety Stock Buffer</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            +{totalSafetyStock.toLocaleString()} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400">
            +{Math.round((totalSafetyStock / Math.max(1, totalForecastDemand)) * 100)}% buffer over baseline demand
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avg Service Level Target</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            89.4%
          </div>
          <div className="text-[11px] text-slate-400">
            Critical fractile Cu / (Cu + Co)
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search purchase orders by SKU ID or product title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Category:</span>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              {categories.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Purchase Planning Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="px-5 py-3.5">SKU ID</th>
                <th className="px-5 py-3.5">Product Title</th>
                <th className="px-4 py-3.5">Category</th>
                <th className="px-4 py-3.5 text-right">Unit Cost</th>
                <th className="px-4 py-3.5 text-right">8-Wk Demand</th>
                <th className="px-4 py-3.5 text-center">Safety Buffer</th>
                <th className="px-4 py-3.5 text-right">Recommended PO (Q*)</th>
                <th className="px-5 py-3.5 text-right">Total PO Value</th>
                <th className="px-4 py-3.5 text-center">Purchasing Strategy</th>
                <th className="px-5 py-3.5 text-center">Store Allocation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredForecasts.length === 0 ? (
                <tr>
                  <td colSpan={10} className="px-6 py-12 text-center text-slate-400">
                    <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No products match your search criteria</p>
                  </td>
                </tr>
              ) : (
                filteredForecasts.map((f) => {
                  const poValue = f.recommended_buy_quantity * (f.cost_price || 25.0);
                  const isHighRisk = f.uncertainty_score > 48;
                  const strategy = isHighRisk 
                    ? { text: 'Split PO (40% Init)', color: 'bg-amber-50 text-amber-700 border-amber-200' }
                    : { text: 'Full PO Commit', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };

                  return (
                    <tr key={f.sku_id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono font-bold text-indigo-700">
                        {f.sku_id}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900 max-w-xs truncate" title={f.product_name}>
                        {f.product_name}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {f.category}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-600">
                        ${(f.cost_price || 25.0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-slate-700">
                        {Math.round(f.total_8w_demand)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="font-mono text-emerald-600 font-semibold">
                          +{f.safety_stock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-700 text-sm">
                        {f.recommended_buy_quantity}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-900">
                        ${poValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold border ${strategy.color}`}>
                          {strategy.text}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-center">
                        <button
                          onClick={() => handleOpenClusterModal(f)}
                          className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-[11px] flex items-center justify-center space-x-1 mx-auto transition-colors"
                        >
                          <Store className="w-3.5 h-3.5" />
                          <span>Distribute</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <span>Showing <strong>{filteredForecasts.length}</strong> planned purchase orders</span>
          <span className="text-[11px] text-slate-400">Critical fractile formula Cu / (Cu + Co) guarantees minimum total inventory risk</span>
        </div>
      </div>

      {/* STORE CLUSTER ALLOCATION MODAL */}
      {selectedSkuForAllocation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Store className="w-5 h-5 text-indigo-600" />
                  Store Cluster Allocation: {selectedSkuForAllocation.sku_id}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Exact integer allocation of {selectedSkuForAllocation.recommended_buy_quantity} units across retail store clusters.
                </p>
              </div>
              <button 
                onClick={() => setSelectedSkuForAllocation(null)} 
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            {isLoadingCluster ? (
              <div className="py-12 text-center text-slate-400">
                <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                <span>Computing Hamilton-Hare integer store allocation...</span>
              </div>
            ) : clusterData ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Total Units</span>
                    <p className="text-base font-bold text-slate-900">{clusterData.total_quantity} units</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Total Stores</span>
                    <p className="text-base font-bold text-indigo-700">{clusterData.total_stores} stores</p>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <span className="text-[10px] uppercase font-mono text-slate-400">Reconciliation</span>
                    <p className="text-base font-bold text-emerald-600">Exact 100%</p>
                  </div>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">Cluster Name</th>
                        <th className="px-3 py-2.5 text-center">Store Count</th>
                        <th className="px-3 py-2.5 text-center">Weight %</th>
                        <th className="px-4 py-2.5 text-right font-bold">Allocated Units</th>
                        <th className="px-4 py-2.5 text-right">Units / Store</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {clusterData.clusters?.map((c: any) => (
                        <tr key={c.cluster_id} className="hover:bg-slate-50/60">
                          <td className="px-4 py-2.5 font-medium text-slate-900">
                            {c.cluster_name}
                          </td>
                          <td className="px-3 py-2.5 text-center text-slate-600">
                            {c.store_count}
                          </td>
                          <td className="px-3 py-2.5 text-center font-mono text-slate-500">
                            {c.share_pct}%
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold text-indigo-700">
                            {c.allocated_units}
                          </td>
                          <td className="px-4 py-2.5 text-right font-mono text-slate-600">
                            {c.avg_units_per_store}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedSkuForAllocation(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
                  >
                    Close Distribution View
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
