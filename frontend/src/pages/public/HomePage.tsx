import React, { useState } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  ShieldCheck, 
  Sliders, 
  Compass, 
  AlertTriangle, 
  ArrowRight, 
  ChevronRight, 
  CheckCircle2, 
  BarChart3, 
  Package, 
  Store, 
  LogIn, 
  Layers,
  Zap,
  HelpCircle,
  Activity,
  Award
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface HomePageProps {
  onNavigateLogin: () => void;
  onNavigateRegister: () => void;
  onQuickDemo: () => void;
}

const SAMPLE_CURVE_DATA = [
  { week: 'W1', demand: 42, lower: 30, upper: 55, analogue: 38 },
  { week: 'W2', demand: 68, lower: 52, upper: 86, analogue: 61 },
  { week: 'W3', demand: 95, lower: 75, upper: 118, analogue: 88 },
  { week: 'W4', demand: 110, lower: 88, upper: 135, analogue: 104 },
  { week: 'W5', demand: 85, lower: 68, upper: 105, analogue: 82 },
  { week: 'W6', demand: 58, lower: 44, upper: 74, analogue: 55 },
  { week: 'W7', demand: 45, lower: 32, upper: 60, analogue: 41 },
  { week: 'W8', demand: 27, lower: 18, upper: 38, analogue: 25 },
];

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateLogin,
  onNavigateRegister,
  onQuickDemo
}) => {
  const [activeTab, setActiveTab] = useState<'curve' | 'newsvendor' | 'analogues'>('curve');
  
  // Interactive Newsvendor mini-simulator state
  const [unitPrice, setUnitPrice] = useState<number>(68);
  const [unitCost, setUnitCost] = useState<number>(24);
  const [salvageValue, setSalvageValue] = useState<number>(8);

  const Cu = Math.max(1, unitPrice - unitCost);
  const Co = Math.max(1, unitCost - salvageValue);
  const criticalFractile = Cu / (Cu + Co);
  const baseDemand = 530;
  const demandStd = 70;
  // Approx normal inverse
  const zScore = criticalFractile >= 0.5 
    ? Math.min(2.5, Math.sqrt(2) * Math.sqrt(Math.max(0, -Math.log(1 - criticalFractile))))
    : -Math.min(2.5, Math.sqrt(2) * Math.sqrt(Math.max(0, -Math.log(criticalFractile))));
  const recommendedQ = Math.round(baseDemand + (zScore * demandStd));
  const safetyStock = recommendedQ - baseDemand;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* 1. Refined Navigation Bar */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
                  LaunchWise<span className="text-cyan-400">.ai</span>
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  New Product AI
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">Predict demand. Plan purchases. Manage inventory smarter.</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-cyan-400 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-cyan-400 transition-colors">How It Works</a>
            <a href="#preview" className="hover:text-cyan-400 transition-colors">Interactive Preview</a>
            <a href="#about" className="hover:text-cyan-400 transition-colors">Why LaunchWise</a>
          </nav>

          <div className="flex items-center space-x-3">
            <button
              onClick={onNavigateLogin}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-900 rounded-lg transition-colors flex items-center space-x-1.5"
            >
              <LogIn className="w-4 h-4 text-slate-400" />
              <span>Sign In</span>
            </button>
            <button
              onClick={onNavigateRegister}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md hover:shadow-cyan-500/20 hover:opacity-95 transition-all flex items-center space-x-1.5"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28 border-b border-slate-900">
        {/* Glow ambient backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-indigo-600/15 via-cyan-500/10 to-transparent blur-3xl pointer-events-none -z-10 rounded-full" />
        <div className="absolute -top-24 left-1/4 w-96 h-96 bg-purple-600/10 blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-950/80 to-slate-900/80 border border-indigo-500/30 text-indigo-300 text-xs font-semibold shadow-inner">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>Next-Gen Merchandising Intelligence for Zero-History Launches</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
              Predict Demand Before Your Product{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
                Hits the Shelves.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-2xl mx-auto">
              Turn product attributes and historical launch patterns into intelligent demand forecasts, smarter inventory decisions, and greater confidence in every new launch.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={onNavigateRegister}
                className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-cyan-500 text-white font-semibold text-base shadow-xl shadow-indigo-500/25 hover:shadow-cyan-500/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <span>Get Started Free</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              
              <button
                onClick={onQuickDemo}
                className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800/90 text-slate-200 border border-slate-700 font-semibold text-base transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>1-Click Buyer Demo Login</span>
              </button>
            </div>

            <div className="flex items-center justify-center space-x-6 pt-4 text-xs text-slate-400">
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Gower Mixed-Attribute Matching</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Calibrated Conformal Bounds</span>
              </div>
              <div className="flex items-center space-x-1.5 hidden sm:flex">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Newsvendor Margin Optimization</span>
              </div>
            </div>
          </div>

          {/* Hero Product Visual Display */}
          <div className="mt-14 relative max-w-5xl mx-auto">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/90 shadow-2xl shadow-indigo-950/50 backdrop-blur-xl overflow-hidden">
              {/* Fake Browser / App Header */}
              <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
                  <span className="text-xs font-mono text-slate-400 ml-2">launchwise.ai/app/forecasting &bull; SKU-2024-C921</span>
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="font-medium text-emerald-400">Ensemble Forecast Validated</span>
                </div>
              </div>

              {/* Product Visual Content */}
              <div className="p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center space-x-2">
                        <span>Merino Wool Travel Overshirt</span>
                        <span className="text-xs px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-medium">New SKU &bull; Cold Start</span>
                      </h3>
                      <p className="text-xs text-slate-400">8-Week Projected Trajectory with 80% Calibrated Conformal Intervals</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-slate-400 font-medium">Total 8W Expected Demand</div>
                      <div className="text-xl font-black text-cyan-400">530 units</div>
                    </div>
                  </div>

                  <div className="h-64 w-full bg-slate-950/50 rounded-xl p-3 border border-slate-800/80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={SAMPLE_CURVE_DATA}>
                        <defs>
                          <linearGradient id="heroGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.35}/>
                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="bandGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.20}/>
                            <stop offset="95%" stopColor="#6366f1" stopOpacity={0.05}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.4} />
                        <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff' }}
                        />
                        <Area type="monotone" dataKey="upper" stroke="#818cf8" strokeDasharray="4 4" fill="url(#bandGradient)" name="80% Upper Bound" />
                        <Area type="monotone" dataKey="demand" stroke="#38bdf8" strokeWidth={3} fill="url(#heroGradient)" name="Ensemble Forecast" />
                        <Area type="monotone" dataKey="lower" stroke="#818cf8" strokeDasharray="4 4" fill="none" name="80% Lower Bound" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right side live stats */}
                <div className="space-y-4 flex flex-col justify-between bg-slate-950/70 p-5 rounded-xl border border-slate-800/80">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Launch Season</span>
                      <span className="font-semibold text-slate-200">Fall / Winter &bull; October</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Analogue Twin</span>
                      <span className="font-semibold text-cyan-400">Alpaca Blend Chore Jacket (92%)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Critical Fractile</span>
                      <span className="font-semibold text-emerald-400">73.3% (Cu = $44, Co = $16)</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Optimal Order (Q*)</span>
                      <span className="font-bold text-white text-sm">576 units</span>
                    </div>
                    <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                      <span className="text-slate-400">Calculated Safety Stock</span>
                      <span className="font-semibold text-indigo-400">+46 units buffer</span>
                    </div>
                  </div>

                  <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-lg p-3 text-xs text-indigo-300 flex items-start space-x-2">
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      Conformal coverage validation confirmed 80.2% empirical capture with zero training leakage.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Core Features Section (5 Cards) */}
      <section id="features" className="py-20 bg-slate-900/40 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Engineered for Retail Merchandisers</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              End-to-End Cold-Start Intelligence
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Five purpose-built capabilities that replace gut feeling with reproducible, explainable forecasting science.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-5 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all">
                <TrendingUp className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">AI-Powered Multi-Model Forecasting</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Combines Gower mixed-attribute nearest analogues with multi-output Random Forest and HistGradientBoosting ensembles to synthesize full 8-week launch trajectories.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">
                <span>Weighted Average Ensemble</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Feature 2 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 mb-5 group-hover:bg-cyan-500/20 group-hover:scale-105 transition-all">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Uncertainty-Aware Predictions</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Replaces risky point forecasts with split-conformal calibrated prediction intervals (80% & 90%). Know exactly how wide your volatility band is before committing capital.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center text-xs font-semibold text-cyan-400 group-hover:text-cyan-300">
                <span>Conformal Calibration (PICP)</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Feature 3 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-emerald-500/40 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-5 group-hover:bg-emerald-500/20 group-hover:scale-105 transition-all">
                <Sliders className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Smart Inventory & Safety Stock</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Applies the classic Newsvendor model Q* = F⁻¹(Cu / (Cu + Co)) to balance the margin cost of lost sales against the markdown loss of excess stock.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">
                <span>Cost-Optimal Purchase Quantities</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Feature 4 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-purple-500/40 transition-all hover:-translate-y-1 group">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-5 group-hover:bg-purple-500/20 group-hover:scale-105 transition-all">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Explainable AI & Twin Match</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Every prediction explains its logic: inspect the top 5 historical analogues with categorical match scores, plus positive and negative demand drivers in plain retail language.
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center text-xs font-semibold text-purple-400 group-hover:text-purple-300">
                <span>Gower Similarity & Driver XAI</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>

            {/* Feature 5 */}
            <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all hover:-translate-y-1 group lg:col-span-2">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-5 group-hover:bg-amber-500/20 group-hover:scale-105 transition-all">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2">Launch Risk Diagnostics & Prescriptions</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Automatically identifies and ranks the Top 10 least-confident SKUs with high model divergence, sparse historical analogues, or wide prediction intervals, paired with concrete buyer action plans (e.g. Test & React pilot buys, vendor markdown agreements).
              </p>
              <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center text-xs font-semibold text-amber-400 group-hover:text-amber-300">
                <span>Top 10 Risk Radar & Buyer Directives</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. How It Works Section (3-Step Visual Workflow) */}
      <section id="how-it-works" className="py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">The 3-Step Cold-Start Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              From Product Conception to Purchase Orders
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              A frictionless workflow that integrates seamlessly with your retail merchandising calendar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Step 1 */}
            <div className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 font-extrabold flex items-center justify-center text-lg mb-4 border border-indigo-500/30">
                  1
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Connect New SKU Attributes</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Provide core product attributes: category, subcategory, brand tier, fabric/material, planned retail price, unit cost, and scheduled launch month.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center space-x-1.5">
                <Package className="w-4 h-4 text-indigo-400" />
                <span>Zero sales history required</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-400 font-extrabold flex items-center justify-center text-lg mb-4 border border-cyan-500/30">
                  2
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Generate Conformal Trajectories</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  Our hybrid ensemble mines past launch patterns, identifies nearest historical twins, and synthesizes an 8-week launch curve with 80% and 90% confidence bands.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center space-x-1.5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span>Calibrated coverage guarantees</span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
              <div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 font-extrabold flex items-center justify-center text-lg mb-4 border border-emerald-500/30">
                  3
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Optimize Orders & Allocation</h3>
                <p className="text-sm text-slate-400 leading-relaxed">
                  The Newsvendor engine calculates the exact cost-optimal buy ($Q^*$), required safety stock, and distributes inventory across store clusters using Hamilton-Hare allocation.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-800/80 text-xs text-slate-400 flex items-center space-x-1.5">
                <Store className="w-4 h-4 text-emerald-400" />
                <span>Exact integer store distribution</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Interactive Product Preview Section */}
      <section id="preview" className="py-20 bg-slate-900/30 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">Live Interactive Preview</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              Experience the Intelligence Engine
            </h2>
            <p className="text-slate-400 text-sm sm:text-base">
              Test drive our forecasting curves, Newsvendor profit-optimization slider, and analogue matching right in your browser.
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="flex justify-center">
            <div className="p-1 rounded-xl bg-slate-900 border border-slate-800 inline-flex space-x-2">
              <button
                onClick={() => setActiveTab('curve')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                  activeTab === 'curve' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>Forecast Trajectory</span>
              </button>
              <button
                onClick={() => setActiveTab('newsvendor')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                  activeTab === 'newsvendor' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-4 h-4" />
                <span>Newsvendor Calculator</span>
              </button>
              <button
                onClick={() => setActiveTab('analogues')}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all flex items-center space-x-2 ${
                  activeTab === 'analogues' 
                    ? 'bg-indigo-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Analogue Matching</span>
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="bg-slate-900/90 rounded-2xl border border-slate-800 p-6 sm:p-8 max-w-4xl mx-auto shadow-2xl">
            {activeTab === 'curve' && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div>
                    <h4 className="text-lg font-bold text-white">SKU-2024-C921 &bull; Cashmere Blend Cardigan</h4>
                    <p className="text-xs text-slate-400">Category: Apparel | Brand Tier: Premium | Launch: October</p>
                  </div>
                  <div className="flex items-center space-x-4 text-xs">
                    <div>
                      <span className="text-slate-400 block">Expected 8W Demand</span>
                      <span className="text-base font-bold text-cyan-400">530 units</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Interval Width</span>
                      <span className="text-base font-bold text-indigo-400">&plusmn; 23.4%</span>
                    </div>
                  </div>
                </div>

                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={SAMPLE_CURVE_DATA}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="week" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                      <Legend />
                      <Area type="monotone" dataKey="upper" stroke="#818cf8" strokeDasharray="3 3" fill="#6366f1" fillOpacity={0.15} name="80% Upper Bound" />
                      <Area type="monotone" dataKey="demand" stroke="#38bdf8" strokeWidth={3} fill="#38bdf8" fillOpacity={0.25} name="Ensemble Forecast" />
                      <Area type="monotone" dataKey="lower" stroke="#818cf8" strokeDasharray="3 3" fill="none" name="80% Lower Bound" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {activeTab === 'newsvendor' && (
              <div className="space-y-6">
                <div className="pb-4 border-b border-slate-800">
                  <h4 className="text-lg font-bold text-white">Live Newsvendor Optimization Simulator</h4>
                  <p className="text-xs text-slate-400">
                    Adjust price and cost parameters to see how Critical Fractile and recommended buy quantity adapt in real time.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex justify-between">
                      <span>Retail Unit Price ($)</span>
                      <span className="text-cyan-400">${unitPrice}</span>
                    </label>
                    <input
                      type="range"
                      min="30"
                      max="150"
                      value={unitPrice}
                      onChange={(e) => setUnitPrice(Number(e.target.value))}
                      className="w-full accent-cyan-400 bg-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex justify-between">
                      <span>Unit Cost ($)</span>
                      <span className="text-cyan-400">${unitCost}</span>
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="80"
                      value={unitCost}
                      onChange={(e) => setUnitCost(Math.min(unitPrice - 2, Number(e.target.value)))}
                      className="w-full accent-cyan-400 bg-slate-800"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300 flex justify-between">
                      <span>Salvage Value ($)</span>
                      <span className="text-cyan-400">${salvageValue}</span>
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="30"
                      value={salvageValue}
                      onChange={(e) => setSalvageValue(Math.min(unitCost - 2, Number(e.target.value)))}
                      className="w-full accent-cyan-400 bg-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-xs text-slate-400 block">Understock Cost (Cu)</span>
                    <span className="text-xl font-bold text-white">${Cu}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-xs text-slate-400 block">Overstock Cost (Co)</span>
                    <span className="text-xl font-bold text-white">${Co}</span>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
                    <span className="text-xs text-slate-400 block">Critical Fractile</span>
                    <span className="text-xl font-bold text-emerald-400">{(criticalFractile * 100).toFixed(1)}%</span>
                  </div>
                  <div className="p-4 rounded-xl bg-indigo-950/50 border border-indigo-500/30">
                    <span className="text-xs text-indigo-300 block">Optimal Buy (Q*)</span>
                    <span className="text-xl font-bold text-cyan-300">{recommendedQ} units</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'analogues' && (
              <div className="space-y-4">
                <div className="pb-3 border-b border-slate-800">
                  <h4 className="text-lg font-bold text-white">Top Historical Analogue Matches (Gower Similarity)</h4>
                  <p className="text-xs text-slate-400">
                    Calculated across mixed continuous and categorical dimensions (department, fabric, price bracket, silhouette).
                  </p>
                </div>

                <div className="space-y-3">
                  {[
                    { sku: 'HIST-0042', name: 'Alpaca Blend Ribbed Cardigan', match: 92.4, price: '$69.00', actualDemand: 548, cat: 'Apparel' },
                    { sku: 'HIST-0118', name: 'Merino Wool Crewneck Sweater', match: 88.1, price: '$65.00', actualDemand: 512, cat: 'Apparel' },
                    { sku: 'HIST-0309', name: 'Lambswool Heritage Button-Up', match: 81.6, price: '$72.00', actualDemand: 485, cat: 'Apparel' }
                  ].map((twin, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 font-bold text-xs flex items-center justify-center border border-indigo-500/20">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="text-sm font-semibold text-white">{twin.name}</div>
                          <div className="text-xs text-slate-400">{twin.sku} &bull; {twin.cat} &bull; {twin.price}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {twin.match}% Similarity
                        </span>
                        <span className="text-xs text-slate-400 block mt-1">8W Actual: {twin.actualDemand}u</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 6. Why LaunchWise AI / About Section */}
      <section id="about" className="py-20 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">The Cold-Start Dilemma</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white leading-tight">
                Why Traditional Forecasting Fails for New Products
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Standard time-series models like ARIMA, Prophet, and LSTM rely on historical sales history that new products simply do not have. Merchandising teams are forced to guess purchase order quantities, resulting in either:
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-500/20 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-rose-500/20 text-rose-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-rose-200">The Stockout Trap (Under-Ordering)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                       New hero products sell out in week 2, forfeiting thousands in gross margin while customers churn to competitors.
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-500/20 flex items-start space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <Activity className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-200">The Markdown Graveyard (Over-Ordering)</h4>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Over-committing on unproven silhouettes leads to 50–70% clearance discounts, wiping out gross margins across the department.
                    </p>
                  </div>
                </div>
              </div>

              <p className="text-slate-300 text-sm leading-relaxed">
                LaunchWise AI solves this through <strong>Attribute-Driven Analogue Transfer</strong>, <strong>Conformal Uncertainty Calibration</strong>, and <strong>Newsvendor Economic Optimization</strong>.
              </p>
            </div>

            {/* Impact Metric Cards */}
            <div className="grid grid-cols-2 gap-5">
              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-cyan-400">26.6%</div>
                <div className="text-sm font-bold text-white">Hidden Actuals WAPE</div>
                <p className="text-xs text-slate-400">Zero-leakage ensemble accuracy on strictly held-out new SKU launches.</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400">83.8%</div>
                <div className="text-sm font-bold text-white">Empirical PICP</div>
                <p className="text-xs text-slate-400">Calibrated split-conformal coverage guaranteeing interval reliability.</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-indigo-400">18.4%</div>
                <div className="text-sm font-bold text-white">Margin Improvement</div>
                <p className="text-xs text-slate-400">Reduced excess markdowns while sustaining 95%+ fill rates on hero items.</p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="text-3xl sm:text-4xl font-extrabold text-purple-400">100%</div>
                <div className="text-sm font-bold text-white">Transparent XAI</div>
                <p className="text-xs text-slate-400">Every forecast backed by verified historical twins and demand drivers.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Final Call to Action */}
      <section className="py-20 bg-gradient-to-b from-slate-950 via-indigo-950/30 to-slate-950 text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight">
            Launch smarter. Plan inventory with confidence.
          </h2>
          <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
            Eliminate new product launch guesswork and safeguard merchandising margins with LaunchWise AI.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <button
              onClick={onNavigateRegister}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-indigo-500 to-cyan-500 text-white font-bold text-base shadow-xl shadow-cyan-500/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center space-x-2"
            >
              <span>Create Free Account</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onQuickDemo}
              className="px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-semibold text-base transition-all flex items-center space-x-2"
            >
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Launch Demo Buyer Portal</span>
            </button>
          </div>
        </div>
      </section>

      {/* 8. Modern Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center space-x-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-500 to-cyan-400 p-0.5 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              </div>
            </div>
            <span className="font-bold text-sm text-white">LaunchWise AI</span>
            <span className="text-slate-400">&bull; Predict demand. Plan purchases. Manage inventory smarter.</span>
          </div>

          <div className="flex items-center space-x-6">
            <a href="#features" className="hover:text-slate-200 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-200 transition-colors">How It Works</a>
            <a href="#preview" className="hover:text-slate-200 transition-colors">Preview</a>
            <a href="#about" className="hover:text-slate-200 transition-colors">About</a>
            <button onClick={onNavigateLogin} className="hover:text-slate-200 transition-colors">Sign In</button>
          </div>

          <div>
            &copy; {new Date().getFullYear()} LaunchWise AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
