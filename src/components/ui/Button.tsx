import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'danger' | 'plain';
type Size = 'sm' | 'md' | 'lg';

interface Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const sizeClasses: Record<Size, string> = {
  sm: 'px-4 py-2 text-small min-h-[36px]',
  md: 'px-6 py-3 text-body min-h-[48px]',
  lg: 'px-8 py-4 text-lead min-h-[56px]',
};

export const Button = React.forwardRef<HTMLButtonElement, Props>(
  function Button(
    { variant = 'primary', size = 'md', loading, className, children, disabled, ...rest },
    ref,
  ) {
    const base =
      'inline-flex items-center justify-center gap-2 rounded-pill font-medium transition-all select-none disabled:opacity-50 disabled:cursor-not-allowed';

    const variants: Record<Variant, string> = {
      primary: 'bg-terracotta text-white hover:brightness-105 active:translate-y-[1px]',
      ghost:
        'bg-transparent text-ink border border-ink/15 hover:bg-accent-soft/40',
      danger: 'bg-error text-white hover:brightness-105',
      plain: 'bg-transparent text-ink hover:bg-accent-soft/30',
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizeClasses[size], className)}
        disabled={disabled || loading}
        {...rest}
      >
        {loading ? (
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    );
  },
);
