import * as React from 'react';
import { cn } from '@/lib/utils';

export function Card({
  className,
  warm,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { warm?: boolean }) {
  return (
    <div
      className={cn(warm ? 'card-warm' : 'card', className)}
      {...rest}
    />
  );
}

export function CardTitle({
  className,
  ...rest
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('font-mincho text-h3 leading-snug text-ink', className)}
      {...rest}
    />
  );
}

export function CardLabel({
  className,
  ...rest
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn('text-kana uppercase tracking-widest text-muted', className)}
      {...rest}
    />
  );
}
