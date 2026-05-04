'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  /** 各値に対応するラベル. 例: ['とてもしんどい','しんどい','ふつう','穏やか','のびやか'] */
  labels?: string[];
  /** 値が変わったときに表示するテキスト */
  ariaLabel?: string;
  className?: string;
}

/**
 * 5 段階セレクター. 派手なアニメーションは避けつつ、選んだ感触は出す.
 */
export function Slider({
  value,
  onChange,
  min = 1,
  max = 5,
  step = 1,
  labels,
  ariaLabel,
  className,
}: Props) {
  const items: number[] = [];
  for (let i = min; i <= max; i += step) items.push(i);

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn('w-full', className)}
    >
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((v) => {
          const selected = v === value;
          return (
            <button
              key={v}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(v)}
              className={cn(
                'flex h-14 items-center justify-center rounded-card border text-lead font-medium transition-all',
                selected
                  ? 'bg-terracotta text-white border-terracotta shadow-soft'
                  : 'bg-card text-ink border-accent-soft hover:bg-accent-soft/40',
              )}
            >
              {v}
            </button>
          );
        })}
      </div>
      {labels ? (
        <div className="mt-3 flex justify-between text-kana text-muted">
          <span>{labels[0]}</span>
          <span>{labels[Math.floor(labels.length / 2)]}</span>
          <span>{labels[labels.length - 1]}</span>
        </div>
      ) : null}
    </div>
  );
}
