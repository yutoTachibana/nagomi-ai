'use client';

import * as React from 'react';
import { X, Plus } from 'lucide-react';
import type { EmotionEntry } from '@/types/db';
import { EMOTION_OPTIONS } from '@/lib/cbt/distortions';
import { cn } from '@/lib/utils';

interface Props {
  value: EmotionEntry[];
  onChange: (next: EmotionEntry[]) => void;
}

export function EmotionInput({ value, onChange }: Props) {
  const [adding, setAdding] = React.useState(false);
  const [draft, setDraft] = React.useState('');

  function addEmotion(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (value.find((e) => e.name === trimmed)) return;
    onChange([...value, { name: trimmed, intensity: 50 }]);
    setDraft('');
    setAdding(false);
  }

  function updateIntensity(name: string, intensity: number) {
    onChange(value.map((e) => (e.name === name ? { ...e, intensity } : e)));
  }

  function remove(name: string) {
    onChange(value.filter((e) => e.name !== name));
  }

  const usedNames = new Set(value.map((e) => e.name));
  const presets = EMOTION_OPTIONS.filter((n) => !usedNames.has(n));

  return (
    <div className="space-y-4">
      {value.length === 0 ? (
        <p className="text-small text-muted">
          いまの感情を選んでみてください。複数あって大丈夫です。
        </p>
      ) : (
        <ul className="space-y-3">
          {value.map((e) => (
            <li key={e.name} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-body">{e.name}</span>
                <div className="flex items-center gap-3">
                  <span className="text-small font-medium text-terracotta tabular-nums">
                    {e.intensity}
                  </span>
                  <button
                    type="button"
                    onClick={() => remove(e.name)}
                    aria-label={`${e.name}を削除`}
                    className="p-1 text-muted hover:text-ink"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={e.intensity}
                onChange={(ev) => updateIntensity(e.name, Number(ev.target.value))}
                aria-label={`${e.name}の強さ`}
                className="w-full accent-terracotta"
              />
            </li>
          ))}
        </ul>
      )}

      {!adding ? (
        <div className="flex flex-wrap gap-2">
          {presets.slice(0, 12).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => addEmotion(p)}
              className="pill"
            >
              + {p}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setAdding(true)}
            className={cn('pill border border-dashed border-muted/40 bg-transparent')}
          >
            <Plus size={14} className="mr-1" /> 自分で書く
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="感情の名前"
            value={draft}
            onChange={(ev) => setDraft(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === 'Enter') {
                ev.preventDefault();
                addEmotion(draft);
              }
            }}
            className="input-paper flex-1"
            autoFocus
          />
          <button
            type="button"
            onClick={() => addEmotion(draft)}
            className="btn-primary px-4 text-small"
          >
            追加
          </button>
        </div>
      )}
    </div>
  );
}
