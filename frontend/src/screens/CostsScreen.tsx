import React from 'react';
import { DollarSign, TrendingDown, AlertCircle, HardDrive, Server, Layers, Cloud } from 'lucide-react';
import { CostTrendChart } from '../components/charts/CostTrendChart';
import { SavingsWaterfall } from '../components/savings/SavingsWaterfall';
import { useFindingsStore } from '../state/useFindingsStore';
import { SeverityBadge } from '../components/ui/Badge';

export const CostsScreen: React.FC = () => {
  const { findings, selectFinding } = useFindingsStore();
  const costFindings = findings.filter((f) => f.category === 'cost' && f.status === 'open');

  const totalWaste = costFindings.reduce((acc, f) => acc + (f.est_monthly_saving_usd || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner KPI */}
      <div className="glass-panel p-6 rounded-2xl border border-border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span>Total Recapturable Cloud Spend</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tabular-nums">
            ${Math.round(totalWaste).toLocaleString()}
            <span className="text-sm font-normal text-text-muted ml-1">/ month</span>
          </div>
          <p className="text-xs text-text-secondary">
            Projected annual reduction of ${Math.round(totalWaste * 12).toLocaleString()} without decreasing infrastructure capacity.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-surface-elevated border border-border text-center">
            <span className="text-[10px] text-text-muted block">IDLE COMPUTE</span>
            <span className="font-bold text-text-primary">$550/mo</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border text-center">
            <span className="text-[10px] text-text-muted block">UNATTACHED EBS</span>
            <span className="font-bold text-text-primary">$984/mo</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border text-center">
            <span className="text-[10px] text-text-muted block">ANOMALIES</span>
            <span className="font-bold text-rose-400">$357/mo</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CostTrendChart />
        </div>
        <div className="lg:col-span-1">
          <SavingsWaterfall />
        </div>
      </div>

      {/* Identified Cost Waste Items */}
      <div className="glass-panel rounded-2xl border border-border p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Active Cost Optimization Opportunities ({costFindings.length})
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Click any opportunity to view the Bedrock right-sizing recommendation and copy remediation scripts.
          </p>
        </div>

        <div className="divide-y divide-border">
          {costFindings.map((finding) => (
            <div
              key={finding.id}
              onClick={() => selectFinding(finding.id)}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-elevated/40 p-2 rounded-lg cursor-pointer transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={finding.severity} size="sm" />
                  <span className="text-xs font-bold text-text-primary">{finding.title}</span>
                </div>
                <div className="text-[11px] font-mono text-text-muted">
                  {finding.resource_id} · {finding.service} ({finding.region})
                </div>
              </div>

              <div className="flex items-center gap-4 shrink-0 font-mono text-right">
                <div className="text-emerald-400 font-bold text-sm">
                  +${finding.est_monthly_saving_usd.toFixed(0)}/mo
                </div>
                <span className="text-xs text-ai-cyan hover:underline">Inspect →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
