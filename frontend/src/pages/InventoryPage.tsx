import React, { useState, useEffect } from 'react';
import { 
  Boxes, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  Plus, 
  Search, 
  RefreshCw, 
  Download, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Sliders, 
  FileText,
  ShieldCheck,
  ArrowUpDown
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { Product, InventoryTransaction, InventorySummary, SKUForecast } from '../types';

interface InventoryPageProps {
  forecasts: SKUForecast[];
}

export const InventoryPage: React.FC<InventoryPageProps> = ({ forecasts }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [transactions, setTransactions] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [activeView, setActiveView] = useState<'roster' | 'transactions' | 'calculator'>('roster');

  // Modals & messages
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState<boolean>(false);
  const [selectedSkuForAdjust, setSelectedSkuForAdjust] = useState<string>('');
  const [adjustType, setAdjustType] = useState<string>('Receive Purchase Order (+)');
  const [adjustDelta, setAdjustDelta] = useState<number>(25);
  const [adjustNotes, setAdjustNotes] = useState<string>('Supplier delivery receipt');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Newsvendor calculator state
  const [calcSkuId, setCalcSkuId] = useState<string>(forecasts[0]?.sku_id || '');
  const [cuCost, setCuCost] = useState<number>(40.0);
  const [coCost, setCoCost] = useState<number>(15.0);
  const [calcResult, setCalcResult] = useState<any | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [prodRes, sumRes, txRes] = await Promise.all([
        apiClient.getShopProducts({ limit: 200 }),
        apiClient.getInventorySummary(),
        apiClient.getInventoryTransactions(100)
      ]);
      setProducts(prodRes.products || []);
      setSummary(sumRes);
      setTransactions(txRes.transactions || []);
      if (prodRes.products.length > 0 && !selectedSkuForAdjust) {
        setSelectedSkuForAdjust(prodRes.products[0].sku_id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load inventory data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAdjustStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSkuForAdjust) {
      setError('Please select a product.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const delta = adjustType.includes('(-)') ? -Math.abs(adjustDelta) : adjustDelta;
      await apiClient.adjustInventoryStock({
        sku_id: selectedSkuForAdjust,
        adjustment_type: adjustType,
        quantity_delta: delta,
        notes: adjustNotes
      });
      setSuccessMessage(`Stock successfully adjusted for SKU ${selectedSkuForAdjust}.`);
      setIsAdjustModalOpen(false);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Stock adjustment failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRunCalc = async () => {
    const sku = forecasts.find(f => f.sku_id === calcSkuId) || forecasts[0];
    if (!sku) return;
    try {
      const res = await apiClient.recalculateInventory({
        totalDemand: sku.total_8w_demand,
        intervalLower: sku.total_lower_8w,
        intervalUpper: sku.total_upper_8w,
        understockCost: cuCost,
        overstockCost: coCost,
        retailPrice: sku.retail_price,
        unitCost: sku.cost_price
      });
      setCalcResult(res);
    } catch (err: any) {
      alert(`Calculation error: ${err.message}`);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesSearch = !search || p.sku_id.toLowerCase().includes(search.toLowerCase()) || p.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'All' || p.stock_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExportInventoryCSV = () => {
    const headers = ['SKU ID', 'Product Title', 'Category', 'Current Stock', 'Min Safety Stock', 'Cost Value ($)', 'Retail Value ($)', 'Status'];
    const rows = products.map(p => [
      p.sku_id,
      `"${p.name.replace(/"/g, '""')}"`,
      p.category,
      p.stock,
      p.min_stock,
      (p.stock * p.cost).toFixed(2),
      (p.stock * p.price).toFixed(2),
      p.stock_status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `launchwise_inventory_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Boxes className="w-6 h-6 text-indigo-600" />
            Live Inventory Management & Stock Adjustments
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time store stock levels, inventory audit logs, reorder triggers, and Newsvendor profit-optimized safety stock.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportInventoryCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Stock CSV</span>
          </button>

          <button
            onClick={() => setIsAdjustModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Adjust Stock Level</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Units on Hand</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {summary ? summary.total_units_in_stock.toLocaleString() : '0'} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Across {summary?.total_skus || 0} active SKU positions
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Retail Stock Value</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${summary ? summary.total_retail_value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
          </div>
          <div className="text-[11px] text-slate-400">
            Wholesale Cost: ${summary ? summary.total_cost_value.toLocaleString('en-US', { maximumFractionDigits: 0 }) : '0'}
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Low Stock / Reorder Needed</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-600">
            {summary ? summary.low_stock_skus : 0} <span className="text-xs font-normal text-slate-400">SKUs</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Inventory at or below safety threshold
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Healthy Stock Coverage</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {summary ? summary.healthy_skus : 0} <span className="text-xs font-normal text-slate-400">SKUs</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Balanced launch inventory positions
          </div>
        </div>
      </div>

      {/* View Switcher Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200">
        <div className="flex items-center space-x-1">
          <button
            onClick={() => setActiveView('roster')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeView === 'roster'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Live Stock Roster ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveView('transactions')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeView === 'transactions'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Inventory Movement Audit Log ({transactions.length})</span>
          </button>

          <button
            onClick={() => setActiveView('calculator')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-all flex items-center space-x-2 ${
              activeView === 'calculator'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>Newsvendor Q* Calculator</span>
          </button>
        </div>

        <button
          onClick={loadData}
          title="Refresh Data"
          className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 mb-1"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* VIEW 1: LIVE STOCK ROSTER */}
      {activeView === 'roster' && (
        <div className="space-y-4">
          {/* Search & Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="Search stock by SKU ID or product name..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
              />
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
              >
                <option value="All">All Stock Levels</option>
                <option value="Healthy">Healthy</option>
                <option value="Low Stock">Low Stock</option>
                <option value="Out of Stock">Out of Stock</option>
                <option value="Overstocked">Overstocked</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                  <tr>
                    <th className="px-5 py-3.5">SKU ID</th>
                    <th className="px-5 py-3.5">Product Title</th>
                    <th className="px-4 py-3.5">Category</th>
                    <th className="px-4 py-3.5 text-center">Stock on Hand</th>
                    <th className="px-4 py-3.5 text-center">Min Safety Stock</th>
                    <th className="px-4 py-3.5 text-right">Wholesale Cost</th>
                    <th className="px-4 py-3.5 text-right">Total Inventory Value</th>
                    <th className="px-4 py-3.5 text-center">Stock Status</th>
                    <th className="px-5 py-3.5 text-center">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-12 text-center text-slate-400">
                        <Boxes className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">No inventory matches your search filter</p>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => {
                      const stockVal = p.stock * p.price;
                      return (
                        <tr key={p.sku_id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold text-indigo-700">
                            {p.sku_id}
                          </td>
                          <td className="px-5 py-3 font-medium text-slate-900 max-w-xs truncate" title={p.name}>
                            {p.name}
                          </td>
                          <td className="px-4 py-3 text-slate-600">
                            {p.category}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`font-bold font-mono text-sm ${
                              p.stock <= 0 ? 'text-rose-600' : p.stock <= p.min_stock ? 'text-amber-600' : 'text-slate-900'
                            }`}>
                              {p.stock}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-mono text-slate-500">
                            {p.min_stock}
                          </td>
                          <td className="px-4 py-3 text-right font-mono text-slate-600">
                            ${p.cost.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-mono font-semibold text-slate-900">
                            ${stockVal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.stock_status === 'Healthy'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : p.stock_status === 'Low Stock'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : p.stock_status === 'Out of Stock'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                            }`}>
                              {p.stock_status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-center">
                            <button
                              onClick={() => {
                                setSelectedSkuForAdjust(p.sku_id);
                                setIsAdjustModalOpen(true);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 font-medium text-[11px] transition-colors"
                            >
                              Adjust
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
              <span>Displaying <strong>{filteredProducts.length}</strong> SKU stock positions</span>
              <span className="text-[11px] text-slate-400">Live data synchronized with SQLite storage</span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: INVENTORY MOVEMENT AUDIT LOG */}
      {activeView === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
                <tr>
                  <th className="px-5 py-3.5">Log ID</th>
                  <th className="px-5 py-3.5">Date & Time</th>
                  <th className="px-4 py-3.5">SKU ID</th>
                  <th className="px-5 py-3.5">Product Name</th>
                  <th className="px-4 py-3.5 text-center">Transaction Type</th>
                  <th className="px-4 py-3.5 text-center">Quantity Delta</th>
                  <th className="px-4 py-3.5 text-center">Stock After</th>
                  <th className="px-5 py-3.5">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-700">No inventory movement logs recorded yet</p>
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 font-mono text-slate-500">
                        #{String(tx.id).padStart(5, '0')}
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-mono text-[11px]">
                        {tx.created_at.slice(0, 16).replace('T', ' ')}
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                        {tx.sku_id}
                      </td>
                      <td className="px-5 py-3 font-medium text-slate-900 max-w-xs truncate" title={tx.product_name}>
                        {tx.product_name}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                          tx.transaction_type.includes('Sale')
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : tx.transaction_type.includes('PO') || tx.transaction_type.includes('Inflow')
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {tx.transaction_type}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-bold font-mono">
                        <span className={tx.quantity_delta < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                          {tx.quantity_delta > 0 ? `+${tx.quantity_delta}` : tx.quantity_delta}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-bold text-slate-900">
                        {tx.stock_after}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-[11px]">
                        {tx.notes || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VIEW 3: NEWSVENDOR Q* CALCULATOR */}
      {activeView === 'calculator' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-600" />
              Interactive Newsvendor Inventory Optimization ($Q^*$)
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Adjust understock lost margin ($C_u$) and overstock holding cost ($C_o$) to observe how critical fractile shifts initial order recommendations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Select Launch SKU</label>
              <select
                value={calcSkuId}
                onChange={(e) => setCalcSkuId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
              >
                {forecasts.map(f => (
                  <option key={f.sku_id} value={f.sku_id}>{f.sku_id} • {f.product_name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Lost Margin Cu ($ Price - Cost)</label>
              <input
                type="number"
                step="1"
                value={cuCost}
                onChange={(e) => setCuCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Overstock Loss Co ($ Cost - Salvage)</label>
              <input
                type="number"
                step="1"
                value={coCost}
                onChange={(e) => setCoCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleRunCalc}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm transition-all flex items-center space-x-1.5"
            >
              <Sliders className="w-4 h-4" />
              <span>Compute Optimal Order Q*</span>
            </button>
          </div>

          {calcResult && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-indigo-50/50 border border-indigo-100">
              <div className="text-center p-3 rounded-lg bg-white shadow-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400">Critical Fractile</span>
                <p className="text-xl font-bold text-indigo-700">{(calcResult.critical_fractile * 100).toFixed(1)}%</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white shadow-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400">Recommended Buy (Q*)</span>
                <p className="text-xl font-bold text-emerald-600">{calcResult.recommended_initial_buy} units</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white shadow-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400">Safety Stock Buffer</span>
                <p className="text-xl font-bold text-slate-900">+{calcResult.safety_stock} units</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-white shadow-xs">
                <span className="text-[10px] uppercase font-mono text-slate-400">Expected Stockout Risk</span>
                <p className="text-xl font-bold text-amber-600">{calcResult.stockout_risk_pct}%</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADJUST STOCK MODAL */}
      {isAdjustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                Adjust Stock Inventory Level
              </h2>
              <button onClick={() => setIsAdjustModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustStock} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Target Product *</label>
                <select
                  value={selectedSkuForAdjust}
                  onChange={(e) => setSelectedSkuForAdjust(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  {products.map(p => (
                    <option key={p.sku_id} value={p.sku_id}>
                      {p.sku_id} • {p.name} (Current: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Adjustment Action Type *</label>
                <select
                  value={adjustType}
                  onChange={(e) => setAdjustType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="Receive Purchase Order (+)">Receive Purchase Order (+)</option>
                  <option value="Cycle Count Adjustment (+/-)">Cycle Count Adjustment (+/-)</option>
                  <option value="Damaged / Write-Off (-)">Damaged / Write-Off (-)</option>
                  <option value="Customer Return (+)">Customer Return (+)</option>
                  <option value="Set Absolute Stock">Set Absolute Stock Count</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">
                  {adjustType === 'Set Absolute Stock' ? 'New Total Stock Count' : 'Units Delta'} *
                </label>
                <input
                  type="number"
                  required
                  value={adjustDelta}
                  onChange={(e) => setAdjustDelta(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Reason / Reference Notes</label>
                <input
                  type="text"
                  placeholder="e.g. PO #10492 received from distributor"
                  value={adjustNotes}
                  onChange={(e) => setAdjustNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Updating...' : 'Commit Stock Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
