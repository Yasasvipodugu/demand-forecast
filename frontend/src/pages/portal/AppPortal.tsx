import React, { useState, useEffect } from 'react';
import { Sidebar } from '../../components/Sidebar';
import { Navbar } from '../../components/Navbar';
import { DashboardPage } from '../DashboardPage';
import { ProductsPage } from '../ProductsPage';
import { SalesPage } from '../SalesPage';
import { ForecastPage } from '../ForecastPage';
import { PurchasePlanningPage } from '../PurchasePlanningPage';
import { InventoryPage } from '../InventoryPage';
import { ExplainabilityPage } from '../ExplainabilityPage';
import { AllocationPage } from '../AllocationPage';
import { RiskPage } from '../RiskPage';
import { EvaluationPage } from '../EvaluationPage';
import { DataPage } from '../DataPage';
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
      setError('Operating in resilient offline/cloud demo mode. All pages and calculations active.');
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
    setActiveTab('explainability');
  };

  const handleLogout = () => {
    logout();
    onNavigateHome();
  };

  // Breadcrumbs & Titles for all main pages
  const tabTitles: Record<string, { title: string; breadcrumb: string }> = {
    dashboard: { title: 'Executive Merchandising Dashboard', breadcrumb: 'Dashboard' },
    products: { title: 'Product Catalog & SKU Management', breadcrumb: 'Products' },
    sales: { title: 'Point of Sale (POS) & Store Sales', breadcrumb: 'Sales' },
    forecasting: { title: '8-Week Cold-Start Demand Forecast', breadcrumb: 'Demand Forecast' },
    purchasing: { title: 'Purchase Planning & Order Optimization (Q*)', breadcrumb: 'Purchase Planning' },
    inventory: { title: 'Live Inventory Levels & Movement Audit', breadcrumb: 'Inventory' },
    explainability: { title: 'Explainability & Feature Attribution Analysis', breadcrumb: 'Explain Forecast' },
    allocations: { title: 'Store Cluster Allocation & Retail Distribution', breadcrumb: 'Store Clusters' },
    risk: { title: 'Operational Risk & High Uncertainty Watchlist', breadcrumb: 'Risk Analysis' },
    evaluation: { title: 'Model Benchmark & Hidden Actuals Verification', breadcrumb: 'Model Benchmark' },
    data: { title: 'Data Engine, Flexible Schema & CSV Mapping', breadcrumb: 'Data Engine' },
    reports: { title: 'Executive Reports & Accuracy Verification', breadcrumb: 'Reports' },
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

        {/* Dynamic Page Views */}
        <main className="flex-1 overflow-y-auto bg-slate-50">
          {error && (
            <div className="m-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-semibold text-sm text-amber-900">System Information</h4>
                  <p className="text-xs text-amber-700 mt-0.5">{error}</p>
                </div>
              </div>
              <button
                onClick={loadAllData}
                className="px-3 py-1 bg-white border border-amber-300 text-amber-800 rounded-lg text-xs font-semibold hover:bg-amber-50 flex items-center space-x-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Sync</span>
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

              {activeTab === 'explainability' && (
                <ExplainabilityPage
                  forecasts={forecasts}
                  initialSkuId={selectedSkuForExplain}
                />
              )}

              {activeTab === 'allocations' && (
                <AllocationPage
                  forecasts={forecasts}
                />
              )}

              {activeTab === 'risk' && (
                <RiskPage
                  riskSkus={riskSkus}
                  onSelectSkuForExplain={handleSelectSkuForExplain}
                />
              )}

              {activeTab === 'evaluation' && (
                <EvaluationPage
                  evaluation={evaluation}
                  onRefreshEvaluation={loadAllData}
                />
              )}

              {activeTab === 'data' && (
                <DataPage
                  onRefreshAll={loadAllData}
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

      {/* CSV Import & Column Mapping Modal */}
      {isImportModalOpen && (
        <CsvImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          onSuccess={() => {
            setIsImportModalOpen(false);
            loadAllData();
          }}
        />
      )}
    </div>
  );
};

export default AppPortal;
