import React, { useState } from 'react';
import { 
  AlertTriangle, 
  ShieldAlert, 
  ArrowRight, 
  Info, 
  Sparkles, 
  TrendingUp, 
  Layers,
  ChevronRight,
  Eye
} from 'lucide-react';
import type { LeastConfidentSKU } from '../types';
import { StatusBadge } from '../components/StatusBadge';

interface RiskPageProps {
  riskSkus: LeastConfidentSKU[];
  onSelectSkuForExplain: (skuId: string) => void;
}

export const RiskPage: React.FC<RiskPageProps> = ({
  riskSkus,
  onSelectSkuForExplain
}) => {
  const [selectedSku, setSelectedSku] = useState<LeastConfidentSKU | null>(riskSkus[0] || null);

  const active = selectedSku || riskSkus[0];

  return (
    <div className="p-8 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-900/90 to-rose-950 text-white p-6 rounded-xl border border-amber-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> High Uncertainty Watchlist
            </span>
            <span className="text-xs text-amber-200">• Multi-Dimensional Risk Index</span>
          </div>
          <h2 className="text-base font-bold text-white">Top 10 Least-Confident Cold-Start Products</h2>
          <p className="text-xs text-amber-100/80 max-w-2xl mt-0.5">
            Diagnosed based on wide prediction spreads, analogue novelty, model divergence, and category volatility. 
            Requires dedicated retail buyer mitigation actions before purchase order commitment.
          </p>
        </div>
      </div>

      {/* Selected SKU Deep Dive Card */}
      {active && (
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-rose-600">{active.sku_id}</span>
                <span className="text-sm font-bold text-slate-800">{active.product_name}</span>
                <StatusBadge type="risk" value={active.risk_tier} />
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Category: <strong>{active.category || 'General'}</strong> • Retail Price: <strong>${(active.retail_price ?? 0).toFixed(2)}</strong> • Brand: <strong>{active.brand_tier || 'Standard'}</strong>
              </p>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right">
                <span className="text-[11px] text-slate-500 block">Composite Uncertainty Score</span>
                <span className="text-xl font-bold font-mono text-rose-600">
                  {(active.composite_risk_score ?? 0).toFixed(1)} / 100
                </span>
              </div>
              <button
                onClick={() => onSelectSkuForExplain(active.sku_id)}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Eye className="w-3.5 h-3.5" /> View Analogues
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            {/* Risk Drivers Breakdown */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Root Cause Uncertainty Drivers:
              </h4>
              <div className="space-y-2">
                {(active.risk_drivers || []).map((driver, idx) => (
                  <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-lg text-xs text-amber-900 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 mt-1.5 shrink-0"></span>
                    <span>{driver}</span>
                  </div>
                ))}
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 pt-2 text-xs font-mono">
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">Analogue Match</span>
                  <span className="font-bold text-slate-800">{active.top_similarity_score ?? 0}%</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">Spread (Upper - Lower)</span>
                  <span className="font-bold text-slate-800">±{Math.round((active.interval_width_8w ?? 0) / 2)} units</span>
                </div>
                <div className="p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-[10px] text-slate-500 block font-sans">Model Disagreement</span>
                  <span className="font-bold text-slate-800">±{active.model_disagreement_std ?? 0} u/wk</span>
                </div>
              </div>
            </div>

            {/* Recommended Buyer Action Card */}
            <div className="p-5 bg-gradient-to-br from-slate-900 to-navy-950 text-white rounded-xl flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-teal-400 tracking-wider uppercase block mb-1">
                  Merchandise Buyer Recommendation
                </span>
                <h4 className="text-sm font-bold text-white mb-2">Prescribed Inventory Tactic:</h4>
                <p className="text-xs text-slate-200 leading-relaxed">
                  {active.recommended_buyer_action || 'Order initial quantity based on conservative demand lower bound.'}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <span>Baseline Forecast: <strong className="text-white font-mono">{Math.round(active.point_forecast_8w ?? 0)} units</strong></span>
                <span>Interval: <strong className="text-white font-mono">[{Math.round(active.total_lower_8w ?? 0)} — {Math.round(active.total_upper_8w ?? 0)}]</strong></span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Ranked Watchlist (10 Least-Confident Launches)
          </h3>
          <span className="text-xs text-slate-500 font-mono">
            Sorted by Composite Uncertainty Index
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
              <tr>
                <th className="px-4 py-3">Rank</th>
                <th className="px-4 py-3">SKU ID</th>
                <th className="px-4 py-3">Product Name</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Risk Tier</th>
                <th className="px-4 py-3">Analogue Match</th>
                <th className="px-4 py-3">Prediction Spread</th>
                <th className="px-4 py-3">Composite Risk</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {riskSkus.map((sku, idx) => {
                const isSelected = sku.sku_id === active?.sku_id;
                return (
                  <tr
                    key={sku.sku_id}
                    onClick={() => setSelectedSku(sku)}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'bg-amber-50/60 font-semibold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <td className="px-4 py-2.5 font-bold text-slate-400">#{idx + 1}</td>
                    <td className="px-4 py-2.5 font-bold text-rose-600">{sku.sku_id}</td>
                    <td className="px-4 py-2.5 font-sans font-medium text-slate-900 truncate max-w-[180px]">
                      {sku.product_name}
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      <StatusBadge type="category" value={sku.category} />
                    </td>
                    <td className="px-4 py-2.5 font-sans">
                      <StatusBadge type="risk" value={sku.risk_tier} />
                    </td>
                    <td className="px-4 py-2.5">
                      <span className={`font-bold ${(sku.top_similarity_score ?? 0) < 70 ? 'text-rose-600' : 'text-slate-700'}`}>
                        {sku.top_similarity_score ?? 0}%
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-600">
                      [{Math.round(sku.total_lower_8w ?? 0)} — {Math.round(sku.total_upper_8w ?? 0)}]
                    </td>
                    <td className="px-4 py-2.5 font-bold text-rose-600">
                      {(sku.composite_risk_score ?? 0).toFixed(1)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSku(sku);
                        }}
                        className="text-xs text-brand-blue hover:text-blue-700 font-semibold"
                      >
                        Review
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
