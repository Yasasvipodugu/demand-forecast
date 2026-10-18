import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  RefreshCw, 
  Download, 
  UploadCloud, 
  Database, 
  LogOut, 
  ExternalLink, 
  ChevronDown, 
  User as UserIcon,
  FileSpreadsheet,
  Check
} from 'lucide-react';
import type { User } from '../types';
import { apiClient } from '../api/client';

interface NavbarProps {
  pageTitle: string;
  breadcrumb: string;
  selectedModel: string;
  confidenceLevel: number;
  user?: User | null;
  onRefresh?: () => void;
  onOpenImport?: () => void;
  onLogout?: () => void;
  onNavigateHome?: () => void;
  isRefreshing?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  pageTitle,
  breadcrumb,
  selectedModel,
  confidenceLevel,
  user,
  onRefresh,
  onOpenImport,
  onLogout,
  onNavigateHome,
  isRefreshing
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Ensure professional retail buyer persona
  const rawName = user?.name || '';
  const isYasasvi = rawName.toLowerCase().includes('yasasvi');
  const buyerName = (!rawName || isYasasvi) ? 'Sarah Jenkins' : rawName;
  const buyerRole = (isYasasvi || !user?.role) ? 'Lead Merchandise Planner' : user.role;
  const buyerEmail = (isYasasvi || !user?.email) ? 'buyer@retail.com' : user.email;
  const buyerCompany = (isYasasvi || !user?.company) ? 'Nordic Retail Group' : user.company;
  
  const initials = buyerName
    .split(' ')
    .filter(Boolean)
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'SJ';

  // Direct, reliable browser CSV download using Blob
  const handleDownloadFile = async (url: string, filename: string) => {
    setIsExporting(true);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const objectUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objectUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      console.error('Download error:', err);
      // Fallback direct navigation
      window.location.href = url;
    } finally {
      setIsExporting(false);
      setExportMenuOpen(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 sm:px-8 flex items-center justify-between sticky top-0 z-30 shadow-xs">
      {/* Title & Breadcrumbs */}
      <div>
        <div className="flex items-center space-x-2 text-[11px] font-medium text-slate-400">
          <button 
            onClick={onNavigateHome} 
            className="hover:text-indigo-600 transition-colors flex items-center space-x-1"
          >
            <span>LaunchWise AI</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </button>
          <span>/</span>
          <span className="text-slate-600 font-semibold">{breadcrumb}</span>
        </div>
        <h2 className="text-base font-bold text-slate-800 tracking-tight">{pageTitle}</h2>
      </div>

      {/* Right Controls */}
      <div className="flex items-center space-x-3">
        {/* Refresh Pipeline Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isRefreshing}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
            title="Refresh pipeline data"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
          </button>
        )}

        {/* Import CSV Button */}
        {onOpenImport && (
          <button
            onClick={onOpenImport}
            className="hidden sm:flex items-center space-x-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-xs"
            title="Import and map CSV dataset"
          >
            <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
            <span>Import CSV</span>
          </button>
        )}

        {/* Export CSV Dropdown */}
        <div className="relative" ref={exportMenuRef}>
          <div className="hidden sm:flex items-center rounded-xl bg-slate-100 border border-slate-200 overflow-hidden shadow-xs">
            <button
              onClick={() => handleDownloadFile(apiClient.getExportForecastsUrl(), 'launchwise_forecasts_8w.csv')}
              disabled={isExporting}
              className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors"
              title="Download 8-Week Demand Forecasts CSV"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? 'animate-bounce text-indigo-600' : 'text-slate-500'}`} />
              <span>{isExporting ? 'Downloading...' : 'Export CSV'}</span>
            </button>
            <button
              onClick={() => setExportMenuOpen(!exportMenuOpen)}
              className="px-1.5 py-1.5 border-l border-slate-200 hover:bg-slate-200 text-slate-500 transition-colors"
              title="More CSV export formats"
            >
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>

          {exportMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-fade-in">
              <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 tracking-wider border-b border-slate-100">
                Choose CSV Export
              </div>
              <button
                onClick={() => handleDownloadFile(apiClient.getExportForecastsUrl(), 'launchwise_forecasts_8w.csv')}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-600" />
                  <span>8-Week Demand Forecasts</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">.csv</span>
              </button>
              <button
                onClick={() => handleDownloadFile(apiClient.getExportPurchaseOrdersUrl(), 'launchwise_purchase_orders.csv')}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Purchase Orders (Q*)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">.csv</span>
              </button>
              <button
                onClick={() => handleDownloadFile(apiClient.getExportAllocationsUrl(), 'launchwise_cluster_allocations.csv')}
                className="w-full text-left px-3.5 py-2 hover:bg-slate-50 text-slate-800 flex items-center justify-between"
              >
                <div className="flex items-center space-x-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-purple-600" />
                  <span>Store Cluster Allocations</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">.csv</span>
              </button>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative pl-2 border-l border-slate-200" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2.5 p-1 rounded-xl hover:bg-slate-50 transition-colors focus:outline-none"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-900 to-indigo-900 text-cyan-300 flex items-center justify-center font-bold text-xs ring-2 ring-indigo-500/20 shadow-xs">
              {initials}
            </div>
            <div className="hidden xl:block text-left text-xs leading-tight">
              <p className="font-semibold text-slate-800">{buyerName}</p>
              <p className="text-[10px] text-slate-500">{buyerRole}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 text-xs animate-fade-in">
              <div className="px-3.5 py-2.5 border-b border-slate-100">
                <p className="font-semibold text-slate-800">{buyerName}</p>
                <p className="text-slate-400 text-[11px] truncate">{buyerEmail}</p>
                <p className="text-indigo-600 font-medium text-[10px] mt-0.5">{buyerCompany}</p>
              </div>

              {onLogout && (
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    onLogout();
                  }}
                  className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-600 font-medium flex items-center space-x-2"
                >
                  <LogOut className="w-3.5 h-3.5 text-rose-500" />
                  <span>Sign Out</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
