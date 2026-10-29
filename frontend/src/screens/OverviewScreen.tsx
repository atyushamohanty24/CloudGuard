import React from 'react';
import {
  DollarSign,
  ShieldAlert,
  Server,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingDown,
  AlertTriangle,
} from 'lucide-react';
import { PostureHero } from '../components/posture/PostureHero';
import { CostTrendChart } from '../components/charts/CostTrendChart';
import { SavingsWaterfall } from '../components/savings/SavingsWaterfall';
import { FixFirstQueue } from '../components/findings/FixFirstQueue';
import { useFindingsStore } from '../state/useFindingsStore';

export const OverviewScreen: React.FC = () => {
  const { getMetrics, setActiveScreen, setFilters } = useFindingsStore();
  const metrics = getMetrics();

  const handleFilterJump = (category: 'cost' | 'security', severity?: 'critical' | 'high') => {
    setFilters({ category, severity: severity || 'all' });
    setActiveScreen('findings');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* 1. Signature Posture Hero */}
      <PostureHero />

      {/* 2. Key Metrics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div
          onClick={() => handleFilterJump('cost')}
          className="glass-panel p-4 rounded-xl border border-border hover:border-emerald-500/40 cursor-pointer transition-all hover:-translate-y-0.5 group shadow-sm"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Identified Waste</span>
            <DollarSign className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-emerald-400 tabular-nums font-mono mt-1">
            ${Math.round(metrics.total_monthly_waste).toLocaleString()}
            <span className="text-xs font-normal text-text-muted ml-1">/mo</span>
          </div>
          <div className="text-[11px] text-text-muted mt-1 flex items-center justify-between">
            <span>Across 5 services</span>
            <span className="text-emerald-400 flex items-center group-hover:underline">
              View <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Metric 2 */}
        <div
          onClick={() => handleFilterJump('security', 'critical')}
          className="glass-panel p-4 rounded-xl border border-border hover:border-severity-critical/40 cursor-pointer transition-all hover:-translate-y-0.5 group shadow-sm"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Critical Exposures</span>
            <AlertTriangle className="w-4 h-4 text-severity-critical group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-severity-critical tabular-nums font-mono mt-1">
            {metrics.open_critical_count}
          </div>
          <div className="text-[11px] text-text-muted mt-1 flex items-center justify-between">
            <span>Ports 22/3389, MFA, S3</span>
            <span className="text-severity-critical flex items-center group-hover:underline">
              Fix <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Metric 3 */}
        <div
          onClick={() => handleFilterJump('security', 'high')}
          className="glass-panel p-4 rounded-xl border border-border hover:border-severity-high/40 cursor-pointer transition-all hover:-translate-y-0.5 group shadow-sm"
        >
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">High Severity</span>
            <ShieldAlert className="w-4 h-4 text-severity-high group-hover:scale-110 transition-transform" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-severity-high tabular-nums font-mono mt-1">
            {metrics.open_high_count}
          </div>
          <div className="text-[11px] text-text-muted mt-1 flex items-center justify-between">
            <span>Old keys & encryption</span>
            <span className="text-severity-high flex items-center group-hover:underline">
              Review <ArrowRight className="w-3 h-3 ml-0.5" />
            </span>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="glass-panel p-4 rounded-xl border border-border shadow-sm">
          <div className="flex items-center justify-between text-text-muted">
            <span className="text-xs font-semibold uppercase tracking-wider">Resources Scanned</span>
            <Server className="w-4 h-4 text-ai-cyan" />
          </div>
          <div className="text-xl sm:text-2xl font-extrabold text-text-primary tabular-nums font-mono mt-1">
            {metrics.total_resources_scanned}
          </div>
          <div className="text-[11px] text-text-muted mt-1 flex items-center justify-between">
            <span>{metrics.active_regions.length} Active Regions</span>
            <span className="text-emerald-400 font-mono">100% Read-Only</span>
          </div>
        </div>
      </div>

      {/* 3. Cost Trend & Waterfall Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CostTrendChart />
        </div>
        <div className="lg:col-span-1">
          <SavingsWaterfall />
        </div>
      </div>

      {/* 4. Prioritized Fix-First Queue */}
      <FixFirstQueue />
    </div>
  );
};
