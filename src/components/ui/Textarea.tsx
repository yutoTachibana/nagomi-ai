import * as React from 'react';
import { cn } from '@/lib/utils';

interface Props extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  hint?: string;
  label?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, Props>(
  function Textarea({ className, hint, label, id, ...rest }, ref) {
    const generatedId = React.useId();
    const finalId = id ?? generatedId;
    return (
      <div className="space-y-2">
        {label ? (
          <label htmlFor={finalId} className="block text-small text-ink/80">
            {label}
          </label>
        ) : null}
        <textarea
          id={finalId}
          ref={ref}
          className={cn('input-paper resize-y min-h-[120px] leading-relaxed', className)}
          {...rest}
        />
        {hint ? (
          <p className="text-kana text-muted">{hint}</p>
        ) : null}
      </div>
    );
  },
);
