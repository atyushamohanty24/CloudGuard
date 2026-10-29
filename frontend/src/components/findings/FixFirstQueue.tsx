import React, { useState } from 'react';
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Terminal,
  Code,
  Sparkles,
  ExternalLink,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { Finding } from '../../types';
import { useFindingsStore } from '../../state/useFindingsStore';
import { SeverityBadge, Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

export const FixFirstQueue: React.FC = () => {
  const { findings, selectFinding, updateFindingStatus } = useFindingsStore();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [expandedEvidence, setExpandedEvidence] = useState<Record<string, boolean>>({});
  const [activeSnippetTab, setActiveSnippetTab] = useState<Record<string, 'cli' | 'terraform'>>({});

  // Rank open findings by severity weight and savings
  const severityWeight = { critical: 4, high: 3, medium: 2, low: 1 };

  const topQueue = [...findings]
    .filter((f) => f.status === 'open')
    .sort((a, b) => {
      const weightA = severityWeight[a.severity] * 1000 + (a.est_monthly_saving_usd || 0);
      const weightB = severityWeight[b.severity] * 1000 + (b.est_monthly_saving_usd || 0);
      return weightB - weightA;
    })
    .slice(0, 5); // Top 5 highest impact actions

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleEvidence = (id: string) => {
    setExpandedEvidence((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-severity-critical animate-pulse" />
            <h3 className="text-base font-bold text-text-primary">
              Prioritized "Fix First" Queue
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Ranked by financial return and blast radius. Addressing these 5 resolves 80% of critical cloud risk.
          </p>
        </div>

        <span className="text-xs font-mono text-text-muted">
          Showing top {topQueue.length} priority items
        </span>
      </div>

      <div className="space-y-3.5">
        {topQueue.map((finding, idx) => {
          const isEvidenceOpen = !!expandedEvidence[finding.id];
          const activeTab = activeSnippetTab[finding.id] || 'cli';

          return (
            <div
              key={finding.id}
              className="glass-panel rounded-xl p-5 border border-border hover:border-border-highlight transition-all duration-200 relative overflow-hidden group shadow-lg"
            >
              {/* Top Accent bar based on severity */}
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 ${
                  finding.severity === 'critical'
                    ? 'bg-severity-critical'
                    : finding.severity === 'high'
                    ? 'bg-severity-high'
                    : 'bg-severity-medium'
                }`}
              />

              {/* Header: Rank, Badges, Title, Savings */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-surface-elevated text-text-muted border border-border">
                      #{idx + 1}
                    </span>
                    <SeverityBadge severity={finding.severity} size="sm" />
                    <Badge variant={finding.category === 'cost' ? 'savings' : 'neutral'} size="sm">
                      {finding.category}
                    </Badge>
                    <span className="text-[11px] font-mono text-text-muted">
                      {finding.service} · {finding.region}
                    </span>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-text-primary leading-snug">
                    {finding.title}
                  </h4>
                </div>

                {/* Savings or Security Impact Pill */}
                <div className="shrink-0 flex items-center gap-2">
                  {finding.est_monthly_saving_usd > 0 ? (
                    <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-right">
                      <span className="text-[10px] text-emerald-400/80 block uppercase font-mono font-semibold">
                        Recovers
                      </span>
                      <span className="text-sm font-bold font-mono text-emerald-400 tabular-nums">
                        ${finding.est_monthly_saving_usd.toFixed(0)}/mo
                      </span>
                    </div>
                  ) : (
                    <div className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-right">
                      <span className="text-[10px] text-rose-400/80 block uppercase font-mono font-semibold">
                        Exposure
                      </span>
                      <span className="text-xs font-bold text-rose-400">Critical Breach Risk</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Bedrock AI Recommendation Quote */}
              <div className="mt-3.5 p-3 rounded-lg bg-surface-elevated/70 border border-border-subtle flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-ai-cyan shrink-0 mt-0.5" />
                <div className="text-xs text-text-secondary leading-relaxed">
                  <strong className="text-text-primary font-medium">Bedrock Recommendation: </strong>
                  {finding.ai_recommendation}
                </div>
              </div>

              {/* Resource Chip with Copy */}
              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 font-mono text-text-muted bg-surface-subtle px-2.5 py-1 rounded-md border border-border-subtle max-w-full">
                  <span className="text-[10px] uppercase font-semibold text-text-muted">Resource:</span>
                  <span className="text-text-primary truncate">{finding.resource_id}</span>
                  <button
                    onClick={() => handleCopy(finding.resource_id, `res-${finding.id}`)}
                    className="p-0.5 text-text-muted hover:text-text-primary"
                    title="Copy resource ID"
                  >
                    {copiedId === `res-${finding.id}` ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                {/* Evidence & Snippet Toggles */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleEvidence(finding.id)}
                    className="text-xs text-text-muted hover:text-text-primary flex items-center gap-1 font-mono transition-colors"
                  >
                    <span>Evidence JSON</span>
                    {isEvidenceOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <button
                    onClick={() => selectFinding(finding.id)}
                    className="text-xs text-ai-cyan hover:underline flex items-center gap-1 font-medium transition-colors"
                  >
                    <span>Inspect</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Collapsible Evidence JSON */}
              {isEvidenceOpen && (
                <div className="mt-3 p-3 rounded-lg bg-[#080B0F] border border-border text-[11px] font-mono text-text-secondary overflow-x-auto">
                  <pre>{JSON.stringify(finding.evidence, null, 2)}</pre>
                </div>
              )}

              {/* Copyable Remediation Snippet (Display Only - Never Executed) */}
              <div className="mt-3 pt-3 border-t border-border">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] uppercase tracking-wider font-mono text-text-muted font-semibold mr-2">
                      Remediation Snippet (Display Only)
                    </span>
                    <button
                      onClick={() =>
                        setActiveSnippetTab((prev) => ({ ...prev, [finding.id]: 'cli' }))
                      }
                      className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                        activeTab === 'cli'
                          ? 'bg-surface-elevated text-text-primary border border-border font-semibold'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      AWS CLI
                    </button>
                    <button
                      onClick={() =>
                        setActiveSnippetTab((prev) => ({ ...prev, [finding.id]: 'terraform' }))
                      }
                      className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                        activeTab === 'terraform'
                          ? 'bg-surface-elevated text-text-primary border border-border font-semibold'
                          : 'text-text-muted hover:text-text-primary'
                      }`}
                    >
                      Terraform
                    </button>
                  </div>

                  <button
                    onClick={() =>
                      handleCopy(
                        activeTab === 'cli'
                          ? finding.remediation_snippet.cli
                          : finding.remediation_snippet.terraform,
                        `snip-${finding.id}`
                      )
                    }
                    className="flex items-center gap-1 text-[11px] text-text-muted hover:text-text-primary transition-colors font-mono"
                  >
                    {copiedId === `snip-${finding.id}` ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy snippet</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-[#080B0F] border border-border text-xs font-mono text-emerald-400/90 overflow-x-auto whitespace-pre-wrap select-all">
                  {activeTab === 'cli'
                    ? finding.remediation_snippet.cli
                    : finding.remediation_snippet.terraform}
                </div>
              </div>

              {/* Bottom Card Actions: Resolve, Acknowledge, Inspect */}
              <div className="mt-3.5 pt-3 border-t border-border flex flex-wrap items-center justify-between gap-2">
                <div className="text-[11px] text-text-muted">
                  First seen: {new Date(finding.first_seen).toLocaleDateString()}
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => updateFindingStatus(finding.id, 'acknowledged')}
                    className="text-xs"
                  >
                    Acknowledge
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => updateFindingStatus(finding.id, 'resolved')}
                    className="text-xs text-emerald-400 hover:text-emerald-300"
                  >
                    <CheckCircle className="w-3.5 h-3.5 mr-1" />
                    Mark Resolved
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
