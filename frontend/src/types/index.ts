export type Category = 'cost' | 'security';
export type Severity = 'critical' | 'high' | 'medium' | 'low';
export type FindingStatus = 'open' | 'acknowledged' | 'resolved';

export interface RemediationSnippet {
  cli: string;
  terraform: string;
  consoleUrl?: string;
}

export interface Finding {
  id: string;
  category: Category;
  severity: Severity;
  title: string;
  resource_id: string;
  resource_type: string;
  region: string;
  evidence: Record<string, any>;
  est_monthly_saving_usd: number;
  status: FindingStatus;
  first_seen: string;
  last_seen: string;
  ai_recommendation: string; // <= 60 words
  remediation_snippet: RemediationSnippet;
  service: string; // e.g. EC2, EBS, S3, IAM, RDS
}

export interface CostAnomaly {
  detected: boolean;
  delta_pct: number;
  finding_id?: string;
  reason?: string;
}

export interface CostDataPoint {
  month: string; // e.g. "Nov 25", "Dec 25"
  total_spend: number;
  ec2_spend: number;
  ebs_spend: number;
  s3_spend: number;
  rds_spend: number;
  other_spend: number;
  potential_savings: number;
  anomaly?: CostAnomaly;
}

export interface PostureScoreBreakdown {
  security_score: number; // 0 - 100
  cost_score: number;     // 0 - 100
  overall_score: number;  // 0 - 100
  trend_vs_last_month: number; // e.g. +4
  ai_headline: string;
}

export interface SummaryMetrics {
  posture: PostureScoreBreakdown;
  total_monthly_waste: number;
  total_projected_annual_waste: number;
  open_critical_count: number;
  open_high_count: number;
  open_medium_count: number;
  open_low_count: number;
  total_findings_count: number;
  resolved_findings_count: number;
  total_resources_scanned: number;
  active_regions: string[];
  last_scan_time: string;
}

export interface AssistantCitation {
  id: string;
  title: string;
  severity: Severity;
  saving: number;
  resource_id: string;
}

export interface AssistantMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: AssistantCitation[];
  isStreaming?: boolean;
}

export type ViewMode = 'table' | 'kanban';

export interface FilterState {
  search: string;
  category: 'all' | Category;
  severity: 'all' | Severity;
  status: 'all' | FindingStatus;
  service: 'all' | string;
  region: 'all' | string;
  sortBy: 'severity' | 'savings' | 'recent';
}
