import React from 'react';
import {
  Search,
  RefreshCw,
  Sun,
  Moon,
  Sparkles,
  Bell,
  Command,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { useFindingsStore } from '../../state/useFindingsStore';
import { useThemeStore } from '../../state/useThemeStore';
import { Button } from '../ui/Button';

export const TopBar: React.FC = () => {
  const {
    isScanning,
    scanProgress,
    lastScanTime,
    triggerScan,
    setCommandPaletteOpen,
    setAssistantOpen,
    activeScreen,
  } = useFindingsStore();
  const { isDark, toggleTheme } = useThemeStore();

  const screenTitles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: 'Mission Control Overview',
      subtitle: 'Real-time telemetry, posture score, and fix-first recommendations',
    },
    findings: {
      title: 'Findings Queue',
      subtitle: 'Faceted triage of security misconfigurations and cost waste',
    },
    costs: {
      title: 'Cost Intelligence & Anomalies',
      subtitle: '12-month spend breakdown, idle resources, and savings waterfall',
    },
    security: {
      title: 'Security Posture & Compliance',
      subtitle: 'Vulnerability matrix, public exposures, and IAM credential hygiene',
    },
    reports: {
      title: 'Weekly Executive Digest',
      subtitle: 'Automated email summary of top 5 risks and recaptured savings',
    },
    settings: {
      title: 'System & Scan Settings',
      subtitle: 'EventBridge schedules, Bedrock model parameters, and notifications',
    },
    onboarding: {
      title: 'Read-Only Account Setup',
      subtitle: '3-step guide to connect target AWS accounts with least-privilege IAM',
    },
  };

  const current = screenTitles[activeScreen] || {
    title: 'CloudGuard AI',
    subtitle: 'Serverless AWS Cost & Security Posture Advisor',
  };

  return (
    <header className="sticky top-0 z-20 w-full bg-background/80 backdrop-blur-xl border-b border-border px-4 lg:px-8 py-3.5">
      <div className="flex items-center justify-between gap-4">
        {/* Screen Title & Subtitle */}
        <div className="min-w-0">
          <h1 className="text-lg lg:text-xl font-bold tracking-tight text-text-primary truncate">
            {current.title}
          </h1>
          <p className="hidden sm:block text-xs text-text-secondary truncate mt-0.5">
            {current.subtitle}
          </p>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center gap-2.5">
          {/* Cmd+K Search Trigger */}
          <button
            onClick={() => setCommandPaletteOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-elevated border border-border text-xs text-text-secondary hover:text-text-primary hover:border-border-highlight transition-all"
            aria-label="Search and command palette"
          >
            <Search className="w-3.5 h-3.5 text-text-muted" />
            <span className="hidden md:inline">Quick search or command...</span>
            <span className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono rounded bg-surface border border-border text-text-muted">
              <Command className="w-2.5 h-2.5" /> K
            </span>
          </button>

          {/* Trigger Scan Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => triggerScan()}
            disabled={isScanning}
            className="relative overflow-hidden font-medium"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-ai-cyan ${isScanning ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">
              {isScanning ? `Auditing (${scanProgress}%)` : 'Run Audit'}
            </span>
            {isScanning && (
              <span
                className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-ai-violet to-ai-cyan transition-all duration-300"
                style={{ width: `${scanProgress}%` }}
              />
            )}
          </Button>

          {/* Bedrock AI Assistant Button */}
          <Button
            variant="ai"
            size="sm"
            onClick={() => setAssistantOpen(true)}
            className="hidden sm:inline-flex"
          >
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>AI Advisor</span>
          </Button>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg bg-surface-elevated border border-border text-text-secondary hover:text-text-primary hover:border-border-highlight transition-all"
            aria-label="Toggle dark/light mode"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-blue-500" />}
          </button>
        </div>
      </div>

      {/* Progress banner during scan */}
      {isScanning && (
        <div className="mt-2.5 pt-2 border-t border-border-subtle flex items-center justify-between text-xs text-ai-cyan font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-ai-cyan animate-ping" />
            <span>Collecting CloudWatch metrics & evaluating 12 domain checks...</span>
          </div>
          <span>{scanProgress}% complete</span>
        </div>
      )}
    </header>
  );
};
