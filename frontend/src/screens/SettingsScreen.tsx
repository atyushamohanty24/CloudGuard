import React, { useState } from 'react';
import {
  Settings,
  Clock,
  Sparkles,
  Shield,
  Bell,
  Cpu,
  CheckCircle2,
  Lock,
  Layers,
  Save,
} from 'lucide-react';
import { Button } from '../components/ui/Button';

export const SettingsScreen: React.FC = () => {
  const [schedule, setSchedule] = useState('daily');
  const [model, setModel] = useState('anthropic.claude-3-5-sonnet-20241022-v2:0');
  const [digestEmail, setDigestEmail] = useState('cloud-sec-team@example.com');
  const [useMocks, setUseMocks] = useState(true);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-4xl">
      {/* Read-Only Safeguard Banner */}
      <div className="glass-panel p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-bold text-text-primary">
              Strict Read-Only Enforcement: ACTIVE
            </div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              IAM collector execution roles have zero Mutating permissions. All remediations are display-only blueprints.
            </div>
          </div>
        </div>
        <span className="text-[11px] font-mono text-emerald-400 font-bold px-2.5 py-1 bg-emerald-500/10 rounded-md border border-emerald-500/20">
          Enforced
        </span>
      </div>

      {/* Audit Scanning Schedule */}
      <div className="glass-panel rounded-2xl border border-border p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-ai-cyan" />
          <h3 className="text-base font-bold text-text-primary">
            EventBridge Continuous Audit Schedule
          </h3>
        </div>
        <p className="text-xs text-text-secondary">
          Controls how frequently Lambda collectors trigger CloudWatch metric evaluations and resource discovery.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {[
            { id: 'hourly', label: 'Every Hour', desc: 'Real-time drift tracking' },
            { id: '6h', label: 'Every 6 Hours', desc: 'Balanced discovery' },
            { id: 'daily', label: 'Daily (Default)', desc: 'Optimal for cost quotas' },
            { id: 'weekly', label: 'Weekly', desc: 'Minimal API usage' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSchedule(item.id)}
              className={`p-3.5 rounded-xl border text-left transition-all ${
                schedule === item.id
                  ? 'bg-surface-elevated border-ai-violet text-text-primary font-bold shadow-glow-ai'
                  : 'bg-surface border-border text-text-secondary hover:text-text-primary hover:border-border-highlight'
              }`}
            >
              <div className="text-xs font-bold">{item.label}</div>
              <div className="text-[10px] text-text-muted mt-1 font-normal">{item.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Bedrock Claude Model Settings */}
      <div className="glass-panel rounded-2xl border border-border p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-ai-violet" />
          <h3 className="text-base font-bold text-text-primary">
            Amazon Bedrock Intelligence & Guardrails
          </h3>
        </div>
        <p className="text-xs text-text-secondary">
          Configure the generative AI model used for producing concise (&le;60 words) actionable recommendations and contextual chat answers.
        </p>

        <div className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
              Foundation Model ID
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-xs text-text-primary focus:outline-none focus:border-ai-violet"
            >
              <option value="anthropic.claude-3-5-sonnet-20241022-v2:0">
                Anthropic Claude 3.5 Sonnet (Recommended — Highest accuracy & code synthesis)
              </option>
              <option value="anthropic.claude-3-haiku-20240307-v1:0">
                Anthropic Claude 3 Haiku (Ultra-low latency & cost)
              </option>
              <option value="meta.llama3-70b-instruct-v1:0">
                Meta Llama 3 70B Instruct
              </option>
            </select>
          </div>

          <div className="p-3.5 rounded-xl bg-surface border border-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-primary">Bedrock Guardrails Policy</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                Active
              </span>
            </div>
            <div className="text-[11px] text-text-secondary leading-relaxed">
              PII masking active (filters AWS secret keys, tokens, email addresses). System prompt enforces answers strictly grounded in retrieved DynamoDB findings. Non-cloud queries are respectfully declined.
            </div>
          </div>
        </div>
      </div>

      {/* Mock Data Mode & Email Notifications */}
      <div className="glass-panel rounded-2xl border border-border p-6 shadow-xl space-y-4">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-text-primary">
            Mock Mode & Telemetry Ingestion
          </h3>
        </div>

        <div className="flex items-center justify-between p-3.5 rounded-xl bg-surface border border-border text-xs">
          <div>
            <div className="font-bold text-text-primary">Mock Data Mode (Zero Backend Required)</div>
            <div className="text-[11px] text-text-secondary mt-0.5">
              Simulates ~40 realistic findings, 12 months of cost trend data, and simulated Bedrock streaming.
            </div>
          </div>
          <button
            onClick={() => setUseMocks(!useMocks)}
            className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
              useMocks ? 'bg-ai-violet' : 'bg-surface-elevated border border-border'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white transition-transform ${
                useMocks ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        <div>
          <label className="block text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">
            Weekly Digest Recipient Email
          </label>
          <input
            type="email"
            value={digestEmail}
            onChange={(e) => setDigestEmail(e.target.value)}
            className="w-full bg-surface-elevated border border-border rounded-lg p-2.5 text-xs text-text-primary focus:outline-none focus:border-ai-violet"
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3 pt-2">
        {saved && (
          <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-4 h-4" /> Preferences saved!
          </span>
        )}
        <Button variant="primary" onClick={handleSave} className="px-6">
          <Save className="w-4 h-4 mr-1.5" /> Save Configuration
        </Button>
      </div>
    </div>
  );
};
