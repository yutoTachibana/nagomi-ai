import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  profiles,
  moodEntries,
  sleepEntries,
  medications,
  medicationLogs,
  medicationSideEffects,
  selfAssessments,
  doctorVisits,
} from '@/lib/db/schema';
import { eq, and, desc, gte } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { ReportPrintButton } from '@/components/mypage/ReportPrintButton';
import { getScale, interpretScore } from '@/lib/self-assessment';
import { SIDE_EFFECT_TYPES } from '@/lib/medication-side-effect-types';

export const dynamic = 'force-dynamic';

const PERIOD_DAYS = 30;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
}

function moodLabel(score: number): string {
  return ['', 'しんどい', '少ししんどい', 'ふつう', '少しのびやか', 'のびやか'][score] ?? '';
}

export default async function ReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const userId = session.user.id;

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - PERIOD_DAYS);
  const cutoffIso = cutoffDate.toISOString();

  // Profile
  const [profile] = await db
    .select({ displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, userId))
    .limit(1);

  // Mood
  const moods = await db.select()
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.recordedAt, cutoffIso)))
    .orderBy(desc(moodEntries.recordedAt));

  const moodAvg = moods.length > 0
    ? Math.round((moods.reduce((a, b) => a + b.moodScore, 0) / moods.length) * 10) / 10
    : null;
  const energyAvg = moods.length > 0
    ? Math.round((moods.reduce((a, b) => a + b.energyLevel, 0) / moods.length) * 10) / 10
    : null;

  // Tag frequency
  const tagCounts = new Map<string, number>();
  for (const m of moods) {
    for (const t of (m.tags as string[] | null) ?? []) {
      tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
    }
  }
  const topTags = Array.from(tagCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  // Sleep
  const sleeps = await db.select()
    .from(sleepEntries)
    .where(and(eq(sleepEntries.userId, userId), gte(sleepEntries.recordedDate, cutoffIso.slice(0, 10))))
    .orderBy(desc(sleepEntries.recordedDate));

  const sleepDurations = sleeps
    .map((s) => {
      if (!s.bedtime || !s.wakeTime) return null;
      const a = new Date(s.bedtime).getTime();
      const b = new Date(s.wakeTime).getTime();
      const h = (b - a) / 1000 / 60 / 60;
      if (h <= 0 || h > 24) return null;
      return h;
    })
    .filter((h): h is number => h !== null);
  const sleepDurationAvg = sleepDurations.length > 0
    ? Math.round((sleepDurations.reduce((a, b) => a + b, 0) / sleepDurations.length) * 10) / 10
    : null;
  const sleepQualityAvg = (() => {
    const arr = sleeps.map((s) => s.qualityScore).filter((q): q is number => q !== null);
    return arr.length > 0
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 10) / 10
      : null;
  })();

  // Medications + adherence
  const meds = await db.select()
    .from(medications)
    .where(and(eq(medications.userId, userId), eq(medications.active, true)));

  const decryptedMeds = await Promise.all(
    meds.map(async (m) => ({
      id: m.id,
      name: (await decrypt(m.nameEncrypted)) ?? '不明',
      dosage: m.dosage,
      schedule: m.schedule as { times: string[] } | null,
    })),
  );

  const logs = await db.select()
    .from(medicationLogs)
    .where(and(eq(medicationLogs.userId, userId), gte(medicationLogs.scheduledFor, cutoffIso.slice(0, 10))));

  // Adherence rate per medication
  const adherence = decryptedMeds.map((m) => {
    const myLogs = logs.filter((l) => l.medicationId === m.id);
    const taken = myLogs.filter((l) => l.status === 'taken').length;
    const total = myLogs.length;
    return {
      ...m,
      taken,
      total,
      rate: total > 0 ? Math.round((taken / total) * 100) : null,
    };
  });

  // Side effects (last 30 days)
  const sideEffects = await db.select()
    .from(medicationSideEffects)
    .where(and(eq(medicationSideEffects.userId, userId), gte(medicationSideEffects.recordedAt, cutoffIso)))
    .orderBy(desc(medicationSideEffects.recordedAt));

  // Self-assessments (last 30 days)
  const assessments = await db.select()
    .from(selfAssessments)
    .where(and(eq(selfAssessments.userId, userId), gte(selfAssessments.completedAt, cutoffIso)))
    .orderBy(desc(selfAssessments.completedAt));

  // Doctor visits (last 60 days for context)
  const visitCutoff = new Date();
  visitCutoff.setDate(visitCutoff.getDate() - 60);
  const visits = await db.select()
    .from(doctorVisits)
    .where(and(eq(doctorVisits.userId, userId), gte(doctorVisits.visitedAt, visitCutoff.toISOString())))
    .orderBy(desc(doctorVisits.visitedAt));

  const visitsDecrypted = await Promise.all(visits.map(async (v) => ({
    visitedAt: v.visitedAt,
    nextVisit: v.nextVisit,
    doctorName: v.doctorNameEncrypted ? await decrypt(v.doctorNameEncrypted) : null,
    notes: v.notesEncrypted ? await decrypt(v.notesEncrypted) : null,
  })));

  const periodEnd = new Date();
  const periodStart = new Date();
  periodStart.setDate(periodStart.getDate() - PERIOD_DAYS);

  return (
    <div className="px-5 pt-safe pb-4 space-y-5 print-container">
      <header className="flex items-center gap-3 pt-4 print:hidden">
        <Link href="/mypage" aria-label="戻る" className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2 flex-1">主治医共有レポート</h1>
      </header>

      <div className="print:hidden bg-paper/60 border border-accent-soft rounded-card p-4 space-y-2">
        <p className="text-small text-ink leading-relaxed">
          直近 {PERIOD_DAYS} 日のサマリです。診察前にプリントするか、PDF として保存して共有できます。
        </p>
        <ReportPrintButton />
      </div>

      {/* 印刷用コンテンツ */}
      <article className="report bg-card text-ink rounded-card p-6 print:p-0 print:bg-white space-y-6">
        <header className="border-b border-accent-soft pb-4">
          <h1 className="font-mincho text-h2">こころの記録レポート</h1>
          <p className="text-small text-muted mt-1">
            {profile?.displayName ?? 'ご本人'} さん /
            集計期間: {formatDate(periodStart.toISOString())} – {formatDate(periodEnd.toISOString())} /
            生成日: {formatDate(new Date().toISOString())}
          </p>
        </header>

        {/* Mood */}
        <section className="space-y-2">
          <h2 className="font-mincho text-h3 border-l-4 border-terracotta pl-3">気分とエネルギー</h2>
          {moods.length === 0 ? (
            <p className="text-small text-muted">記録なし</p>
          ) : (
            <div className="space-y-1 text-small">
              <p>記録回数: <strong>{moods.length} 回</strong></p>
              <p>気分の平均: <strong>{moodAvg} / 5</strong> {moodAvg ? `(${moodLabel(Math.round(moodAvg))})` : ''}</p>
              <p>エネルギーの平均: <strong>{energyAvg} / 5</strong></p>
              {topTags.length > 0 ? (
                <p>よく選ばれたタグ: {topTags.map(([t, c]) => `${t} (${c})`).join('・')}</p>
              ) : null}
            </div>
          )}
        </section>

        {/* Sleep */}
        <section className="space-y-2">
          <h2 className="font-mincho text-h3 border-l-4 border-sage pl-3">睡眠</h2>
          {sleeps.length === 0 ? (
            <p className="text-small text-muted">記録なし</p>
          ) : (
            <div className="space-y-1 text-small">
              <p>記録回数: <strong>{sleeps.length} 回</strong></p>
              {sleepDurationAvg ? <p>平均睡眠時間: <strong>{sleepDurationAvg} 時間</strong></p> : null}
              {sleepQualityAvg ? <p>睡眠の質の平均: <strong>{sleepQualityAvg} / 5</strong></p> : null}
            </div>
          )}
        </section>

        {/* Self-assessments */}
        <section className="space-y-2">
          <h2 className="font-mincho text-h3 border-l-4 border-plum pl-3">セルフチェック (PHQ-9 / GAD-7)</h2>
          {assessments.length === 0 ? (
            <p className="text-small text-muted">この期間の記録なし</p>
          ) : (
            <ul className="text-small space-y-1">
              {assessments.map((a) => {
                const s = getScale(a.scaleType as 'phq9' | 'gad7');
                const interp = interpretScore(s, a.totalScore);
                return (
                  <li key={a.id}>
                    {formatDate(a.completedAt)}: <strong>{s.shortName}</strong> {a.totalScore}/{s.questions.length * 3}
                    <span className="text-muted ml-2">({interp.label})</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Medications */}
        <section className="space-y-2">
          <h2 className="font-mincho text-h3 border-l-4 border-warn pl-3">服薬</h2>
          {adherence.length === 0 ? (
            <p className="text-small text-muted">登録された薬なし</p>
          ) : (
            <ul className="text-small space-y-1">
              {adherence.map((m) => (
                <li key={m.id}>
                  <strong>{m.name}</strong>
                  {m.dosage ? ` (${m.dosage})` : ''}
                  {m.schedule?.times?.length ? ` / ${m.schedule.times.join('・')}` : ''}
                  {m.rate !== null ? <span className="text-muted ml-2">服薬記録 {m.rate}% ({m.taken}/{m.total})</span> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Side effects */}
        {sideEffects.length > 0 ? (
          <section className="space-y-2">
            <h2 className="font-mincho text-h3 border-l-4 border-warn pl-3">気になる体の変化</h2>
            <ul className="text-small space-y-1">
              {sideEffects.slice(0, 10).map((e) => {
                const label = SIDE_EFFECT_TYPES.find((t) => t.key === e.effectType)?.label ?? e.effectType;
                const med = adherence.find((m) => m.id === e.medicationId);
                return (
                  <li key={e.id}>
                    {formatDate(e.recordedAt)}: {label}
                    {e.severity ? ` (強さ ${e.severity})` : ''}
                    {med ? ` / ${med.name}` : ''}
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        {/* Doctor visits */}
        {visitsDecrypted.length > 0 ? (
          <section className="space-y-2">
            <h2 className="font-mincho text-h3 border-l-4 border-muted pl-3">通院記録 (直近 60 日)</h2>
            <ul className="text-small space-y-2">
              {visitsDecrypted.map((v, i) => (
                <li key={i}>
                  <p>{formatDate(v.visitedAt)}{v.doctorName ? ` / ${v.doctorName}` : ''}</p>
                  {v.notes ? <p className="text-muted mt-0.5 whitespace-pre-wrap">{v.notes}</p> : null}
                  {v.nextVisit ? <p className="text-muted">次回: {formatDate(v.nextVisit)}</p> : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <footer className="text-kana text-muted border-t border-accent-soft pt-3">
          このレポートは「こもれび」アプリで自動生成されたものです.
          記録は自己モニタリング目的であり、医学的診断ではありません.
        </footer>
      </article>

      <style>{`
        @media print {
          body, html { background: white !important; }
          .print-container { padding: 0 !important; }
          .report { box-shadow: none !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
