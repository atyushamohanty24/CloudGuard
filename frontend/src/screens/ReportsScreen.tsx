import React, { useState } from 'react';
import {
  FileText,
  Mail,
  Send,
  Calendar,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  Sparkles,
  Clock,
  Shield,
} from 'lucide-react';
import { useFindingsStore } from '../state/useFindingsStore';
import { Button } from '../components/ui/Button';

export const ReportsScreen: React.FC = () => {
  const { findings, getMetrics } = useFindingsStore();
  const metrics = getMetrics();
  const [testSent, setTestSent] = useState(false);
  const [sending, setSending] = useState(false);

  const topRisks = findings
    .filter((f) => f.severity === 'critical' || f.severity === 'high')
    .slice(0, 5);

  const handleSendTest = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 1200));
    setSending(false);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 4000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200 max-w-4xl">
      {/* Header & Controls */}
      <div className="glass-panel p-6 rounded-2xl border border-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-ai-cyan" />
            <h2 className="text-lg font-bold text-text-primary">
              Automated Weekly Executive Digest
            </h2>
          </div>
          <p className="text-xs text-text-secondary mt-1">
            EventBridge triggers the weekly summarization Lambda every Monday at 08:00 UTC, dispatching a high-level briefing to registered engineering leads.
          </p>
        </div>

        <Button
          variant="ai"
          size="sm"
          onClick={handleSendTest}
          disabled={sending}
          className="shrink-0"
        >
          {sending ? (
            'Dispatching...'
          ) : testSent ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-1 text-emerald-400" /> Sent!
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-1.5" /> Send Test Digest
            </>
          )}
        </Button>
      </div>

      {/* Email Rendered Preview Mockup */}
      <div className="glass-panel-elevated rounded-2xl border border-border p-8 shadow-2xl space-y-6 bg-gradient-to-b from-surface via-surface to-surface-elevated">
        {/* Email Header */}
        <div className="border-b border-border pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ai-violet to-ai-cyan p-0.5 shadow-glow-ai flex items-center justify-center">
              <div className="w-full h-full bg-[#0B0F14] rounded-[10px] flex items-center justify-center">
                <Shield className="w-5 h-5 text-ai-cyan" />
              </div>
            </div>
            <div>
              <h3 className="text-base font-bold text-text-primary">
                CloudGuard AI — Weekly Cloud Briefing
              </h3>
              <div className="text-xs text-text-muted font-mono">
                Week 43, 2026 · Account: 123456789012 (prod)
              </div>
            </div>
          </div>

          <span className="text-xs font-mono text-emerald-400 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20">
            Posture: {metrics.posture.overall_score}/100
          </span>
        </div>

        {/* Executive Summary Card */}
        <div className="p-4 rounded-xl bg-surface border border-border space-y-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
            <Sparkles className="w-4 h-4 text-ai-cyan" />
            <span>AI Executive Synthesis</span>
          </div>
          <p className="text-xs sm:text-sm text-text-primary leading-relaxed">
            Over the past 7 days, CloudGuard audited 184 resources across 4 regions. We identified{' '}
            <strong className="text-emerald-400">${Math.round(metrics.total_monthly_waste).toLocaleString()}/month</strong> in recoverable cloud waste and{' '}
            <strong className="text-severity-critical">{metrics.open_critical_count} critical exposures</strong> requiring immediate remediation.
          </p>
        </div>

        {/* Top 5 Risks Section */}
        <div className="space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-text-muted flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-severity-critical" />
            <span>Top 5 Actionable Risks This Week</span>
          </div>

          <div className="space-y-2.5">
            {topRisks.map((risk, index) => (
              <div
                key={risk.id}
                className="p-3.5 rounded-xl bg-surface border border-border flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="font-bold text-text-primary flex items-center gap-2">
                    <span className="font-mono text-text-muted">#{index + 1}</span>
                    <span>{risk.title}</span>
                  </div>
                  <div className="text-[11px] text-text-secondary leading-relaxed">
                    {risk.ai_recommendation}
                  </div>
                  <div className="text-[10px] font-mono text-text-muted">
                    Resource: {risk.resource_id} · Region: {risk.region}
                  </div>
                </div>

                <div className="shrink-0 text-right font-mono">
                  {risk.est_monthly_saving_usd > 0 ? (
                    <span className="text-emerald-400 font-bold">
                      +${risk.est_monthly_saving_usd.toFixed(0)}/mo
                    </span>
                  ) : (
                    <span className="text-severity-critical font-bold uppercase text-[10px]">
                      Critical
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Email Footer */}
        <div className="pt-6 border-t border-border flex flex-col sm:flex-row items-center justify-between text-xs text-text-muted gap-2">
          <span>Dispatched by CloudGuard AI Lambda Digest Daemon via Amazon SES.</span>
          <span className="font-mono">Next delivery: Monday, 08:00 UTC</span>
        </div>
      </div>
    </div>
  );
};
