import React from 'react';
import { LayoutDashboard, ShieldAlert, DollarSign, Lock, Sparkles } from 'lucide-react';
import { useFindingsStore } from '../../state/useFindingsStore';

export const MobileNav: React.FC = () => {
  const { activeScreen, setActiveScreen, setAssistantOpen, findings } = useFindingsStore();
  const openCount = findings.filter((f) => f.status === 'open').length;

  const items = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'findings', label: 'Findings', icon: ShieldAlert, badge: openCount },
    { id: 'costs', label: 'Costs', icon: DollarSign },
    { id: 'security', label: 'Security', icon: Lock },
    { id: 'assistant', label: 'Advisor', icon: Sparkles, isAi: true },
  ];

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface/90 backdrop-blur-xl border-t border-border px-2 py-2 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeScreen === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'assistant') {
                setAssistantOpen(true);
              } else {
                setActiveScreen(item.id);
              }
            }}
            className={`flex flex-col items-center justify-center p-2 rounded-lg text-xs transition-colors relative ${
              isActive
                ? 'text-text-primary font-bold'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            <div className="relative">
              <Icon
                className={`w-5 h-5 ${
                  isActive
                    ? item.isAi
                      ? 'text-ai-cyan'
                      : 'text-text-primary'
                    : item.isAi
                    ? 'text-ai-violet'
                    : 'text-text-muted'
                }`}
              />
              {item.badge !== undefined && item.badge > 0 && (
                <span className="absolute -top-1 -right-2 px-1 text-[9px] font-bold rounded-full bg-severity-critical text-white">
                  {item.badge}
                </span>
              )}
            </div>
            <span className={`text-[10px] mt-1 ${item.isAi ? 'text-gradient-ai font-semibold' : ''}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
