import React from 'react';
import { Severity, FindingStatus } from '../../types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'critical' | 'high' | 'medium' | 'low' | 'open' | 'acknowledged' | 'resolved' | 'savings' | 'ai' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  size = 'md',
  className = '',
  dot = false,
}) => {
  const sizeClasses = size === 'sm' ? 'px-1.5 py-0.5 text-xs' : 'px-2.5 py-1 text-xs';

  const variantStyles: Record<string, string> = {
    critical: 'bg-severity-critical/15 text-severity-critical border border-severity-critical/30',
    high: 'bg-severity-high/15 text-severity-high border border-severity-high/30',
    medium: 'bg-severity-medium/15 text-severity-medium border border-severity-medium/30',
    low: 'bg-severity-low/15 text-severity-low border border-severity-low/30',
    open: 'bg-rose-500/10 text-rose-400 border border-rose-500/20',
    acknowledged: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    resolved: 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20',
    savings: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold',
    ai: 'bg-gradient-to-r from-ai-violet/20 to-ai-cyan/20 text-purple-300 border border-ai-violet/40 font-medium',
    neutral: 'bg-surface-elevated text-text-secondary border border-border',
  };

  const dotColors: Record<string, string> = {
    critical: 'bg-severity-critical',
    high: 'bg-severity-high',
    medium: 'bg-severity-medium',
    low: 'bg-severity-low',
    open: 'bg-rose-500',
    acknowledged: 'bg-amber-400',
    resolved: 'bg-emerald-400',
    savings: 'bg-emerald-400',
    ai: 'bg-ai-violet',
    neutral: 'bg-text-muted',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium tracking-wide uppercase ${sizeClasses} ${variantStyles[variant] || variantStyles.neutral} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColors[variant] || dotColors.neutral} animate-pulse-subtle`}
        />
      )}
      {children}
    </span>
  );
};

export const SeverityBadge: React.FC<{ severity: Severity; size?: 'sm' | 'md' }> = ({
  severity,
  size = 'md',
}) => {
  return (
    <Badge variant={severity} size={size} dot>
      {severity}
    </Badge>
  );
};

export const StatusBadge: React.FC<{ status: FindingStatus; size?: 'sm' | 'md' }> = ({
  status,
  size = 'md',
}) => {
  return (
    <Badge variant={status} size={size}>
      {status}
    </Badge>
  );
};
