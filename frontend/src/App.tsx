import React, { useState, useEffect } from 'react';
import { AppShell } from './components/layout/AppShell';
import { LoginScreen } from './screens/LoginScreen';
import { useThemeStore } from './state/useThemeStore';

export const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return <AppShell />;
};

export default App;
