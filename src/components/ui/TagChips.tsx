'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface Props {
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  /** ユーザーが追加可能 */
  allowCustom?: boolean;
  className?: string;
}

export function TagChips({ options, selected, onChange, allowCustom, className }: Props) {
  const [draft, setDraft] = React.useState('');

  function toggle(t: string) {
    if (selected.includes(t)) onChange(selected.filter((x) => x !== t));
    else onChange([...selected, t]);
  }

  function addCustom() {
    const v = draft.trim();
    if (!v) return;
    if (selected.includes(v)) return;
    onChange([...selected, v]);
    setDraft('');
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex flex-wrap gap-2">
        {options.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => toggle(t)}
            className={selected.includes(t) ? 'pill-active' : 'pill'}
          >
            {t}
          </button>
        ))}
        {selected
          .filter((t) => !options.includes(t))
          .map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => toggle(t)}
              className="pill-active"
            >
              {t} ×
            </button>
          ))}
      </div>
      {allowCustom ? (
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="自分で追加"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addCustom();
              }
            }}
            className="input-paper flex-1"
          />
          <button type="button" onClick={addCustom} className="btn-ghost px-4 py-2 text-small">
            追加
          </button>
        </div>
      ) : null}
    </div>
  );
}
