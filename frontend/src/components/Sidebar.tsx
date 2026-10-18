import React from 'react';
import { 
  BarChart3, 
  Package, 
  ShoppingBag, 
  TrendingUp, 
  ShoppingCart, 
  Boxes, 
  FileText, 
  Settings, 
  Sparkles,
  Layers
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  datasetStatus?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onSelectTab, datasetStatus }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3, badge: null },
    { id: 'products', label: 'Products', icon: Package, badge: 'Catalog' },
    { id: 'sales', label: 'Sales', icon: ShoppingBag, badge: 'POS' },
    { id: 'forecasting', label: 'Demand Forecast', icon: TrendingUp, badge: '8-Wk' },
    { id: 'purchasing', label: 'Purchase Planning', icon: ShoppingCart, badge: 'Q*' },
    { id: 'inventory', label: 'Inventory', icon: Boxes, badge: 'Live' },
    { id: 'reports', label: 'Reports', icon: FileText, badge: 'WAPE' },
    { id: 'settings', label: 'Settings', icon: Settings, badge: null }
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 text-slate-300">
      {/* Brand Header */}
      <div>
        <div className="p-5 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <h1 className="font-bold text-white tracking-wide text-sm flex items-center gap-1.5">
              LaunchWise <span className="text-cyan-400 text-xs font-mono font-semibold px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30">AI</span>
            </h1>
            <p className="text-[11px] text-slate-400">Demand & Purchasing Intelligence</p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="p-3 space-y-1">
          <div className="px-3 pt-2 pb-1 text-[10px] font-semibold tracking-wider uppercase text-slate-400">
            Shop Operations & Planning
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-600/20 text-white font-semibold shadow-sm border border-indigo-500/30 border-l-4 border-l-cyan-400'
                    : 'text-slate-400 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                    isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System Status Card */}
      <div className="p-4 border-t border-slate-800">
        <div className="bg-slate-950/80 rounded-xl p-3 border border-slate-800/80 text-[11px] space-y-1">
          <div className="flex items-center justify-between text-slate-300 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected Store
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Nordic #104</span>
          </div>
          <p className="text-slate-400 text-[10px] leading-relaxed">
            {datasetStatus || '150 SKUs • AI Engine Online'}
          </p>
        </div>
      </div>
    </aside>
  );
};
