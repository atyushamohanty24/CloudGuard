import React, { useState, useEffect } from 'react';
import {
  Search,
  ShieldAlert,
  LayoutDashboard,
  DollarSign,
  Lock,
  Sparkles,
  RefreshCw,
  Sun,
  Moon,
  X,
  ArrowRight,
} from 'lucide-react';
import { useFindingsStore } from '../../state/useFindingsStore';
import { useThemeStore } from '../../state/useThemeStore';
import { SeverityBadge } from '../ui/Badge';

export const CommandPalette: React.FC = () => {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    findings,
    selectFinding,
    setActiveScreen,
    triggerScan,
    setAssistantOpen,
  } = useFindingsStore();

  const { isDark, toggleTheme } = useThemeStore();
  const [query, setQuery] = useState('');

  // Global keydown listener for Cmd+K / Ctrl+K & Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape' && commandPaletteOpen) {
        setCommandPaletteOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const filteredFindings = findings
    .filter(
      (f) =>
        f.title.toLowerCase().includes(query.toLowerCase()) ||
        f.resource_id.toLowerCase().includes(query.toLowerCase()) ||
        f.service.toLowerCase().includes(query.toLowerCase())
    )
    .slice(0, 5);

  const actions = [
    {
      id: 'scan',
      label: 'Trigger Audit Scan',
      icon: RefreshCw,
      action: () => {
        triggerScan();
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'assistant',
      label: 'Ask CloudGuard AI Advisor',
      icon: Sparkles,
      isAi: true,
      action: () => {
        setAssistantOpen(true);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'theme',
      label: isDark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      icon: isDark ? Sun : Moon,
      action: () => {
        toggleTheme();
        setCommandPaletteOpen(false);
      },
    },
  ];

  const screens = [
    { id: 'overview', label: 'Go to Overview', icon: LayoutDashboard },
    { id: 'findings', label: 'Go to Findings Queue', icon: ShieldAlert },
    { id: 'costs', label: 'Go to Cost Intelligence', icon: DollarSign },
    { id: 'security', label: 'Go to Security Posture', icon: Lock },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl glass-panel-elevated rounded-2xl border border-border shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-5 h-5 text-text-muted shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a finding, resource ID, or action..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
          />
          <button
            onClick={() => setCommandPaletteOpen(false)}
            className="p-1 rounded text-text-muted hover:text-text-primary"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2 space-y-4">
          {/* Quick Actions */}
          <div>
            <div className="text-[11px] font-semibold text-text-muted px-2 py-1 uppercase tracking-wider">
              Quick Actions
            </div>
            <div className="space-y-0.5 mt-1">
              {actions.map((act) => {
                const Icon = act.icon;
                return (
                  <button
                    key={act.id}
                    onClick={act.action}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-text-primary hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className={`w-4 h-4 ${act.isAi ? 'text-ai-cyan' : 'text-text-muted'}`} />
                      <span className={act.isAi ? 'text-gradient-ai font-semibold' : ''}>
                        {act.label}
                      </span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-text-muted" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Matched Findings */}
          {filteredFindings.length > 0 && (
            <div>
              <div className="text-[11px] font-semibold text-text-muted px-2 py-1 uppercase tracking-wider">
                Findings ({filteredFindings.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredFindings.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      selectFinding(f.id);
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left hover:bg-surface transition-colors"
                  >
                    <div className="min-w-0 pr-3">
                      <div className="text-xs font-medium text-text-primary truncate">
                        {f.title}
                      </div>
                      <div className="text-[11px] font-mono text-text-muted truncate mt-0.5">
                        {f.resource_id} · {f.region}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {f.est_monthly_saving_usd > 0 && (
                        <span className="text-xs font-mono font-semibold text-emerald-400">
                          +${f.est_monthly_saving_usd}/mo
                        </span>
                      )}
                      <SeverityBadge severity={f.severity} size="sm" />
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Navigation Screens */}
          <div>
            <div className="text-[11px] font-semibold text-text-muted px-2 py-1 uppercase tracking-wider">
              Navigation
            </div>
            <div className="space-y-0.5 mt-1">
              {screens.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      setActiveScreen(s.id);
                      setCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-text-secondary hover:text-text-primary hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 text-text-muted" />
                      <span>{s.label}</span>
                    </div>
                    <span className="text-[10px] text-text-muted font-mono">Jump</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2.5 bg-surface/50 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
          <span>Navigate with arrows</span>
          <span>Press ESC to dismiss</span>
        </div>
      </div>
    </div>
  );
};
