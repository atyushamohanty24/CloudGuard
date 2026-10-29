import React, { useState } from 'react';
import {
  Search,
  Filter,
  LayoutGrid,
  List,
  CheckCircle2,
  Clock,
  Sparkles,
  ExternalLink,
  RotateCcw,
  AlertCircle,
  Copy,
  Check,
  Tag,
} from 'lucide-react';
import { useFindingsStore } from '../state/useFindingsStore';
import { SeverityBadge, StatusBadge, Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Finding, FindingStatus, Severity, Category } from '../types';

export const FindingsScreen: React.FC = () => {
  const {
    findings,
    viewMode,
    setViewMode,
    filters,
    setFilters,
    resetFilters,
    selectFinding,
    bulkUpdateStatus,
    updateFindingStatus,
  } = useFindingsStore();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter & sort logic
  const filteredFindings = findings
    .filter((f) => {
      if (filters.category !== 'all' && f.category !== filters.category) return false;
      if (filters.severity !== 'all' && f.severity !== filters.severity) return false;
      if (filters.status !== 'all' && f.status !== filters.status) return false;
      if (filters.service !== 'all' && f.service !== filters.service) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchesTitle = f.title.toLowerCase().includes(query);
        const matchesResource = f.resource_id.toLowerCase().includes(query);
        const matchesRec = f.ai_recommendation.toLowerCase().includes(query);
        if (!matchesTitle && !matchesResource && !matchesRec) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (filters.sortBy === 'savings') {
        return (b.est_monthly_saving_usd || 0) - (a.est_monthly_saving_usd || 0);
      }
      if (filters.sortBy === 'recent') {
        return new Date(b.first_seen).getTime() - new Date(a.first_seen).getTime();
      }
      // default: severity weight
      const weight: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
      return (weight[b.severity] || 0) - (weight[a.severity] || 0);
    });

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedIds(filteredFindings.map((f) => f.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleBulkStatus = (status: FindingStatus) => {
    bulkUpdateStatus(selectedIds, status);
    setSelectedIds([]);
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const uniqueServices = Array.from(new Set(findings.map((f) => f.service)));

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* 1. Filter & Action Control Bar */}
      <div className="glass-panel p-4 rounded-xl border border-border space-y-4 shadow-md">
        {/* Top row: Search input & View Mode Toggle */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Filter by title, resource ID, or Bedrock recommendation..."
              value={filters.search}
              onChange={(e) => setFilters({ search: e.target.value })}
              className="w-full bg-surface-elevated border border-border rounded-lg pl-9 pr-4 py-2 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:border-ai-violet transition-colors"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 rounded-lg bg-surface-elevated border border-border">
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'table'
                    ? 'bg-surface text-text-primary shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Table view"
              >
                <List className="w-4 h-4" />
                <span className="hidden sm:inline">Table</span>
              </button>
              <button
                onClick={() => setViewMode('kanban')}
                className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  viewMode === 'kanban'
                    ? 'bg-surface text-text-primary shadow-sm font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
                title="Kanban Board"
              >
                <LayoutGrid className="w-4 h-4" />
                <span className="hidden sm:inline">Kanban</span>
              </button>
            </div>

            {/* Reset Filters button */}
            <button
              onClick={resetFilters}
              className="p-2 rounded-lg bg-surface-elevated border border-border text-text-muted hover:text-text-primary transition-colors text-xs flex items-center gap-1"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Faceted Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-subtle text-xs">
          {/* Category Filter */}
          <div className="flex items-center gap-1">
            <span className="text-text-muted text-[11px] font-medium mr-1">Category:</span>
            {(['all', 'cost', 'security'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFilters({ category: cat })}
                className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                  filters.category === cat
                    ? 'bg-surface-elevated text-text-primary border border-border font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-border hidden sm:block" />

          {/* Severity Filter */}
          <div className="flex items-center gap-1">
            <span className="text-text-muted text-[11px] font-medium mr-1">Severity:</span>
            {(['all', 'critical', 'high', 'medium', 'low'] as const).map((sev) => (
              <button
                key={sev}
                onClick={() => setFilters({ severity: sev })}
                className={`px-2 py-0.5 rounded-md capitalize font-medium transition-colors ${
                  filters.severity === sev
                    ? 'bg-surface-elevated text-text-primary border border-border font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-border hidden sm:block" />

          {/* Status Filter */}
          <div className="flex items-center gap-1">
            <span className="text-text-muted text-[11px] font-medium mr-1">Status:</span>
            {(['all', 'open', 'acknowledged', 'resolved'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setFilters({ status: st })}
                className={`px-2 py-0.5 rounded-md capitalize font-medium transition-colors ${
                  filters.status === st
                    ? 'bg-surface-elevated text-text-primary border border-border font-semibold'
                    : 'text-text-muted hover:text-text-primary'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="w-px h-4 bg-border hidden sm:block" />

          {/* Service Dropdown */}
          <div className="flex items-center gap-1">
            <span className="text-text-muted text-[11px] font-medium mr-1">Service:</span>
            <select
              value={filters.service}
              onChange={(e) => setFilters({ service: e.target.value })}
              className="bg-surface-elevated border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
            >
              <option value="all">All Services</option>
              {uniqueServices.map((svc) => (
                <option key={svc} value={svc}>
                  {svc}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By */}
          <div className="flex items-center gap-1 ml-auto">
            <span className="text-text-muted text-[11px] font-medium mr-1">Sort:</span>
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters({ sortBy: e.target.value as any })}
              className="bg-surface-elevated border border-border rounded px-2 py-1 text-xs text-text-primary focus:outline-none"
            >
              <option value="severity">Highest Severity</option>
              <option value="savings">Highest Savings ($)</option>
              <option value="recent">Recently Detected</option>
            </select>
          </div>
        </div>

        {/* Bulk Action Banner (when items selected) */}
        {selectedIds.length > 0 && (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-ai-violet/10 border border-ai-violet/25 text-xs animate-in fade-in">
            <span className="font-semibold text-purple-300">
              {selectedIds.length} findings selected
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBulkStatus('acknowledged')}
                className="text-xs"
              >
                Acknowledge
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleBulkStatus('resolved')}
                className="text-xs text-emerald-400"
              >
                Mark Resolved
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedIds([])}
                className="text-xs"
              >
                Deselect
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Findings List: Table or Kanban */}
      {filteredFindings.length === 0 ? (
        /* Empty State */
        <div className="glass-panel p-12 rounded-2xl border border-border text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-surface-elevated border border-border flex items-center justify-center mx-auto text-text-muted">
            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-text-primary">No Matching Findings</h4>
            <p className="text-xs text-text-secondary max-w-sm mx-auto">
              No cloud findings match your current filters. Try resetting the filters or checking another domain.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            Reset All Filters
          </Button>
        </div>
      ) : viewMode === 'table' ? (
        /* Table View */
        <div className="glass-panel rounded-2xl border border-border overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/70 text-text-muted border-b border-border uppercase font-mono tracking-wider text-[10px]">
                <tr>
                  <th className="p-3 w-8">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.length === filteredFindings.length &&
                        filteredFindings.length > 0
                      }
                      onChange={handleSelectAll}
                      className="rounded border-border text-ai-violet focus:ring-ai-violet"
                    />
                  </th>
                  <th className="p-3">Severity & Category</th>
                  <th className="p-3">Finding Title & Resource</th>
                  <th className="p-3">Service & Region</th>
                  <th className="p-3">Est. Savings</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredFindings.map((finding) => (
                  <tr
                    key={finding.id}
                    onClick={() => selectFinding(finding.id)}
                    className="hover:bg-surface-elevated/50 cursor-pointer transition-colors group"
                  >
                    <td className="p-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(finding.id)}
                        onChange={() => handleToggleSelect(finding.id)}
                        className="rounded border-border text-ai-violet focus:ring-ai-violet"
                      />
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5">
                        <SeverityBadge severity={finding.severity} size="sm" />
                        <Badge
                          variant={finding.category === 'cost' ? 'savings' : 'neutral'}
                          size="sm"
                        >
                          {finding.category}
                        </Badge>
                      </div>
                    </td>
                    <td className="p-3 max-w-md">
                      <div className="font-semibold text-text-primary group-hover:text-ai-cyan transition-colors truncate">
                        {finding.title}
                      </div>
                      <div className="font-mono text-[11px] text-text-muted truncate mt-0.5">
                        {finding.resource_id}
                      </div>
                    </td>
                    <td className="p-3 font-mono text-text-secondary whitespace-nowrap">
                      {finding.service} · {finding.region}
                    </td>
                    <td className="p-3 font-mono whitespace-nowrap">
                      {finding.est_monthly_saving_usd > 0 ? (
                        <span className="font-bold text-emerald-400">
                          +${finding.est_monthly_saving_usd.toFixed(0)}/mo
                        </span>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <StatusBadge status={finding.status} size="sm" />
                    </td>
                    <td className="p-3 text-right" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => selectFinding(finding.id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-elevated transition-colors inline-flex items-center gap-1 text-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Kanban Board View */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {(['open', 'acknowledged', 'resolved'] as const).map((colStatus) => {
            const colFindings = filteredFindings.filter((f) => f.status === colStatus);
            return (
              <div
                key={colStatus}
                className="glass-panel rounded-2xl border border-border p-4 flex flex-col space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={colStatus} size="sm" />
                    <span className="text-xs font-mono font-bold text-text-muted">
                      ({colFindings.length})
                    </span>
                  </div>
                </div>

                <div className="space-y-3 overflow-y-auto max-h-[600px] pr-1">
                  {colFindings.length === 0 ? (
                    <div className="p-6 text-center text-xs text-text-muted italic">
                      No {colStatus} findings
                    </div>
                  ) : (
                    colFindings.map((finding) => (
                      <div
                        key={finding.id}
                        onClick={() => selectFinding(finding.id)}
                        className="glass-panel-elevated p-3.5 rounded-xl border border-border hover:border-border-highlight cursor-pointer transition-all hover:-translate-y-0.5 space-y-2.5 shadow-sm"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <SeverityBadge severity={finding.severity} size="sm" />
                          {finding.est_monthly_saving_usd > 0 && (
                            <span className="text-xs font-mono font-bold text-emerald-400">
                              +${finding.est_monthly_saving_usd.toFixed(0)}/mo
                            </span>
                          )}
                        </div>

                        <h5 className="text-xs font-bold text-text-primary line-clamp-2">
                          {finding.title}
                        </h5>

                        <div className="text-[11px] font-mono text-text-muted truncate">
                          {finding.resource_id}
                        </div>

                        <div className="pt-2 border-t border-border-subtle flex items-center justify-between text-[11px] text-text-muted">
                          <span>{finding.service}</span>
                          <span className="text-ai-cyan hover:underline">Inspect →</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
