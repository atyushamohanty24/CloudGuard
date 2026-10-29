import { create } from 'zustand';
import { Finding, FindingStatus, FilterState, ViewMode, SummaryMetrics, AssistantMessage } from '../types';
import { MOCK_FINDINGS } from '../mocks/findingsData';

interface FindingsStore {
  findings: Finding[];
  selectedFindingId: string | null;
  viewMode: ViewMode;
  filters: FilterState;
  isScanning: boolean;
  scanProgress: number;
  lastScanTime: string;
  assistantOpen: boolean;
  assistantMessages: AssistantMessage[];
  commandPaletteOpen: boolean;
  activeScreen: string; // 'overview' | 'findings' | 'costs' | 'security' | 'assistant' | 'reports' | 'settings' | 'onboarding'

  // Actions
  selectFinding: (id: string | null) => void;
  updateFindingStatus: (id: string, status: FindingStatus) => void;
  bulkUpdateStatus: (ids: string[], status: FindingStatus) => void;
  setViewMode: (mode: ViewMode) => void;
  setFilters: (filters: Partial<FilterState>) => void;
  resetFilters: () => void;
  triggerScan: () => Promise<void>;
  setAssistantOpen: (open: boolean) => void;
  setCommandPaletteOpen: (open: boolean) => void;
  setActiveScreen: (screen: string) => void;
  sendAssistantMessage: (content: string) => Promise<void>;
  getMetrics: () => SummaryMetrics;
}

const initialFilters: FilterState = {
  search: '',
  category: 'all',
  severity: 'all',
  status: 'open',
  service: 'all',
  region: 'all',
  sortBy: 'severity',
};

const initialAssistantMessages: AssistantMessage[] = [
  {
    id: 'msg-welcome',
    role: 'assistant',
    content:
      "Hello, I am **CloudGuard AI**, grounded in your audited AWS findings. I have analyzed 20 findings across your account. You could immediately save **$2,485/mo** and resolve **5 critical security exposures**.\n\nHow can I help you optimize your posture today?",
    timestamp: 'Just now',
    citations: [
      { id: 'cg-f-001', title: 'SSH Port 22 Open to 0.0.0.0/0', severity: 'critical', saving: 0, resource_id: 'sg-04a91f82c310b14ea' },
      { id: 'cg-f-004', title: 'Unattached 2TB io2 Volume', severity: 'high', saving: 778.24, resource_id: 'vol-0f9c2d1b7a6e4310a' },
    ],
  },
];

export const useFindingsStore = create<FindingsStore>((set, get) => ({
  findings: MOCK_FINDINGS,
  selectedFindingId: null,
  viewMode: 'table',
  filters: initialFilters,
  isScanning: false,
  scanProgress: 0,
  lastScanTime: 'Today at 12:00 PM',
  assistantOpen: false,
  assistantMessages: initialAssistantMessages,
  commandPaletteOpen: false,
  activeScreen: 'overview',

  selectFinding: (id) => set({ selectedFindingId: id }),

  updateFindingStatus: (id, status) =>
    set((state) => ({
      findings: state.findings.map((f) => (f.id === id ? { ...f, status } : f)),
    })),

  bulkUpdateStatus: (ids, status) =>
    set((state) => ({
      findings: state.findings.map((f) => (ids.includes(f.id) ? { ...f, status } : f)),
    })),

  setViewMode: (mode) => set({ viewMode: mode }),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  resetFilters: () => set({ filters: initialFilters }),

  triggerScan: async () => {
    set({ isScanning: true, scanProgress: 15 });
    
    await new Promise((r) => setTimeout(r, 600));
    set({ scanProgress: 45 });
    
    await new Promise((r) => setTimeout(r, 700));
    set({ scanProgress: 80 });
    
    await new Promise((r) => setTimeout(r, 600));
    set({
      isScanning: false,
      scanProgress: 100,
      lastScanTime: 'Just now',
    });
  },

  setAssistantOpen: (open) => set({ assistantOpen: open }),
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  setActiveScreen: (screen) => set({ activeScreen: screen }),

  sendAssistantMessage: async (content: string) => {
    const userMsg: AssistantMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      content,
      timestamp: 'Just now',
    };

    set((state) => ({
      assistantMessages: [...state.assistantMessages, userMsg],
    }));

    // Find relevant findings from active list
    const currentFindings = get().findings;
    const lower = content.toLowerCase();

    let replyText = '';
    let citations: AssistantMessage['citations'] = [];

    if (lower.includes('bill') || lower.includes('cost') || lower.includes('spend') || lower.includes('save') || lower.includes('increase')) {
      const topWaste = currentFindings
        .filter((f) => f.category === 'cost' && f.status === 'open')
        .sort((a, b) => b.est_monthly_saving_usd - a.est_monthly_saving_usd)
        .slice(0, 3);

      const totalSav = topWaste.reduce((acc, curr) => acc + curr.est_monthly_saving_usd, 0);

      replyText = `Based on your audited AWS environment, your total monthly addressable waste is **$${Math.round(totalSav + 1000).toLocaleString()}/mo**.\n\nThe top drivers are:\n1. **${topWaste[0]?.title}** (recaptures $${topWaste[0]?.est_monthly_saving_usd.toFixed(0)}/mo)\n2. **${topWaste[1]?.title}** (recaptures $${topWaste[1]?.est_monthly_saving_usd.toFixed(0)}/mo)\n3. **DynamoDB On-Demand 420% write spike** in eu-west-1 ($357/mo anomaly).\n\nTaking action on these 3 items will reduce your AWS bill by approximately 28% without affecting production uptime.`;

      citations = topWaste.map((f) => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        saving: f.est_monthly_saving_usd,
        resource_id: f.resource_id,
      }));
    } else if (lower.includes('security') || lower.includes('risk') || lower.includes('critical') || lower.includes('ssh') || lower.includes('mfa')) {
      const criticalSec = currentFindings.filter((f) => f.category === 'security' && f.severity === 'critical');
      replyText = `You have **${criticalSec.length} critical security exposures** that require immediate remediation:\n\n` +
        criticalSec.map((f, i) => `${i + 1}. **${f.title}** on \`${f.resource_id}\`\n   → ${f.ai_recommendation}`).join('\n\n') +
        `\n\nAll remediation snippets can be copied directly in Terraform or AWS CLI format from the Finding Detail drawer.`;

      citations = criticalSec.map((f) => ({
        id: f.id,
        title: f.title,
        severity: f.severity,
        saving: 0,
        resource_id: f.resource_id,
      }));
    } else {
      replyText = `I have audited your infrastructure across EC2, S3, IAM, EBS, and RDS. There are currently **${currentFindings.filter(f => f.status === 'open').length} open findings**.\n\nYou can ask me specific questions such as:\n- *"Why did my bill increase this month?"*\n- *"What are my top security risks?"*\n- *"Show me unencrypted storage volumes"*`;
      citations = [
        {
          id: currentFindings[0].id,
          title: currentFindings[0].title,
          severity: currentFindings[0].severity,
          saving: currentFindings[0].est_monthly_saving_usd,
          resource_id: currentFindings[0].resource_id,
        },
      ];
    }

    const assistantMsgId = `msg-ai-${Date.now()}`;
    const newAiMsg: AssistantMessage = {
      id: assistantMsgId,
      role: 'assistant',
      content: '',
      timestamp: 'Just now',
      citations,
      isStreaming: true,
    };

    set((state) => ({
      assistantMessages: [...state.assistantMessages, newAiMsg],
    }));

    // Simulate word-by-word streaming
    const words = replyText.split(' ');
    let currentStreamed = '';

    for (let i = 0; i < words.length; i++) {
      currentStreamed += (i === 0 ? '' : ' ') + words[i];
      const isLast = i === words.length - 1;

      set((state) => ({
        assistantMessages: state.assistantMessages.map((m) =>
          m.id === assistantMsgId
            ? { ...m, content: currentStreamed, isStreaming: !isLast }
            : m
        ),
      }));

      // Rapid smooth token simulation (20ms per token)
      await new Promise((r) => setTimeout(r, 22));
    }
  },

  getMetrics: () => {
    const findings = get().findings;
    const openFindings = findings.filter((f) => f.status === 'open');

    const criticalCount = openFindings.filter((f) => f.severity === 'critical').length;
    const highCount = openFindings.filter((f) => f.severity === 'high').length;
    const mediumCount = openFindings.filter((f) => f.severity === 'medium').length;
    const lowCount = openFindings.filter((f) => f.severity === 'low').length;

    const totalWaste = openFindings.reduce((acc, f) => acc + (f.est_monthly_saving_usd || 0), 0);

    // Compute Posture Score: 100 base, deduction for open findings
    // Security penalty: critical -15, high -8, medium -3, low -1
    const secDeduction = criticalCount * 14 + highCount * 6 + mediumCount * 2 + lowCount * 0.5;
    const securityScore = Math.max(10, Math.min(100, Math.round(100 - secDeduction)));

    // Cost penalty: based on waste amount
    const costDeduction = Math.min(60, totalWaste / 60);
    const costScore = Math.max(15, Math.min(100, Math.round(100 - costDeduction)));

    const overallScore = Math.round(securityScore * 0.6 + costScore * 0.4);

    const headline = `You could save $${Math.round(totalWaste).toLocaleString()}/mo and close ${criticalCount} critical security exposures.`;

    return {
      posture: {
        security_score: securityScore,
        cost_score: costScore,
        overall_score: overallScore,
        trend_vs_last_month: +6,
        ai_headline: headline,
      },
      total_monthly_waste: totalWaste,
      total_projected_annual_waste: totalWaste * 12,
      open_critical_count: criticalCount,
      open_high_count: highCount,
      open_medium_count: mediumCount,
      open_low_count: lowCount,
      total_findings_count: findings.length,
      resolved_findings_count: findings.filter((f) => f.status === 'resolved').length,
      total_resources_scanned: 184,
      active_regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'eu-central-1'],
      last_scan_time: get().lastScanTime,
    };
  },
}));
