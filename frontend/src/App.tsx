import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { HomePage } from './pages/public/HomePage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { AppPortal } from './pages/portal/AppPortal';

type AppRoute = 'login' | 'register' | 'forgot-password' | 'app';

function MainRouter() {
  const { isAuthenticated, isLoading, loginAsDemo } = useAuth();
  
  // Read initial hash or default to login
  const getRouteFromHash = (): AppRoute => {
    const hash = window.location.hash.replace('#', '').replace('/', '');
    if (hash === 'register') return 'register';
    if (hash === 'forgot-password') return 'forgot-password';
    if (hash === 'app') return 'app';
    return 'login';
  };

  const [currentRoute, setCurrentRoute] = useState<AppRoute>(getRouteFromHash());

  // Listen to hash changes (browser back/forward button support)
  useEffect(() => {
    const handleHashChange = () => {
      setCurrentRoute(getRouteFromHash());
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (route: AppRoute) => {
    setCurrentRoute(route);
    window.location.hash = route === 'login' ? '' : `/${route}`;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-cyan-400 rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium tracking-wide">Initializing LaunchWise AI...</span>
      </div>
    );
  }

  // 1. Mandatory Login Page as First Page for Unauthenticated Visitors
  // Protected barrier: No business information, forecasts, or inventory visible without authentication
  if (!isAuthenticated) {
    if (currentRoute === 'register') {
      return (
        <RegisterPage
          onNavigateLogin={() => navigateTo('login')}
          onNavigateHome={() => navigateTo('login')}
          onRegisterSuccess={() => navigateTo('app')}
        />
      );
    }

    if (currentRoute === 'forgot-password') {
      return (
        <ForgotPasswordPage
          onNavigateLogin={() => navigateTo('login')}
          onNavigateHome={() => navigateTo('login')}
        />
      );
    }

    // Default: LaunchWise AI Login page
    return (
      <LoginPage
        onNavigateRegister={() => navigateTo('register')}
        onNavigateForgotPassword={() => navigateTo('forgot-password')}
        onNavigateHome={() => navigateTo('login')}
        onLoginSuccess={() => navigateTo('app')}
      />
    );
  }

  // 2. Authenticated Session: App Workspace & Portal
  return <AppPortal onNavigateHome={() => navigateTo('login')} />;
}

export function App() {
  return (
    <AuthProvider>
      <MainRouter />
    </AuthProvider>
  );
}

export default App;
