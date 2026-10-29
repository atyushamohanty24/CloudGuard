import React from 'react';
import {
  ShieldAlert,
  Lock,
  Key,
  Globe,
  HardDrive,
  Database,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
} from 'lucide-react';
import { useFindingsStore } from '../state/useFindingsStore';
import { SeverityBadge, Badge } from '../components/ui/Badge';

export const SecurityScreen: React.FC = () => {
  const { findings, selectFinding, getMetrics } = useFindingsStore();
  const metrics = getMetrics();

  const secFindings = findings.filter((f) => f.category === 'security' && f.status === 'open');

  const checkMatrix = [
    {
      title: 'Security Groups: Open Ports 22 / 3389',
      status: 'failed',
      count: 2,
      severity: 'critical',
      description: 'Ingress from 0.0.0.0/0 detected on bastion & staging fleets',
      icon: Globe,
    },
    {
      title: 'S3 Buckets: Public Access Exposure',
      status: 'failed',
      count: 1,
      severity: 'critical',
      description: 'corp-analytics-lake-backups-prod grants world READ access',
      icon: Globe,
    },
    {
      title: 'IAM: Admin Users Without Multi-Factor Auth',
      status: 'failed',
      count: 1,
      severity: 'critical',
      description: 'devops-lead admin user active without MFA token',
      icon: Key,
    },
    {
      title: 'IAM: Unrotated Access Keys (> 90 Days)',
      status: 'failed',
      count: 2,
      severity: 'high',
      description: 'CI/CD pipeline keys and root keys exceed rotation age',
      icon: Key,
    },
    {
      title: 'EBS Storage: Unencrypted Volumes at Rest',
      status: 'failed',
      count: 1,
      severity: 'high',
      description: 'Database log volume vol-0a1122 lacking AWS KMS encryption',
      icon: HardDrive,
    },
    {
      title: 'RDS: Publicly Accessible Database Endpoints',
      status: 'failed',
      count: 1,
      severity: 'critical',
      description: 'Postgres reporting instance exposed to internet on port 5432',
      icon: Database,
    },
    {
      title: 'AWS CloudTrail: Audit Log Integrity',
      status: 'passed',
      count: 0,
      severity: 'low',
      description: 'Multi-region CloudTrail enabled with KMS log file validation',
      icon: ShieldAlert,
    },
    {
      title: 'VPC Default Security Groups: Ingress Restricted',
      status: 'passed',
      count: 0,
      severity: 'low',
      description: 'Default security groups restricted across audited regions',
      icon: Lock,
    },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-border flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <Lock className="w-4 h-4 text-severity-critical" />
            <span>Cloud Attack Surface Assessment</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold text-text-primary font-mono tabular-nums">
            {metrics.posture.security_score}
            <span className="text-sm font-normal text-text-muted ml-1">/ 100 Posture Score</span>
          </div>
          <p className="text-xs text-text-secondary">
            {metrics.open_critical_count} critical exposures currently open to the Internet. Remediating these brings posture to 94/100.
          </p>
        </div>

        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="p-3 rounded-xl bg-surface-elevated border border-border text-center">
            <span className="text-[10px] text-text-muted block">OPEN PORTS</span>
            <span className="font-bold text-severity-critical">2 SGs Open</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border text-center">
            <span className="text-[10px] text-text-muted block">IAM RISKS</span>
            <span className="font-bold text-severity-high">3 Users/Keys</span>
          </div>
          <div className="p-3 rounded-xl bg-surface-elevated border border-border text-center">
            <span className="text-[10px] text-text-muted block">PUBLIC STORAGE</span>
            <span className="font-bold text-severity-critical">1 Bucket</span>
          </div>
        </div>
      </div>

      {/* Security Check Matrix */}
      <div className="glass-panel rounded-2xl border border-border p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Security Posture Check Catalog (8 Rules Evaluated)
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Continuous read-only evaluation of CIS AWS Foundations Benchmarks and AWS Well-Architected Security Pillar.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {checkMatrix.map((chk, i) => {
            const Icon = chk.icon;
            const isFailed = chk.status === 'failed';

            return (
              <div
                key={i}
                className={`p-4 rounded-xl border transition-all ${
                  isFailed
                    ? 'bg-surface-elevated/80 border-border hover:border-severity-critical/40'
                    : 'bg-surface-subtle/50 border-border-subtle opacity-80'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        isFailed ? 'bg-rose-500/10 text-rose-400' : 'bg-emerald-500/10 text-emerald-400'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-text-primary">{chk.title}</div>
                      <div className="text-[11px] text-text-muted mt-0.5">{chk.description}</div>
                    </div>
                  </div>

                  {isFailed ? (
                    <SeverityBadge severity={chk.severity as any} size="sm" />
                  ) : (
                    <Badge variant="resolved" size="sm">
                      Passed
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Open Security Findings List */}
      <div className="glass-panel rounded-2xl border border-border p-6 shadow-xl space-y-4">
        <div>
          <h3 className="text-base font-bold text-text-primary">
            Active Security Misconfigurations ({secFindings.length})
          </h3>
          <p className="text-xs text-text-secondary mt-0.5">
            Prioritized by internet exposability and credential blast radius.
          </p>
        </div>

        <div className="divide-y divide-border">
          {secFindings.map((finding) => (
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

              <div className="flex items-center gap-3 shrink-0 font-mono text-right">
                <span className="text-xs text-ai-cyan hover:underline">View Remediation →</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
