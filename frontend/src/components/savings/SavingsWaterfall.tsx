import React from 'react';
import { DollarSign, Layers, ArrowUpRight, HardDrive, Server, Database, Cloud } from 'lucide-react';
import { useFindingsStore } from '../../state/useFindingsStore';

export const SavingsWaterfall: React.FC = () => {
  const { setFilters, setActiveScreen } = useFindingsStore();

  const categories = [
    { service: 'EBS', label: 'EBS (Unattached & Snapshots)', saving: 984.24, icon: HardDrive, color: '#38BDF8' },
    { service: 'EC2', label: 'EC2 (Idle Compute & EIPs)', saving: 550.28, icon: Server, color: '#818CF8' },
    { service: 'DynamoDB', label: 'DynamoDB (Provisioned Spike)', saving: 357.0, icon: Database, color: '#F472B6' },
    { service: 'RDS', label: 'RDS (Dev Multi-AZ Downgrade)', saving: 316.0, icon: Layers, color: '#FBBF24' },
    { service: 'S3', label: 'S3 (Non-Current Versioning)', saving: 285.2, icon: Cloud, color: '#34D399' },
  ];

  const total = categories.reduce((acc, c) => acc + c.saving, 0);

  const handleFilterClick = (service: string) => {
    setFilters({ category: 'cost', service });
    setActiveScreen('findings');
  };

  return (
    <div className="glass-panel rounded-2xl border border-border p-5 lg:p-6 shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-text-primary">
              Savings Waterfall by AWS Domain
            </h3>
          </div>
          <span className="text-xs font-mono font-semibold text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30">
            ${Math.round(total).toLocaleString()}/mo Identified
          </span>
        </div>

        {/* Stacked Proportional Bar */}
        <div className="w-full h-3 rounded-full overflow-hidden flex bg-surface-elevated mb-5">
          {categories.map((c) => {
            const pct = (c.saving / total) * 100;
            return (
              <div
                key={c.service}
                style={{ width: `${pct}%`, backgroundColor: c.color }}
                className="h-full transition-all duration-300 hover:opacity-80"
                title={`${c.label}: $${c.saving}/mo (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Category List */}
        <div className="space-y-2.5">
          {categories.map((c) => {
            const Icon = c.icon;
            const pct = Math.round((c.saving / total) * 100);
            return (
              <button
                key={c.service}
                onClick={() => handleFilterClick(c.service)}
                className="w-full flex items-center justify-between p-2.5 rounded-lg bg-surface-elevated/60 hover:bg-surface-elevated border border-border-subtle hover:border-border transition-all text-left group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: c.color }}
                  />
                  <Icon className="w-4 h-4 text-text-muted group-hover:text-text-primary" />
                  <span className="text-xs font-medium text-text-primary">
                    {c.label}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-400">
                    ${c.saving.toFixed(0)}/mo
                  </span>
                  <span className="text-[10px] text-text-muted font-mono">
                    ({pct}%)
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-text-muted group-hover:text-text-primary transition-colors" />
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-[11px] text-text-muted">
        <span>Click any category to filter the Findings Queue</span>
        <span className="font-mono">5 AWS Services</span>
      </div>
    </div>
  );
};
