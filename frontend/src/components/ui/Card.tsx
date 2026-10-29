import React from 'react';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'none' | 'ai' | 'critical' | 'emerald' | 'amber';
  interactive?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  glow = 'none',
  interactive = false,
  ...props
}) => {
  const glowStyles: Record<string, string> = {
    none: '',
    ai: 'hover:shadow-glow-ai transition-shadow duration-300',
    critical: 'hover:shadow-glow-critical transition-shadow duration-300',
    emerald: 'hover:shadow-glow-emerald transition-shadow duration-300',
    amber: 'hover:shadow-glow-amber transition-shadow duration-300',
  };

  return (
    <div
      className={`glass-panel rounded-xl p-5 border border-border shadow-inner-glow ${
        interactive ? 'cursor-pointer hover:border-border-highlight hover:-translate-y-0.5 transition-all duration-200' : ''
      } ${glowStyles[glow]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
