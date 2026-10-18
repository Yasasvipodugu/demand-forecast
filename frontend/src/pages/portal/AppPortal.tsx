import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { DashboardPage } from '../DashboardPage';
import { ProductsPage } from '../ProductsPage';
import { SalesPage } from '../SalesPage';
import { ForecastPage } from '../ForecastPage';
import { PurchasePlanningPage } from '../PurchasePlanningPage';
import { InventoryPage } from '../InventoryPage';
import { ReportsPage } from '../ReportsPage';
import { SettingsPage } from '../SettingsPage';
import type { SKUForecast, EvaluationResults, LeastConfidentSKU } from '../../types';
import { apiClient } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { CsvImportModal } from '../../components/CsvImportModal';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface AppPortalProps {
  onNavigateHome: () => void;
}

export const AppPortal: React.FC<AppPortalProps> = ({ onNavigateHome }) => {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [forecasts, setForecasts] = useState<SKUForecast[]>([]);
  const [evaluation, setEvaluation] = useState<EvaluationResults | null>(null);
  const [riskSkus, setRiskSkus] = useState<LeastConfidentSKU[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');
  const [confidenceLevel, setConfidenceLevel] = useState<number>(0.80);
  const [selectedSkuForExplain, setSelectedSkuForExplain] = useState<string | undefined>(undefined);
  
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const loadAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Forecasts
      const fRes = await apiClient.getForecasts();
      setForecasts(fRes.forecasts || []);
      setSelectedModel(fRes.selected_model || 'ensemble');
      setConfidenceLevel(fRes.confidence_level || 0.80);

      // 2. Evaluation Results
      const eRes = await apiClient.getEvaluationResults();
      setEvaluation(eRes);

      // 3. Risk SKUs
      const rRes = await apiClient.getLeastConfidentSkus(10);
      setRiskSkus(rRes.least_confident_skus || []);
    } catch (err: any) {
      console.error('Initial data load error:', err);
      setError('Unable to communicate with the LaunchWise AI backend (http://127.0.0.1:8000). Ensure the backend service is running.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleRunForecasts = async (model: string, conf: number) => {
    setIsRefreshing(true);
    try {
      await apiClient.runForecasts(model, conf);
      await loadAllData();
    } catch (err: any) {
      alert(`Forecast run failed: ${err.message}`);
      setIsRefreshing(false);
    }
  };

  const handleSelectSkuForExplain = (skuId: string) => {
    setSelectedSkuForExplain(skuId);
    setActiveTab('forecasting');
  };

  const handleLogout = () => {
    logout();
    onNavigateHome();
  };

  // Breadcrumbs & Titles for 8 Main Pages
  const tabTitles: Record<string, { title: string; breadcrumb: string }> = {
    dashboard: { title: 'Executive Merchandising Dashboard', breadcrumb: 'Dashboard' },
    products: { title: 'Product Catalog & SKU Management', breadcrumb: 'Products' },
    sales: { title: 'Point of Sale (POS) & Store Sales', breadcrumb: 'Sales' },
    forecasting: { title: '8-Week Cold-Start Demand Forecast', breadcrumb: 'Demand Forecast' },
    purchasing: { title: 'Purchase Planning & Order Optimization (Q*)', breadcrumb: 'Purchase Planning' },
    inventory: { title: 'Live Inventory Levels & Movement Audit', breadcrumb: 'Inventory' },
    reports: { title: 'Executive Reports & Model Verification', breadcrumb: 'Reports' },
    settings: { title: 'Store Settings & System Configurations', breadcrumb: 'Settings' }
  };

  const currentMeta = tabTitles[activeTab] || tabTitles.dashboard;

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-900 overflow-hidden">
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
        }}
        datasetStatus="150 Cold-Start SKUs • AI Ready"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          pageTitle={currentMeta.title}
          breadcrumb={currentMeta.breadcrumb}
          selectedModel={selectedModel}
          confidenceLevel={confidenceLevel}
          user={user}
          onRefresh={loadAllData}
          onOpenImport={() => setIsImportModalOpen(true)}
          onLogout={handleLogout}
          onNavigateHome={() => setActiveTab('dashboard')}
          isRefreshing={isRefreshing}
        />

        {/* CSV Ingestion & Column Mapping Modal */}
        <CsvImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={loadAllData}
        />

        {/* Dynamic Body Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50">
          {error && (
            <div className="m-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start justify-between shadow-xs">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm">Connection Warning</h4>
                  <p className="text-xs text-rose-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={loadAllData}
                className="px-3 py-1 bg-white border border-rose-300 text-rose-700 rounded-lg text-xs font-semibold hover:bg-rose-50 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
              <div className="text-center">
                <p className="text-sm font-semibold text-slate-800">Synchronizing LaunchWise AI...</p>
                <p className="text-xs text-slate-400 mt-1">Calibrating cold-start launch models, store inventory & sales databases</p>
              </div>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <DashboardPage
                  forecasts={forecasts}
                  evaluation={evaluation}
                  riskSkus={riskSkus}
                  onNavigateTab={(tab) => setActiveTab(tab)}
                  isLoading={isLoading}
                />
              )}

              {activeTab === 'products' && (
                <ProductsPage />
              )}

              {activeTab === 'sales' && (
                <SalesPage />
              )}

              {activeTab === 'forecasting' && (
                <ForecastPage
                  forecasts={forecasts}
                  selectedModel={selectedModel}
                  confidenceLevel={confidenceLevel}
                  onRunForecasts={handleRunForecasts}
                  onSelectSkuForExplain={handleSelectSkuForExplain}
                  isProcessing={isRefreshing}
                />
              )}

              {activeTab === 'purchasing' && (
                <PurchasePlanningPage
                  forecasts={forecasts}
                />
              )}

              {activeTab === 'inventory' && (
                <InventoryPage
                  forecasts={forecasts}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsPage
                  evaluation={evaluation}
                  riskSkus={riskSkus}
                  onSelectSkuForExplain={handleSelectSkuForExplain}
                />
              )}

              {activeTab === 'settings' && (
                <SettingsPage
                  onRefreshAll={loadAllData}
                  selectedModel={selectedModel}
                  confidenceLevel={confidenceLevel}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
};
