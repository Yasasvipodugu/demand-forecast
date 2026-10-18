import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Plus, 
  Download, 
  Search, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  X,
  CreditCard,
  Store
} from 'lucide-react';
import { apiClient } from '../api/client';
import type { SaleTransaction, SalesMetrics, Product } from '../types';

export const SalesPage: React.FC = () => {
  const [sales, setSales] = useState<SaleTransaction[]>([]);
  const [metrics, setMetrics] = useState<SalesMetrics | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [selectedChannel, setSelectedChannel] = useState<string>('All');
  
  const [isRecordModalOpen, setIsRecordModalOpen] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form state
  const [saleSku, setSaleSku] = useState<string>('');
  const [saleQty, setSaleQty] = useState<number>(1);
  const [salePrice, setSalePrice] = useState<number>(49.99);
  const [saleChannel, setSaleChannel] = useState<string>('In-Store POS');
  const [saleDate, setSaleDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [salesRes, metricsRes, prodRes] = await Promise.all([
        apiClient.getShopSales(100),
        apiClient.getShopSalesMetrics(),
        apiClient.getShopProducts({ limit: 200 })
      ]);
      setSales(salesRes.sales || []);
      setMetrics(metricsRes);
      setProducts(prodRes.products || []);
      if (prodRes.products && prodRes.products.length > 0 && !saleSku) {
        setSaleSku(prodRes.products[0].sku_id);
        setSalePrice(prodRes.products[0].price);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load sales data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleProductSelect = (skuId: string) => {
    setSaleSku(skuId);
    const prod = products.find(p => p.sku_id === skuId);
    if (prod) {
      setSalePrice(prod.price);
    }
  };

  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saleSku) {
      setError('Please select a product.');
      return;
    }
    if (saleQty <= 0) {
      setError('Quantity must be at least 1.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await apiClient.recordShopSale({
        sku_id: saleSku,
        quantity: saleQty,
        unit_price: salePrice,
        channel: saleChannel,
        sale_date: saleDate
      });
      setSuccessMessage(`Sale recorded successfully! Total: $${res.sale.total_amount}. Remaining stock: ${res.sale.stock_remaining} units.`);
      setIsRecordModalOpen(false);
      setSaleQty(1);
      await loadData();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to record sale');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Order ID', 'Sale Date', 'SKU ID', 'Product Title', 'Channel', 'Quantity', 'Unit Price ($)', 'Total Amount ($)'];
    const rows = sales.map(s => [
      s.id,
      s.sale_date,
      s.sku_id,
      `"${s.product_name.replace(/"/g, '""')}"`,
      s.channel,
      s.quantity,
      s.unit_price.toFixed(2),
      s.total_amount.toFixed(2)
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `launchwise_sales_log_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered sales
  const filteredSales = sales.filter(s => {
    const matchesSearch = !search || s.sku_id.toLowerCase().includes(search.toLowerCase()) || s.product_name.toLowerCase().includes(search.toLowerCase());
    const matchesChannel = selectedChannel === 'All' || s.channel === selectedChannel;
    return matchesSearch && matchesChannel;
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingBag className="w-6 h-6 text-indigo-600" />
            Store Sales & Point of Sale (POS)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track customer sales, record transactions, and automatically synchronize inventory levels across all sales channels.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-sm flex items-center space-x-1.5 transition-colors"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Sales CSV</span>
          </button>

          <button
            onClick={() => setIsRecordModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-semibold shadow-sm shadow-indigo-600/20 flex items-center space-x-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Sale</span>
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

      {/* Sales KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Sales Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${metrics ? metrics.total_revenue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '0.00'}
          </div>
          <div className="text-[11px] text-slate-400">
            All-time cumulative store volume
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Units Sold</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {metrics ? metrics.total_units_sold.toLocaleString() : '0'} <span className="text-xs font-normal text-slate-400">units</span>
          </div>
          <div className="text-[11px] text-slate-400">
            Across {metrics?.total_orders || 0} customer transactions
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Average Order Value</span>
            <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${metrics ? metrics.avg_order_value.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-slate-400">
            Average basket size per receipt
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm space-y-2">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Today's Sales Revenue</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900">
            ${metrics ? metrics.today_revenue.toFixed(2) : '0.00'}
          </div>
          <div className="text-[11px] text-slate-400">
            {metrics?.today_units_sold || 0} units recorded today
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search transactions by SKU or product name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5">
            <span className="text-xs text-slate-500 font-medium">Channel:</span>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value)}
              className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-indigo-500"
            >
              <option value="All">All Channels</option>
              <option value="In-Store POS">In-Store POS</option>
              <option value="Online Storefront">Online Storefront</option>
              <option value="Curbside Pickup">Curbside Pickup</option>
              <option value="B2B Wholesale">B2B Wholesale</option>
            </select>
          </div>

          <button
            onClick={loadData}
            title="Refresh Transactions"
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Sales Transactions Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-semibold text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Order ID</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-4 py-3.5">SKU ID</th>
                <th className="px-5 py-3.5">Product Name</th>
                <th className="px-4 py-3.5 text-center">Channel</th>
                <th className="px-4 py-3.5 text-center">Quantity</th>
                <th className="px-4 py-3.5 text-right">Unit Price</th>
                <th className="px-5 py-3.5 text-right">Total Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span>Loading transactions from store database...</span>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                    <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-semibold text-slate-700">No sales transactions found</p>
                    <p className="text-[11px] text-slate-400">Click "Record New Sale" to process your first order.</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 font-mono text-slate-500 font-semibold">
                      #{String(s.id).padStart(5, '0')}
                    </td>
                    <td className="px-5 py-3 text-slate-700 font-medium">
                      {s.sale_date}
                    </td>
                    <td className="px-4 py-3 font-mono font-bold text-indigo-700">
                      {s.sku_id}
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-900 max-w-xs truncate" title={s.product_name}>
                      {s.product_name}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                        s.channel === 'Online Storefront'
                          ? 'bg-blue-50 text-blue-700 border border-blue-200'
                          : s.channel === 'B2B Wholesale'
                          ? 'bg-purple-50 text-purple-700 border border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}>
                        {s.channel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-900">
                      {s.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-600 font-mono">
                      ${s.unit_price.toFixed(2)}
                    </td>
                    <td className="px-5 py-3 text-right font-bold text-emerald-700 font-mono">
                      ${s.total_amount.toFixed(2)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 bg-slate-50/50">
          <span>Displaying <strong>{filteredSales.length}</strong> sales orders</span>
          <span className="text-[11px] text-slate-400">Inventory automatically adjusted upon transaction creation</span>
        </div>
      </div>

      {/* RECORD SALE MODAL */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-5 h-5 text-indigo-600" />
                Record New Customer Sale
              </h2>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSale} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-semibold text-slate-700">Select Product *</label>
                <select
                  value={saleSku}
                  onChange={(e) => handleProductSelect(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500 font-medium"
                >
                  {products.map((p) => (
                    <option key={p.sku_id} value={p.sku_id}>
                      {p.sku_id} • {p.name} (Stock: {p.stock})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Quantity Sold *</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={saleQty}
                    onChange={(e) => setSaleQty(parseInt(e.target.value) || 1)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Unit Price ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={salePrice}
                    onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Sales Channel</label>
                  <select
                    value={saleChannel}
                    onChange={(e) => setSaleChannel(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="In-Store POS">In-Store POS</option>
                    <option value="Online Storefront">Online Storefront</option>
                    <option value="Curbside Pickup">Curbside Pickup</option>
                    <option value="B2B Wholesale">B2B Wholesale</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-semibold text-slate-700">Sale Date</label>
                  <input
                    type="date"
                    required
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Order Total Preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-slate-500">Total Transaction Amount</span>
                  <p className="text-[10px] text-slate-400">({saleQty} units &times; ${salePrice.toFixed(2)})</p>
                </div>
                <div className="text-xl font-bold text-emerald-600 font-mono">
                  ${(saleQty * salePrice).toFixed(2)}
                </div>
              </div>

              <div className="flex justify-end space-x-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-600 hover:bg-slate-100 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Submit Sale & Deduct Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
