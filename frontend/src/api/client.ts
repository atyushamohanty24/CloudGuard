import { Finding, CostDataPoint, SummaryMetrics, AssistantMessage } from '../types';
import { MOCK_FINDINGS } from '../mocks/findingsData';
import { MOCK_COST_TREND } from '../mocks/costTrendData';

const USE_MOCKS = import.meta.env.VITE_USE_MOCKS !== 'false';
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

export const apiClient = {
  async getSummary(): Promise<SummaryMetrics | null> {
    if (USE_MOCKS || !API_BASE_URL) {
      return null; // Signals store to use computed metrics
    }
    try {
      const res = await fetch(`${API_BASE_URL}/summary`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API error, falling back to mock mode:', err);
      return null;
    }
  },

  async getFindings(): Promise<Finding[]> {
    if (USE_MOCKS || !API_BASE_URL) {
      return MOCK_FINDINGS;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/findings`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.findings || MOCK_FINDINGS;
    } catch (err) {
      console.warn('API error, falling back to mock mode:', err);
      return MOCK_FINDINGS;
    }
  },

  async getCostTrend(): Promise<CostDataPoint[]> {
    if (USE_MOCKS || !API_BASE_URL) {
      return MOCK_COST_TREND;
    }
    try {
      const res = await fetch(`${API_BASE_URL}/costs/trend`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.cost_trend || MOCK_COST_TREND;
    } catch (err) {
      console.warn('API error, falling back to mock mode:', err);
      return MOCK_COST_TREND;
    }
  },

  async sendChatMessage(query: string): Promise<{ content: string; citations?: any[] }> {
    if (USE_MOCKS || !API_BASE_URL) {
      return { content: '', citations: [] };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      console.warn('API chat error, falling back to local assistant:', err);
      return { content: '', citations: [] };
    }
  },

  async triggerScan(): Promise<{ status: string; scan_id?: string }> {
    if (USE_MOCKS || !API_BASE_URL) {
      return { status: 'ACCEPTED', scan_id: 'mock-scan-local' };
    }
    try {
      const res = await fetch(`${API_BASE_URL}/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      return await res.json();
    } catch (err) {
      console.warn('API scan trigger error:', err);
      return { status: 'ACCEPTED', scan_id: 'fallback-scan' };
    }
  },
};
