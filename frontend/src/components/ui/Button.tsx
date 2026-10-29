import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'ai';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      isLoading = false,
      disabled,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles =
      'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 focus-ring disabled:opacity-50 disabled:pointer-events-none select-none';

    const sizeStyles: Record<string, string> = {
      sm: 'text-xs px-2.5 py-1.5 gap-1.5',
      md: 'text-sm px-3.5 py-2 gap-2',
      lg: 'text-base px-5 py-2.5 gap-2.5',
      icon: 'p-2 aspect-square',
    };

    const variantStyles: Record<string, string> = {
      primary:
        'bg-white text-black hover:bg-neutral-200 dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100 shadow-sm active:scale-[0.98]',
      secondary:
        'bg-surface-elevated text-text-primary border border-border hover:border-border-highlight hover:bg-surface active:scale-[0.98]',
      outline:
        'bg-transparent text-text-primary border border-border hover:border-border-highlight hover:bg-surface active:scale-[0.98]',
      ghost:
        'bg-transparent text-text-secondary hover:text-text-primary hover:bg-surface-elevated active:scale-[0.98]',
      danger:
        'bg-severity-critical/20 text-severity-critical border border-severity-critical/30 hover:bg-severity-critical/30 active:scale-[0.98]',
      ai:
        'bg-gradient-to-r from-ai-violet to-ai-cyan text-white shadow-glow-ai hover:opacity-95 active:scale-[0.98]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
