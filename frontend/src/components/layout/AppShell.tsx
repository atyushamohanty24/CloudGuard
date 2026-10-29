import React from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { MobileNav } from './MobileNav';
import { CommandPalette } from '../command/CommandPalette';
import { AssistantSlideOver } from '../assistant/AssistantSlideOver';
import { FindingDetailDrawer } from '../../screens/FindingDetailDrawer';
import { useFindingsStore } from '../../state/useFindingsStore';
import { OverviewScreen } from '../../screens/OverviewScreen';
import { FindingsScreen } from '../../screens/FindingsScreen';
import { CostsScreen } from '../../screens/CostsScreen';
import { SecurityScreen } from '../../screens/SecurityScreen';
import { ReportsScreen } from '../../screens/ReportsScreen';
import { SettingsScreen } from '../../screens/SettingsScreen';
import { OnboardingScreen } from '../../screens/OnboardingScreen';

export const AppShell: React.FC = () => {
  const { activeScreen } = useFindingsStore();

  const renderScreen = () => {
    switch (activeScreen) {
      case 'overview':
        return <OverviewScreen />;
      case 'findings':
        return <FindingsScreen />;
      case 'costs':
        return <CostsScreen />;
      case 'security':
        return <SecurityScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'onboarding':
        return <OnboardingScreen />;
      default:
        return <OverviewScreen />;
    }
  };

  return (
    <div className="min-h-screen bg-background bg-grid-pattern text-text-primary flex">
      {/* 1. Left Desktop Sidebar */}
      <Sidebar />

      {/* 2. Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 lg:pb-8">
        {/* Sticky TopBar */}
        <TopBar />

        {/* Scrollable View Area */}
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {renderScreen()}
        </main>
      </div>

      {/* 3. Global Overlays & Drawers */}
      <CommandPalette />
      <AssistantSlideOver />
      <FindingDetailDrawer />
      <MobileNav />
    </div>
  );
};
