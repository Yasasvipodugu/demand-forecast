import React, { useState, useEffect } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Sparkles, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Layers, 
  CheckCircle2, 
  Search,
  Award
} from 'lucide-react';
import type { SKUForecast, SKUExplanation } from '../types';
import { apiClient, buildClientSkuExplanation } from '../api/client';
import { DEMO_FORECASTS } from '../api/demoData';
import { StatusBadge } from '../components/StatusBadge';

interface ExplainabilityPageProps {
  forecasts: SKUForecast[];
  initialSkuId?: string;
}

export const ExplainabilityPage: React.FC<ExplainabilityPageProps> = ({
  forecasts,
  initialSkuId
}) => {
  const productList = (forecasts && forecasts.length > 0) ? forecasts : DEMO_FORECASTS;
  const [selectedSkuId, setSelectedSkuId] = useState<string>(initialSkuId || productList[0]?.sku_id || 'NEW-SKU-001');
  const [explanation, setExplanation] = useState<SKUExplanation | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const activeSku = productList.find((f) => f.sku_id === selectedSkuId) || productList[0];

  useEffect(() => {
    if (initialSkuId) {
      setSelectedSkuId(initialSkuId);
    } else if (!selectedSkuId && productList.length > 0) {
      setSelectedSkuId(productList[0].sku_id);
    }
  }, [initialSkuId, forecasts]);

  useEffect(() => {
    if (selectedSkuId) {
      fetchExplanation(selectedSkuId);
    }
  }, [selectedSkuId]);

  const fetchExplanation = async (skuId: string) => {
    setIsLoading(true);
    try {
      const data = await apiClient.getSkuExplanations(skuId);
      if (data && Array.isArray(data.top_analogues) && data.top_analogues.length > 0) {
        setExplanation(data);
      } else {
        setExplanation(buildClientSkuExplanation(skuId));
      }
    } catch (err) {
      console.error('Failed to load explanations:', err);
      setExplanation(buildClientSkuExplanation(skuId));
    } finally {
      setIsLoading(false);
    }
  };

  // Overlay chart: New SKU forecast vs Top 3 Historical Analogues
  const launchCurveComparisonData = [1, 2, 3, 4, 5, 6, 7, 8].map((w, idx) => {
    const point = activeSku?.weekly_forecast?.[idx] ?? 0;
    const entry: Record<string, any> = {
      week: `Week ${w}`,
      'New SKU Forecast': point
    };
    if (explanation && Array.isArray(explanation.top_analogues)) {
      explanation.top_analogues.slice(0, 3).forEach((a, aIdx) => {
        if (a && Array.isArray(a.launch_curve) && a.launch_curve[idx] !== undefined) {
          entry[`Analogue ${aIdx + 1} (${a.similarity_score}%)`] = a.launch_curve[idx];
        }
      });
    }
    return entry;
  });

  return (
    <div className="p-8 space-y-6">
      {/* Top SKU Selector */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Explain Forecast For Product
          </label>
          <select
            value={selectedSkuId}
            onChange={(e) => setSelectedSkuId(e.target.value)}
            className="bg-slate-50 border border-slate-300 text-slate-800 text-xs rounded-lg px-3 py-1.5 font-medium outline-hidden w-80"
          >
            {productList.map((f) => (
              <option key={f.sku_id} value={f.sku_id}>
                {f.sku_id} — {f.product_name}
              </option>
            ))}
          </select>
        </div>

        {activeSku && (
          <div className="flex items-center gap-3">
            <StatusBadge type="brand" value={activeSku.brand_tier} />
            <span className="text-xs text-slate-500">
              Analogue Fit: <strong className="text-brand-teal font-mono">{activeSku.top_similarity_score}%</strong>
            </span>
            <span className="text-xs text-slate-500">
              Uncertainty: <strong className="text-slate-900 font-mono">{activeSku.uncertainty_score}/100</strong>
            </span>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="p-8 space-y-4 bg-white rounded-xl border border-slate-200 animate-pulse">
          <div className="h-20 bg-slate-100 rounded-lg"></div>
          <div className="grid grid-cols-2 gap-4">
            <div className="h-64 bg-slate-100 rounded-lg"></div>
            <div className="h-64 bg-slate-100 rounded-lg"></div>
          </div>
        </div>
      ) : explanation ? (
        <div className="space-y-6">
          {/* Executive Narrative Summary Card */}
          <div className="bg-gradient-to-r from-blue-900 to-navy-900 text-white p-6 rounded-xl shadow-xs border border-navy-800">
            <div className="flex items-center gap-2 mb-2 text-brand-teal text-xs font-bold tracking-wider uppercase">
              <Sparkles className="w-4 h-4 text-brand-teal" />
              Explainable AI • Retail Buyer Narrative
            </div>
            <h3 className="text-base font-bold text-white mb-2">
              Launch Rationale for {activeSku?.sku_id} ({activeSku?.product_name})
            </h3>
            <p className="text-xs leading-relaxed text-slate-200">
              {explanation.executive_summary}
            </p>
          </div>

          {/* Visual Overlay: New SKU vs Top Analogues */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Launch Trajectory vs Historical Twins</h3>
                  <p className="text-xs text-slate-500">
                    Compares new cold-start forecast against the actual historical launch curves of top analogues
                  </p>
                </div>
                <span className="text-xs font-mono bg-teal-50 text-teal-800 px-2 py-0.5 rounded border border-teal-200">
                  Top 3 Analogues
                </span>
              </div>

              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={launchCurveComparisonData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="week" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip 
                      formatter={(val: any) => [Number(val).toLocaleString() + ' units']}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                    />
                    <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Line type="monotone" dataKey="New SKU Forecast" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
                    {(explanation.top_analogues || []).slice(0, 3).map((a, idx) => {
                      const colors = ['#0d9488', '#f59e0b', '#8b5cf6'];
                      const key = `Analogue ${idx + 1} (${a.similarity_score}%)`;
                      return (
                        <Line
                          key={a.sku_id || idx}
                          type="monotone"
                          dataKey={key}
                          stroke={colors[idx]}
                          strokeWidth={1.5}
                          strokeDasharray="4 4"
                          dot={false}
                        />
                      );
                    })}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Demand Driver Decomposition (+ / -) */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-800 mb-1">Demand Driver Attribution</h3>
                <p className="text-xs text-slate-500 mb-4">Product attribute pressure vs category baseline</p>

                <div className="space-y-3">
                  {(explanation.demand_drivers || []).map((d, idx) => (
                    <div key={idx} className="p-3 rounded-lg border border-slate-100 bg-slate-50 text-xs">
                      <div className="flex items-center justify-between font-semibold mb-1">
                        <span className="text-slate-800">{d.factor}</span>
                        <span className={`font-mono flex items-center gap-0.5 ${
                          d.impact_pct > 0 ? 'text-emerald-600' : d.impact_pct < 0 ? 'text-rose-600' : 'text-slate-600'
                        }`}>
                          {d.impact_pct > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : d.impact_pct < 0 ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : null}
                          {d.impact_pct > 0 ? `+${d.impact_pct}%` : `${d.impact_pct}%`}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{d.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Uncertainty Reasons Checklist */}
              <div className="mt-4 pt-3 border-t border-slate-100 text-xs">
                <span className="font-bold text-slate-800 block mb-1.5 flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  Uncertainty Analysis:
                </span>
                <ul className="space-y-1 text-slate-600 text-[11px]">
                  {(explanation.uncertainty_reasons || []).map((r, idx) => (
                    <li key={idx} className="flex items-start gap-1.5">
                      <span className="text-slate-400">•</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Top 5 Historical Analogues Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Top 5 Historical Analogues & Multi-Attribute Similarity Scores
              </h3>
              <span className="text-xs text-slate-500 font-mono">
                Gower Mixed-Feature Distance Metric
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100/70 border-b border-slate-200 text-slate-600 uppercase text-[10px] tracking-wider font-semibold">
                  <tr>
                    <th className="px-4 py-2.5">Historical SKU</th>
                    <th className="px-4 py-2.5">Product Name</th>
                    <th className="px-4 py-2.5">Category & Subcategory</th>
                    <th className="px-4 py-2.5">Brand Tier</th>
                    <th className="px-4 py-2.5">Retail Price</th>
                    <th className="px-4 py-2.5">Similarity Match</th>
                    <th className="px-4 py-2.5">8-Wk Total Sold</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                  {(explanation.top_analogues || []).map((a, idx) => {
                    const curve = a.launch_curve || [];
                    const totalSold = curve.reduce((acc, x) => acc + x, 0);
                    return (
                      <tr key={a.sku_id || idx} className="hover:bg-slate-50">
                        <td className="px-4 py-2 text-brand-blue font-bold">
                          #{idx + 1} {a.sku_id}
                        </td>
                        <td className="px-4 py-2 font-sans font-medium text-slate-900">
                          {a.product_name}
                        </td>
                        <td className="px-4 py-2 font-sans text-slate-600">
                          {a.category} • {a.subcategory}
                        </td>
                        <td className="px-4 py-2 font-sans">
                          <StatusBadge type="brand" value={a.brand_tier} />
                        </td>
                        <td className="px-4 py-2">${(a.retail_price || 0).toFixed(2)}</td>
                        <td className="px-4 py-2">
                          <div className="flex items-center gap-2 font-sans">
                            <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-brand-teal rounded-full"
                                style={{ width: `${Math.min(100, Math.max(0, a.similarity_score || 0))}%` }}
                              />
                            </div>
                            <span className="font-bold text-slate-900 font-mono">{a.similarity_score}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 font-bold text-slate-900 font-mono">
                          {totalSold} units
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-xl border border-slate-200 text-center shadow-xs">
          <Sparkles className="w-8 h-8 text-indigo-500 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-slate-800">Select a Product to View Forecast Explanation</h4>
          <p className="text-xs text-slate-500 mt-1">Choose any of the 150 cold-start SKUs from the dropdown above to inspect analogue launch curve matching and attribution drivers.</p>
        </div>
      )}
    </div>
  );
};
