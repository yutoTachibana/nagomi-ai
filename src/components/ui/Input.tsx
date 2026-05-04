import * as React from 'react';
import { cn } from '@/lib/utils';

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  hint?: string;
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, Props>(
  function Input({ className, hint, label, error, id, ...rest }, ref) {
    const generatedId = React.useId();
    const finalId = id ?? generatedId;
    return (
      <div className="space-y-2">
        {label ? (
          <label htmlFor={finalId} className="block text-small text-ink/80">
            {label}
          </label>
        ) : null}
        <input
          id={finalId}
          ref={ref}
          className={cn('input-paper', className)}
          {...rest}
        />
        {error ? (
          <p className="text-kana text-error">{error}</p>
        ) : hint ? (
          <p className="text-kana text-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);
