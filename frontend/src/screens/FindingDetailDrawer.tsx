import React, { useState } from 'react';
import {
  X,
  Copy,
  Check,
  Sparkles,
  ShieldAlert,
  DollarSign,
  Calendar,
  Layers,
  MapPin,
  CheckCircle2,
  Clock,
  Code2,
  Terminal,
} from 'lucide-react';
import { useFindingsStore } from '../state/useFindingsStore';
import { SeverityBadge, StatusBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const FindingDetailDrawer: React.FC = () => {
  const { selectedFindingId, selectFinding, findings, updateFindingStatus } = useFindingsStore();
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'cli' | 'terraform'>('cli');

  if (!selectedFindingId) return null;

  const finding = findings.find((f) => f.id === selectedFindingId);
  if (!finding) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => selectFinding(null)}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl glass-panel-elevated border-l border-border flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <SeverityBadge severity={finding.severity} />
                <Badge variant={finding.category === 'cost' ? 'savings' : 'neutral'}>
                  {finding.category}
                </Badge>
                <StatusBadge status={finding.status} />
              </div>

              <button
                onClick={() => selectFinding(null)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface transition-colors"
                aria-label="Close drawer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h2 className="text-lg sm:text-xl font-bold text-text-primary leading-snug">
              {finding.title}
            </h2>

            <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-text-secondary font-mono">
              <div className="flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-text-muted" />
                <span>{finding.service} ({finding.resource_type})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-text-muted" />
                <span>{finding.region}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-text-muted" />
                <span>Seen: {new Date(finding.first_seen).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Impact Metric Hero */}
            {finding.est_monthly_saving_usd > 0 ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase text-emerald-400 font-semibold tracking-wider">
                    Monthly Recoverable Spend
                  </span>
                  <div className="text-2xl font-extrabold text-emerald-400 font-mono mt-0.5 tabular-nums">
                    ${finding.est_monthly_saving_usd.toFixed(2)}
                    <span className="text-xs font-normal text-text-muted ml-1">/ month</span>
                  </div>
                </div>
                <div className="text-right text-xs text-text-muted font-mono">
                  ${(finding.est_monthly_saving_usd * 12).toFixed(0)}/yr projected
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-6 h-6 text-severity-critical" />
                  <div>
                    <span className="text-[11px] font-mono uppercase text-rose-400 font-semibold tracking-wider">
                      Security Exposure Risk
                    </span>
                    <div className="text-sm font-bold text-text-primary mt-0.5">
                      Critical Attack Vector Open to Internet
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Bedrock AI Plain-English Analysis */}
            <div className="p-4 rounded-xl bg-surface-elevated border border-border space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-purple-300">
                <Sparkles className="w-4 h-4 text-ai-cyan" />
                <span>Amazon Bedrock Synthesis (Claude 3.5 Sonnet)</span>
              </div>
              <p className="text-sm text-text-primary leading-relaxed">
                {finding.ai_recommendation}
              </p>
            </div>

            {/* Target Resource ID Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Audited Resource ID
              </label>
              <div className="flex items-center justify-between p-3 rounded-lg bg-surface border border-border font-mono text-xs text-text-primary">
                <span className="truncate pr-2">{finding.resource_id}</span>
                <button
                  onClick={() => handleCopy(finding.resource_id, 'res-id')}
                  className="p-1 text-text-muted hover:text-text-primary transition-colors shrink-0"
                  title="Copy resource ID"
                >
                  {copiedKey === 'res-id' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Remediation Snippet (Display Only) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                  Remediation Blueprint (Display Only — Read-Only Mode)
                </label>
                <div className="flex items-center gap-1 font-mono text-xs">
                  <button
                    onClick={() => setActiveTab('cli')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeTab === 'cli'
                        ? 'bg-surface-elevated text-text-primary font-bold border border-border'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    AWS CLI
                  </button>
                  <button
                    onClick={() => setActiveTab('terraform')}
                    className={`px-2.5 py-1 rounded-md transition-colors ${
                      activeTab === 'terraform'
                        ? 'bg-surface-elevated text-text-primary font-bold border border-border'
                        : 'text-text-muted hover:text-text-primary'
                    }`}
                  >
                    Terraform
                  </button>
                </div>
              </div>

              <div className="relative rounded-xl bg-[#080B0F] border border-border p-4 font-mono text-xs text-emerald-400/90 overflow-x-auto">
                <button
                  onClick={() =>
                    handleCopy(
                      activeTab === 'cli'
                        ? finding.remediation_snippet.cli
                        : finding.remediation_snippet.terraform,
                      'snip-main'
                    )
                  }
                  className="absolute top-3 right-3 p-1.5 rounded bg-surface/80 text-text-muted hover:text-text-primary transition-colors"
                  title="Copy snippet"
                >
                  {copiedKey === 'snip-main' ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
                <pre className="whitespace-pre-wrap leading-relaxed select-all">
                  {activeTab === 'cli'
                    ? finding.remediation_snippet.cli
                    : finding.remediation_snippet.terraform}
                </pre>
              </div>
              <p className="text-[11px] text-text-muted italic">
                * CloudGuard AI is strictly read-only. Apply these changes manually via your AWS CLI session or IaC pipeline.
              </p>
            </div>

            {/* Raw Telemetry & Evidence JSON */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
                Raw Telemetry Evidence
              </label>
              <div className="p-3.5 rounded-xl bg-[#080B0F] border border-border font-mono text-xs text-text-secondary overflow-x-auto max-h-56">
                <pre>{JSON.stringify(finding.evidence, null, 2)}</pre>
              </div>
            </div>
          </div>

          {/* Footer Actions: Status Updater */}
          <div className="p-4 border-t border-border bg-surface flex items-center justify-between">
            <span className="text-xs text-text-muted font-medium">Update Status:</span>
            <div className="flex items-center gap-2">
              <Button
                variant={finding.status === 'open' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => updateFindingStatus(finding.id, 'open')}
                className="text-xs"
              >
                Open
              </Button>
              <Button
                variant={finding.status === 'acknowledged' ? 'secondary' : 'ghost'}
                size="sm"
                onClick={() => updateFindingStatus(finding.id, 'acknowledged')}
                className="text-xs"
              >
                Acknowledge
              </Button>
              <Button
                variant={finding.status === 'resolved' ? 'primary' : 'outline'}
                size="sm"
                onClick={() => updateFindingStatus(finding.id, 'resolved')}
                className="text-xs text-emerald-400 hover:text-emerald-300"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Resolved
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
