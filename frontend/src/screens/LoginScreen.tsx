import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, Sparkles, Key } from 'lucide-react';
import { Button } from '../components/ui/Button';

interface LoginScreenProps {
  onLoginSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('demo-admin@cloudguard.ai');
  const [password, setPassword] = useState('••••••••••••');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 600));
    setIsLoading(false);
    onLoginSuccess();
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-background bg-grid-pattern relative overflow-hidden select-none">
      {/* Background ambient radial glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-ai-violet/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-ai-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md glass-panel-elevated p-8 rounded-2xl border border-border shadow-2xl space-y-6 relative z-10">
        {/* Brand Logo & Title */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-ai-violet to-ai-cyan p-0.5 mx-auto shadow-glow-ai flex items-center justify-center">
            <div className="w-full h-full bg-[#0B0F14] rounded-[14px] flex items-center justify-center">
              <ShieldCheck className="w-6 h-6 text-ai-cyan" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-text-primary">CloudGuard</h1>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-ai-violet/20 text-purple-300 border border-ai-violet/30">
              AI
            </span>
          </div>

          <p className="text-xs text-text-secondary">
            Serverless AWS Cost & Security Posture Advisor
          </p>
        </div>

        {/* Cognito Hosted UI simulated form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Work Email / Cognito Username
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-ai-violet transition-colors"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-text-muted uppercase tracking-wider">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-surface border border-border rounded-lg px-3.5 py-2.5 text-xs text-text-primary focus:outline-none focus:border-ai-violet transition-colors"
            />
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="ai"
              size="lg"
              isLoading={isLoading}
              className="w-full font-semibold shadow-glow-ai"
            >
              <span>Access Mission Control</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </form>

        {/* Read-Only Guarantee */}
        <div className="pt-4 border-t border-border flex items-center justify-center gap-2 text-[11px] text-text-muted">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Amazon Cognito JWT Auth · 100% Read-Only</span>
        </div>
      </div>
    </div>
  );
};
