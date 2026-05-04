'use client';

import { useMemo } from 'react';
import { Card, CardLabel } from '@/components/ui/Card';

type MoodEntry = {
  id: string;
  moodScore: number;
  energyLevel: number;
  tags: string[];
  recordedAt: string;
};

export function TagSummary({ entries }: { entries: MoodEntry[] }) {
  const topTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const entry of entries) {
      if (!entry.tags) continue;
      for (const tag of entry.tags) {
        counts.set(tag, (counts.get(tag) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  }, [entries]);

  if (topTags.length === 0) return null;

  return (
    <Card>
      <CardLabel>よく選んだタグ</CardLabel>
      <div className="flex flex-wrap gap-2 mt-3">
        {topTags.map(([tag, count]) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-accent-soft/60 text-small text-ink/80"
          >
            {tag}
            <span className="text-kana text-muted">{count}</span>
          </span>
        ))}
      </div>
    </Card>
  );
}
