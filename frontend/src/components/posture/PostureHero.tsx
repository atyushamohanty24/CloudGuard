import React, { useEffect, useState } from 'react';
import { ShieldCheck, TrendingUp, Sparkles, DollarSign, AlertTriangle } from 'lucide-react';
import { useFindingsStore } from '../../state/useFindingsStore';

export const PostureHero: React.FC = () => {
  const { getMetrics, setAssistantOpen } = useFindingsStore();
  const metrics = getMetrics();
  const { posture, total_monthly_waste, open_critical_count, open_high_count } = metrics;

  // Animated count-up for overall score
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const end = posture.overall_score;
    if (start === end) {
      setDisplayScore(end);
      return;
    }
    const duration = 1000;
    const stepTime = 20;
    const steps = duration / stepTime;
    const increment = end / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= end) {
        setDisplayScore(end);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.round(start));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [posture.overall_score]);

  // SVG Radial Gauge Calculations
  // Radius = 68, Circumference = 2 * PI * 68 = 427.25
  const radius = 68;
  const circumference = 2 * Math.PI * radius;
  // Use a 270-degree arc (leave bottom 90 deg open)
  const strokeDashoffset = circumference - (circumference * (displayScore / 100)) * 0.75;
  const totalArcLength = circumference * 0.75;

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#10B981'; // emerald
    if (score >= 60) return '#38BDF8'; // electric blue
    if (score >= 40) return '#F59E0B'; // amber
    return '#FF5A5F'; // coral red
  };

  return (
    <div className="relative overflow-hidden glass-panel rounded-2xl border border-border p-6 lg:p-8 bg-gradient-to-br from-surface via-surface to-surface-elevated shadow-2xl">
      {/* Background ambient radial glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-ai-violet/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-ai-cyan/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row items-center lg:items-center justify-between gap-8">
        {/* Left: Gauge & Score */}
        <div className="flex flex-col sm:flex-row items-center gap-6 shrink-0">
          <div className="relative w-44 h-44 flex items-center justify-center">
            {/* SVG Arc Gauge */}
            <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 160 160">
              {/* Background Track */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                className="stroke-surface-elevated"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${totalArcLength} ${circumference}`}
                strokeLinecap="round"
              />
              {/* Animated Progress Arc */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke={getScoreColor(posture.overall_score)}
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={`${totalArcLength} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out"
                style={{
                  filter: `drop-shadow(0 0 8px ${getScoreColor(posture.overall_score)}66)`,
                }}
              />
            </svg>

            {/* Centered Score Number */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl lg:text-5xl font-extrabold tracking-tight tabular-nums text-text-primary">
                {displayScore}
              </span>
              <span className="text-[11px] font-semibold text-text-muted tracking-wider uppercase">
                Posture Score
              </span>
            </div>
          </div>

          {/* Sub-scores */}
          <div className="space-y-3 text-center sm:text-left">
            <div>
              <div className="text-xs text-text-muted uppercase tracking-wider font-semibold">
                Cloud Health Status
              </div>
              <div className="text-sm font-semibold text-text-primary mt-0.5 flex items-center justify-center sm:justify-start gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Audited · Moderate Risk</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono">
              <div className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border">
                <span className="text-text-muted block text-[10px]">SECURITY</span>
                <span className="font-bold text-sm text-text-primary tabular-nums">
                  {posture.security_score}/100
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-lg bg-surface-elevated border border-border">
                <span className="text-text-muted block text-[10px]">COST EFFICIENCY</span>
                <span className="font-bold text-sm text-emerald-400 tabular-nums">
                  {posture.cost_score}/100
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: AI Headline & Quick Insights */}
        <div className="flex-1 max-w-xl text-center lg:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-ai-violet/15 to-ai-cyan/15 border border-ai-violet/30 text-xs font-semibold text-purple-300 mb-3">
            <Sparkles className="w-3.5 h-3.5 text-ai-cyan" />
            <span>Bedrock Claude 3.5 Executive Synthesis</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-text-primary leading-snug">
            {posture.ai_headline}
          </h2>

          <p className="text-xs sm:text-sm text-text-secondary mt-2 leading-relaxed">
            Eliminate idle c5 instances, release dormant elastic IPs, and restrict public port 22/3389 ingress rules to immediately boost your posture to <strong className="text-emerald-400 font-semibold">89/100</strong>.
          </p>

          <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mt-4">
            <button
              onClick={() => setAssistantOpen(true)}
              className="text-xs px-3.5 py-2 rounded-lg bg-ai-violet/20 hover:bg-ai-violet/30 text-purple-200 border border-ai-violet/40 font-medium flex items-center gap-1.5 transition-all shadow-glow-ai"
            >
              <Sparkles className="w-3.5 h-3.5 text-ai-cyan" />
              <span>Ask AI: How to reach 90+ score</span>
            </button>
          </div>
        </div>

        {/* Right: Key Figures Card */}
        <div className="w-full lg:w-64 p-4 rounded-xl bg-surface-elevated/80 border border-border flex flex-col justify-between gap-4">
          <div>
            <div className="text-[11px] font-semibold text-text-muted uppercase tracking-wider flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Monthly Recoverable Waste</span>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tabular-nums tracking-tight mt-1">
              ${Math.round(total_monthly_waste).toLocaleString()}
              <span className="text-xs font-normal text-text-muted ml-1">/mo</span>
            </div>
            <div className="text-[11px] text-text-muted mt-0.5">
              ${Math.round(total_monthly_waste * 12).toLocaleString()} projected annual savings
            </div>
          </div>

          <div className="pt-3 border-t border-border flex items-center justify-between text-xs">
            <div className="flex items-center gap-1.5 text-severity-critical font-medium">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{open_critical_count} Critical Risks</span>
            </div>
            <div className="flex items-center gap-1 text-emerald-400 font-medium">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>+{posture.trend_vs_last_month} pts vs Sep</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
