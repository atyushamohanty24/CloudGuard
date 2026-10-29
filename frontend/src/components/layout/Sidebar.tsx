import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  DollarSign,
  Lock,
  Sparkles,
  FileText,
  Settings,
  HelpCircle,
  ShieldCheck,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useFindingsStore } from '../../state/useFindingsStore';

export const Sidebar: React.FC = () => {
  const { activeScreen, setActiveScreen, setAssistantOpen, findings } = useFindingsStore();
  const openCount = findings.filter((f) => f.status === 'open').length;

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'findings', label: 'Findings Queue', icon: ShieldAlert, badge: openCount },
    { id: 'costs', label: 'Cost Waste', icon: DollarSign },
    { id: 'security', label: 'Security Posture', icon: Lock },
    { id: 'assistant', label: 'AI Advisor', icon: Sparkles, isAi: true },
    { id: 'reports', label: 'Weekly Digest', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
    { id: 'onboarding', label: 'Deployment Guide', icon: HelpCircle },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen sticky top-0 bg-surface/80 border-r border-border backdrop-blur-xl z-30 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-ai-violet to-ai-cyan p-0.5 shadow-glow-ai flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F14] rounded-[7px] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-ai-cyan" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm tracking-tight text-text-primary">CloudGuard</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-ai-violet/20 text-purple-300 border border-ai-violet/30">
                AI
              </span>
            </div>
            <div className="text-[11px] text-text-muted flex items-center gap-1 font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-subtle" />
              AWS AUDIT v1.0
            </div>
          </div>
        </div>
      </div>

      {/* Account Info Pill */}
      <div className="px-4 py-3 mx-3 my-3 rounded-lg bg-surface-elevated/70 border border-border-subtle">
        <div className="flex items-center justify-between text-xs text-text-muted mb-1">
          <span>Target Account</span>
          <span className="text-[10px] uppercase font-mono px-1 py-0.5 bg-emerald-500/10 text-emerald-400 rounded">
            Read-Only
          </span>
        </div>
        <div className="text-xs font-mono font-medium text-text-primary truncate">
          123456789012 (prod)
        </div>
        <div className="text-[10px] text-text-muted mt-0.5">Region: us-east-1 + 3 more</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
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
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-surface-elevated text-text-primary border border-border font-semibold shadow-inner-glow'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-elevated/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={`w-4 h-4 ${
                    isActive
                      ? item.isAi
                        ? 'text-ai-cyan'
                        : 'text-text-primary'
                      : item.isAi
                      ? 'text-ai-violet'
                      : 'text-text-muted'
                  }`}
                />
                <span className={item.isAi ? 'text-gradient-ai font-semibold' : ''}>
                  {item.label}
                </span>
              </div>

              {item.badge !== undefined && item.badge > 0 && (
                <span className="px-2 py-0.5 text-xs font-mono font-bold rounded-full bg-rose-500/15 text-severity-critical border border-rose-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bedrock Intelligence Footer Badge */}
      <div className="p-3 m-3 rounded-xl bg-gradient-to-b from-ai-violet/10 to-transparent border border-ai-violet/20">
        <div className="flex items-center gap-2 mb-1.5">
          <Radio className="w-3.5 h-3.5 text-ai-cyan animate-pulse" />
          <span className="text-xs font-semibold text-text-primary">Amazon Bedrock</span>
        </div>
        <p className="text-[11px] text-text-secondary leading-relaxed">
          Claude 3.5 Sonnet connected. Explanations & chat strictly grounded on DDB findings.
        </p>
        <button
          onClick={() => setAssistantOpen(true)}
          className="mt-2.5 w-full text-[11px] py-1.5 rounded-md bg-ai-violet/20 hover:bg-ai-violet/30 text-purple-200 border border-ai-violet/40 font-medium flex items-center justify-center gap-1 transition-all"
        >
          <Sparkles className="w-3 h-3 text-ai-cyan" />
          Ask Assistant
        </button>
      </div>
    </aside>
  );
};
