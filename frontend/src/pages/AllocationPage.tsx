import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Store, 
  CheckCircle2, 
  Boxes, 
  RefreshCw, 
  Layers, 
  Building2, 
  Percent,
  Download
} from 'lucide-react';
import type { SKUForecast, ClusterAllocationResult } from '../types';
import { apiClient } from '../api/client';

interface AllocationPageProps {
  forecasts: SKUForecast[];
}

export const AllocationPage: React.FC<AllocationPageProps> = ({ forecasts }) => {
  const [selectedSkuId, setSelectedSkuId] = useState<string>(forecasts[0]?.sku_id || '');
  const [customQuantity, setCustomQuantity] = useState<number>(forecasts[0]?.recommended_buy_quantity || 500);
  const [allocation, setAllocation] = useState<ClusterAllocationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeSku = forecasts.find((f) => f.sku_id === selectedSkuId) || forecasts[0];

  useEffect(() => {
    if (activeSku) {
      setCustomQuantity(activeSku.recommended_buy_quantity);
      runAllocation(activeSku.recommended_buy_quantity, activeSku.category, activeSku.brand_tier);
    }
  }, [selectedSkuId]);

  const runAllocation = async (qty: number, category: string, brandTier: string) => {
    setIsLoading(true);
    try {
      const res = await apiClient.allocateStoreInventory({
        totalQuantity: qty,
        category,
        brandTier
      });
      setAllocation(res);
    } catch (err) {
      console.error('Allocation error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecalculate = () => {
    if (activeSku) {
      runAllocation(customQuantity, activeSku.category, activeSku.brand_tier);
    }
  };

  const COLORS = ['#2563eb', '#0d9488', '#8b5cf6', '#f59e0b', '#0f172a'];

  return (
    <div className="p-8 space-y-6">
      {/* Top Selector Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Product to Allocate
            </label>
            <select
              value={selectedSkuId}
              onChange={(e) => setSelectedSkuId(e.target.value)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 font-medium outline-hidden w-80"
            >
              {forecasts.map((f) => (
                <option key={f.sku_id} value={f.sku_id}>
                  {f.sku_id} — {f.product_name} ({f.recommended_buy_quantity} units)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Total Units to Allocate (Q*)
            </label>
            <input
              type="number"
              min="0"
              value={customQuantity}
              onChange={(e) => setCustomQuantity(parseInt(e.target.value) || 0)}
              className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 font-mono font-bold w-36"
            />
          </div>

          <button
            onClick={handleRecalculate}
            disabled={isLoading}
            className="mt-4 px-4 py-2 bg-brand-blue hover:bg-blue-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Re-apportion</span>
          </button>
        </div>

        {/* Exact Sum Reconciliation Badge & Export */}
        <div className="flex items-center gap-3">
          {allocation && (
            <div className="flex items-center gap-2 p-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Exact Sum: <strong>{allocation.allocated_sum}</strong> / <strong>{allocation.total_recommended_quantity}</strong> units
              </span>
            </div>
          )}

          <button
            onClick={() => window.location.href = apiClient.getExportAllocationsUrl()}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Allocations (.csv)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Charts & Allocation Table */}
      {allocation && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cluster Breakdown Bar Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-800">Cluster Inventory Apportionment</h3>
                <p className="text-xs text-slate-500">
                  Allocated units per cluster using Largest Remainder (Hamilton-Hare) method
                </p>
              </div>
              <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                {activeSku?.category} Affinity
              </span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={allocation.clusters} margin={{ top: 10, right: 10, left: -10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="cluster_name" stroke="#64748b" fontSize={10} interval={0} angle={-15} textAnchor="end" />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip 
                    formatter={(val: any) => [Number(val).toLocaleString() + ' units', 'Allocated Units']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="allocated_units" fill="#2563eb" radius={[4, 4, 0, 0]} name="Allocated Units" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Allocation Share Donut Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-1">Channel & Cluster Share</h3>
              <p className="text-xs text-slate-500 mb-4">Proportion of initial inventory buy</p>

              <div className="h-52 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={allocation.clusters}
                      dataKey="allocated_units"
                      nameKey="cluster_name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {allocation.clusters.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(val: any) => [Number(val).toLocaleString() + ' units']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-1.5 border-t border-slate-100 pt-3 text-xs">
              {allocation.clusters.map((c, idx) => (
                <div key={c.cluster_id} className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></span>
                    <span className="text-slate-600 truncate">{c.cluster_name}</span>
                  </div>
                  <span className="font-mono font-bold text-slate-800">{c.share_pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Cluster Allocation Detail Table */}
      {allocation && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Store Cluster Allocation Roster & Density
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              Total Stores: {allocation.clusters.reduce((acc, c) => acc + c.store_count, 0)} doors
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3">Store Cluster</th>
                  <th className="px-5 py-3">Store Count</th>
                  <th className="px-5 py-3">Capacity Weight</th>
                  <th className="px-5 py-3">Allocated Total (Units)</th>
                  <th className="px-5 py-3">Share (%)</th>
                  <th className="px-5 py-3 text-right">Avg Units / Store</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {allocation.clusters.map((c) => (
                  <tr key={c.cluster_id} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-sans font-semibold text-slate-900">
                      {c.cluster_name}
                    </td>
                    <td className="px-5 py-3 text-slate-600">{c.store_count} stores</td>
                    <td className="px-5 py-3 text-slate-600">{c.target_weight}%</td>
                    <td className="px-5 py-3 font-bold text-brand-blue">
                      {c.allocated_units.toLocaleString()} units
                    </td>
                    <td className="px-5 py-3 text-slate-700">{c.share_pct}%</td>
                    <td className="px-5 py-3 text-right font-bold text-brand-teal">
                      {c.avg_units_per_store} units/store
                    </td>
                  </tr>
                ))}
                {/* Total Summary Row */}
                <tr className="bg-slate-50 font-bold text-slate-900">
                  <td className="px-5 py-3 font-sans">Total Allocated Inventory</td>
                  <td className="px-5 py-3">{allocation.clusters.reduce((acc, c) => acc + c.store_count, 0)} stores</td>
                  <td className="px-5 py-3">100.0%</td>
                  <td className="px-5 py-3 text-brand-blue font-bold">
                    {allocation.allocated_sum.toLocaleString()} units
                  </td>
                  <td className="px-5 py-3">100.0%</td>
                  <td className="px-5 py-3 text-right text-slate-700">
                    {Math.round(allocation.allocated_sum / allocation.clusters.reduce((acc, c) => acc + c.store_count, 0))} avg
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
