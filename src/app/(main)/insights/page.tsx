import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { moodEntries as moodEntriesTable } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { MoodChart } from '@/components/insights/MoodChart';
import { TagSummary } from '@/components/insights/TagSummary';
import { SleepSummary } from '@/components/insights/SleepSummary';
import { CycleSummary } from '@/components/insights/CycleSummary';
import { PatternInsights } from '@/components/insights/PatternInsights';

export default async function InsightsPage() {
  const session = await auth();

  const rawEntries = await db
    .select({
      id: moodEntriesTable.id,
      moodScore: moodEntriesTable.moodScore,
      energyLevel: moodEntriesTable.energyLevel,
      tags: moodEntriesTable.tags,
      recordedAt: moodEntriesTable.recordedAt,
    })
    .from(moodEntriesTable)
    .where(eq(moodEntriesTable.userId, session!.user.id))
    .orderBy(desc(moodEntriesTable.recordedAt))
    .limit(100);

  const entries = rawEntries.map((e) => ({
    ...e,
    tags: (e.tags as string[]) ?? [],
  }));

  return (
    <div className="px-5 pt-safe space-y-5 pb-4">
      <header className="flex items-center gap-2 pt-4">
        <Link
          href="/home"
          aria-label="戻る"
          className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2">みつめる</h1>
      </header>

      <MoodChart entries={entries} />

      <PatternInsights entries={entries} />

      <SleepSummary />

      <CycleSummary />

      <TagSummary entries={entries} />

      <Card className="text-center py-6 bg-paper/40">
        <p className="font-mincho text-body leading-loose text-ink/70">
          数字の上下に「良い」も「悪い」もありません。
          <br />
          自分のリズムを、ただ眺めてみてください。
        </p>
      </Card>
    </div>
  );
}
