import React, { useState } from 'react';
import { 
  Sparkles, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Zap, 
  AlertCircle, 
  TrendingUp, 
  ShieldCheck, 
  Boxes, 
  CheckCircle2,
  BarChart3,
  Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface LoginPageProps {
  onNavigateRegister: () => void;
  onNavigateForgotPassword: () => void;
  onNavigateHome: () => void;
  onLoginSuccess: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onNavigateRegister,
  onNavigateForgotPassword,
  onLoginSuccess
}) => {
  const { login, loginAsDemo } = useAuth();
  const [email, setEmail] = useState(() => localStorage.getItem('launchwise_remember_email') || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your work email address.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setIsLoading(true);
    try {
      await login(email, password, rememberMe);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoClick = async () => {
    setError(null);
    setIsLoading(true);
    try {
      await loginAsDemo();
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Demo authentication failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-12 py-8 relative overflow-hidden font-sans">
      {/* Background ambient lighting */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-indigo-600/10 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/10 blur-[100px] pointer-events-none rounded-full" />

      {/* Main Two-Column Container */}
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center relative z-10">
        
        {/* LEFT COLUMN: Retail Intelligence Showcase (Desktop Split) */}
        <div className="lg:col-span-7 flex flex-col justify-center space-y-7 order-2 lg:order-1">
          {/* Logo & Tagline Pill */}
          <div className="space-y-3">
            <div className="inline-flex items-center space-x-3">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="font-extrabold text-2xl tracking-tight text-white">
                  LaunchWise<span className="text-cyan-400"> AI</span>
                </span>
                <span className="block text-[11px] font-mono tracking-wider text-cyan-400/90 uppercase font-semibold">
                  Retail Intelligence Platform
                </span>
              </div>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-[1.15]">
              Turn Product Launch Uncertainty into <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400">Purchasing Confidence.</span>
            </h1>
            
            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              Forecasting new products with zero sales history is retail's toughest challenge. LaunchWise AI predicts the first 8 weeks of demand using attribute similarity, conformal bounds, and Newsvendor profit-optimized inventory recommendations.
            </p>
          </div>

          {/* Live Forecast Preview Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-2xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-semibold text-slate-200">
                  NEW-SKU-001 • Smart Home Hubs (NextGen)
                </span>
              </div>
              <span className="text-[10px] font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 px-2 py-0.5 rounded-full">
                8-Week Cold-Start Model
              </span>
            </div>

            {/* 8-Week Sparkline / Curve Visual */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Launch Trajectory (Weeks 1 to 8)</span>
                <span className="font-mono text-cyan-400">Peak: Week 2 (Surge)</span>
              </div>
              
              <div className="grid grid-cols-8 gap-1.5 h-20 items-end bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
                {[
                  { w: 'W1', val: 28, upper: 36, lower: 20 },
                  { w: 'W2', val: 38, upper: 47, lower: 29 },
                  { w: 'W3', val: 30, upper: 38, lower: 22 },
                  { w: 'W4', val: 24, upper: 31, lower: 17 },
                  { w: 'W5', val: 19, upper: 25, lower: 13 },
                  { w: 'W6', val: 17, upper: 23, lower: 11 },
                  { w: 'W7', val: 15, upper: 20, lower: 10 },
                  { w: 'W8', val: 13, upper: 18, lower: 8 }
                ].map((item, idx) => (
                  <div key={idx} className="flex flex-col items-center h-full justify-end group">
                    <div 
                      className="w-full bg-gradient-to-t from-indigo-600 to-cyan-400 rounded-t transition-all group-hover:brightness-125 relative"
                      style={{ height: `${(item.val / 47) * 100}%` }}
                    >
                      <span className="opacity-0 group-hover:opacity-100 absolute -top-5 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-300 bg-slate-900 px-1 rounded shadow pointer-events-none transition-opacity">
                        {item.val}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 mt-1">{item.w}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Metrics Trio */}
            <div className="grid grid-cols-3 gap-3 pt-2 text-center">
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">8-Wk Demand</span>
                <span className="text-base font-bold text-white">184 Units</span>
              </div>
              <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20">
                <span className="block text-[10px] uppercase font-mono tracking-wider text-indigo-300">Recommended Buy (Q*)</span>
                <span className="text-base font-bold text-cyan-300">215 Units</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                <span className="block text-[10px] uppercase font-mono tracking-wider text-slate-400">Stockout Risk</span>
                <span className="text-base font-bold text-emerald-400">&lt; 4.2%</span>
              </div>
            </div>
          </div>

          {/* Key Advantages Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <TrendingUp className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-slate-200">Zero-Sales Cold Start</h2>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Attribute similarity + analogue curve decomposition.</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <ShieldCheck className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-slate-200">Conformal Bounds</h2>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Calibrated prediction intervals for demand uncertainty.</p>
              </div>
            </div>

            <div className="flex items-start space-x-2.5 p-3 rounded-xl bg-slate-900/50 border border-slate-800/80">
              <Boxes className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h2 className="text-xs font-semibold text-slate-200">Newsvendor Q*</h2>
                <p className="text-[11px] text-slate-400 leading-tight mt-0.5">Balances understock lost margin against overstock markdowns.</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Sign In Form Card */}
        <div className="lg:col-span-5 flex flex-col justify-center order-1 lg:order-2">
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
            
            {/* Header */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider uppercase text-cyan-400 font-semibold px-2 py-0.5 bg-cyan-500/10 border border-cyan-500/20 rounded">
                  Secure Access
                </span>
                <span className="text-[11px] text-slate-400">LaunchWise AI v1.0</span>
              </div>
              <h2 className="text-2xl font-bold text-white tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-400">
                Enter your credentials to access your store's forecasts and inventory.
              </p>
            </div>

            {/* Quick Demo Buyer Login */}
            <button
              type="button"
              onClick={handleDemoClick}
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-indigo-500/10 hover:from-amber-500/30 hover:to-indigo-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs transition-all flex items-center justify-center space-x-2 shadow-inner group"
            >
              <Zap className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
              <span>1-Click Demo Login (Sarah Jenkins &bull; Lead Planner)</span>
            </button>

            <div className="flex items-center space-x-3 text-xs text-slate-400">
              <div className="flex-1 h-px bg-slate-800" />
              <span>or sign in with email</span>
              <div className="flex-1 h-px bg-slate-800" />
            </div>

            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center space-x-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Address */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Work Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="email"
                    required
                    placeholder="buyer@retail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-300">Password</label>
                  <button
                    type="button"
                    onClick={onNavigateForgotPassword}
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-950/80 border border-slate-700 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center space-x-2 text-xs text-slate-300 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-700 bg-slate-950 text-cyan-500 focus:ring-0 focus:ring-offset-0"
                  />
                  <span>Remember my work email</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-indigo-600 to-indigo-700 hover:from-cyan-400 hover:to-indigo-600 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Signing In...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In to LaunchWise</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Footer / Sign Up Link */}
            <div className="pt-2 border-t border-slate-800 text-center text-xs text-slate-400">
              Don't have an account yet?{' '}
              <button
                type="button"
                onClick={onNavigateRegister}
                className="text-cyan-400 font-semibold hover:underline"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
