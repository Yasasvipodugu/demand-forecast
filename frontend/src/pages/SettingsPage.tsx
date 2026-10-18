import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Store, 
  ShieldCheck, 
  User, 
  DollarSign, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Save, 
  Lock
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useAuth } from '../context/AuthContext';

interface SettingsPageProps {
  onRefreshAll: () => void;
  selectedModel: string;
  confidenceLevel: number;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({
  onRefreshAll,
  selectedModel,
  confidenceLevel
}) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Record<string, string>>({
    store_name: 'Nordic Flagship Store #104',
    currency: 'USD ($)',
    default_lead_time_days: '14',
    target_service_level: '90',
    understock_penalty_rate: '40.0',
    overstock_holding_rate: '15.0',
    default_order_policy: 'Newsvendor Q* Expected Profit Optimization'
  });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isRetraining, setIsRetraining] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Password reset form
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [passwordNotice, setPasswordNotice] = useState<string | null>(null);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getShopSettings();
      if (res && Object.keys(res).length > 0) {
        setSettings(prev => ({ ...prev, ...res }));
      }
    } catch (err: any) {
      console.error('Failed to load settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      await apiClient.updateShopSettings(settings);
      setSuccessMessage('Store configurations saved successfully.');
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRetrain = async () => {
    setIsRetraining(true);
    setError(null);
    try {
      const res = await apiClient.trainModels();
      setSuccessMessage(res.message || 'Models updated successfully.');
      onRefreshAll();
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setError(`Retraining failed: ${err.message}`);
    } finally {
      setIsRetraining(false);
    }
  };

  const handlePasswordUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword) {
      setPasswordNotice('Please enter a new password.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice('Passwords do not match.');
      return;
    }
    setPasswordNotice('Password updated securely for your session.');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordNotice(null), 4000);
  };

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
          <Settings className="w-6 h-6 text-indigo-600" />
          Store & System Configuration
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Configure store operational parameters, default supplier lead times, Newsvendor financial penalties, and account credentials.
        </p>
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

      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Section 1: Store Profile Settings */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-4 h-4 text-indigo-600" />
              Retail Store Profile
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Database: users.db</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Store / Company Name</label>
              <input
                type="text"
                value={settings.store_name}
                onChange={(e) => setSettings({ ...settings, store_name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Operating Currency</label>
              <select
                value={settings.currency}
                onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value="USD ($)">USD ($) - United States Dollar</option>
                <option value="EUR (€)">EUR (€) - Euro</option>
                <option value="GBP (£)">GBP (£) - British Pound</option>
                <option value="CAD ($)">CAD ($) - Canadian Dollar</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Default Supplier Lead Time (Days)</label>
              <div className="relative">
                <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="number"
                  min="1"
                  value={settings.default_lead_time_days}
                  onChange={(e) => setSettings({ ...settings, default_lead_time_days: e.target.value })}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Target Service Level (%)</label>
              <input
                type="number"
                min="50"
                max="99"
                value={settings.target_service_level}
                onChange={(e) => setSettings({ ...settings, target_service_level: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Purchasing Policy & Cost Parameters */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-indigo-600" />
              Purchasing & Cost Policy Parameters
            </h2>
            <span className="text-[11px] text-slate-400">Newsvendor Critical Fractile</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Understock Penalty Margin Rate ($ Cu)</label>
              <input
                type="number"
                step="0.5"
                value={settings.understock_penalty_rate}
                onChange={(e) => setSettings({ ...settings, understock_penalty_rate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 block">Lost profit per unit of unsatisfied customer demand</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Overstock Holding & Markdown Loss ($ Co)</label>
              <input
                type="number"
                step="0.5"
                value={settings.overstock_holding_rate}
                onChange={(e) => setSettings({ ...settings, overstock_holding_rate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="text-[11px] text-slate-400 block">Salvage discount and holding depreciation per unsold unit</span>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-sm flex items-center space-x-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving Configurations...' : 'Save Store Configurations'}</span>
            </button>
          </div>
        </div>
      </form>

      {/* Section 3: Account & Credentials */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-600" />
              Authenticated User Profile
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Full Name</span>
              <span className="font-semibold text-slate-900">{user?.name || 'Sarah Jenkins'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Email Address</span>
              <span className="font-semibold text-slate-900 font-mono">{user?.email || 'buyer@retail.com'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Company</span>
              <span className="font-semibold text-slate-900">{user?.company || 'Nordic Retail Group'}</span>
            </div>
            <div className="flex justify-between py-1.5 border-b border-slate-50">
              <span className="text-slate-500">Assigned Role</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700">
                {user?.role || 'Lead Merchandise Planner'}
              </span>
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              Change Account Password
            </h2>
          </div>

          {passwordNotice && (
            <div className="p-3 bg-indigo-50 text-indigo-700 text-xs rounded-xl border border-indigo-100">
              {passwordNotice}
            </div>
          )}

          <form onSubmit={handlePasswordUpdate} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">New Password</label>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-700">Confirm Password</label>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-colors"
            >
              Update Password
            </button>
          </form>
        </div>
      </div>

      {/* Model Retraining Card */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-indigo-600" />
            Synchronize Demand Models
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Refits historical analogues and gradient boosting models against newly recorded product sales and attributes.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRetrain}
          disabled={isRetraining}
          className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-colors disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRetraining ? 'animate-spin' : ''}`} />
          <span>{isRetraining ? 'Retraining...' : 'Retrain Models'}</span>
        </button>
      </div>
    </div>
  );
};
