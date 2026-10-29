import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AlertCircle, Table, BarChart2 } from 'lucide-react';
import { MOCK_COST_TREND } from '../../mocks/costTrendData';
import { useFindingsStore } from '../../state/useFindingsStore';

export const CostTrendChart: React.FC = () => {
  const { selectFinding } = useFindingsStore();
  const [showTableFallback, setShowTableFallback] = useState(false);

  const handleAnomalyClick = (findingId?: string) => {
    if (findingId) {
      selectFinding(findingId);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="glass-panel-elevated p-3 rounded-lg border border-border shadow-xl text-xs space-y-1.5">
          <div className="font-bold text-text-primary border-b border-border pb-1">
            {label} Spend Breakdown
          </div>
          <div className="space-y-1">
            <div className="flex justify-between gap-4">
              <span className="text-text-muted">Total Spend:</span>
              <span className="font-mono font-bold text-text-primary">
                ${dataPoint.total_spend.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-sky-400">EC2 Compute:</span>
              <span className="font-mono text-text-secondary">${dataPoint.ec2_spend}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-indigo-400">EBS Volumes:</span>
              <span className="font-mono text-text-secondary">${dataPoint.ebs_spend}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-emerald-400">Potential Savings:</span>
              <span className="font-mono font-bold text-emerald-400">
                -${dataPoint.potential_savings}
              </span>
            </div>
          </div>
          {dataPoint.anomaly && (
            <div className="mt-2 pt-1 border-t border-rose-500/30 text-rose-400 flex items-start gap-1 text-[11px]">
              <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>
                <strong>Cost Spike (+{dataPoint.anomaly.delta_pct}%):</strong> {dataPoint.anomaly.reason} (Click marker to view finding)
              </span>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="glass-panel rounded-2xl border border-border p-5 lg:p-6 shadow-xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-ai-cyan" />
            <h3 className="text-base font-bold text-text-primary">
              12-Month AWS Spend & Anomaly Trajectory
            </h3>
          </div>
          <p className="text-xs text-text-secondary mt-0.5">
            Historical spend with identified waste and automated Cost Explorer spike detection
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Anomaly Callout badge */}
          <button
            onClick={() => handleAnomalyClick('cg-f-016')}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-xs font-medium text-severity-critical hover:bg-rose-500/25 transition-colors cursor-pointer"
            title="Click to view October DynamoDB Spike Finding"
          >
            <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
            <span>Oct Spike Detected (+28.5%)</span>
          </button>

          {/* Accessible Table Fallback toggle */}
          <button
            onClick={() => setShowTableFallback(!showTableFallback)}
            className="p-1.5 rounded-lg bg-surface-elevated border border-border text-text-muted hover:text-text-primary text-xs flex items-center gap-1 transition-colors"
            title="Toggle accessible data table view"
            aria-label="Toggle data table"
          >
            <Table className="w-3.5 h-3.5" />
            <span className="hidden md:inline">{showTableFallback ? 'Chart' : 'Table'}</span>
          </button>
        </div>
      </div>

      {!showTableFallback ? (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={MOCK_COST_TREND} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorEc2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
              <YAxis
                stroke="#64748B"
                fontSize={11}
                tickLine={false}
                tickFormatter={(val) => `$${val}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }}
                formatter={(value) => <span className="text-text-secondary">{value}</span>}
              />
              <Area
                type="monotone"
                dataKey="total_spend"
                name="Total Billed Spend"
                stroke="#8B5CF6"
                strokeWidth={2}
                fillOpacity={0.2}
                fill="#8B5CF6"
              />
              <Area
                type="monotone"
                dataKey="potential_savings"
                name="Identified Waste ($)"
                stroke="#10B981"
                strokeWidth={2}
                fillOpacity={0.3}
                fill="url(#colorSavings)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      ) : (
        /* Accessible Table Fallback */
        <div className="overflow-x-auto max-h-72">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-surface-elevated text-text-muted border-b border-border">
              <tr>
                <th className="p-2">Month</th>
                <th className="p-2">Total Spend</th>
                <th className="p-2">EC2 Compute</th>
                <th className="p-2">EBS Volumes</th>
                <th className="p-2">S3 Storage</th>
                <th className="p-2 text-emerald-400">Potential Savings</th>
                <th className="p-2">Anomaly Flag</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_COST_TREND.map((row) => (
                <tr key={row.month} className="hover:bg-surface-elevated/40">
                  <td className="p-2 font-semibold text-text-primary">{row.month}</td>
                  <td className="p-2">${row.total_spend}</td>
                  <td className="p-2">${row.ec2_spend}</td>
                  <td className="p-2">${row.ebs_spend}</td>
                  <td className="p-2">${row.s3_spend}</td>
                  <td className="p-2 text-emerald-400 font-bold">${row.potential_savings}</td>
                  <td className="p-2">
                    {row.anomaly ? (
                      <button
                        onClick={() => handleAnomalyClick(row.anomaly?.finding_id)}
                        className="text-severity-critical underline cursor-pointer"
                      >
                        +{row.anomaly.delta_pct}% Spike (Inspect)
                      </button>
                    ) : (
                      'Normal'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
