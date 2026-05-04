import Link from 'next/link';
import { Card, CardLabel, CardTitle } from '@/components/ui/Card';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { profiles, moodEntries } from '@/lib/db/schema';
import { eq, desc, gte, and } from 'drizzle-orm';
import { greetingByTime, formatRelativeJa, moodLabel } from '@/lib/utils';
import { ChevronRight, Wind, NotebookPen, MessageCircleHeart, BookOpen } from 'lucide-react';

export default async function HomePage() {
  const session = await auth();

  // プロフィール
  const [profile] = await db
    .select({ displayName: profiles.displayName })
    .from(profiles)
    .where(eq(profiles.id, session!.user.id))
    .limit(1);

  // 最新の気分記録 (今日の有無を判定するため)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayIso = today.toISOString();
  const [todayMood] = await db
    .select({
      id: moodEntries.id,
      moodScore: moodEntries.moodScore,
      energyLevel: moodEntries.energyLevel,
      recordedAt: moodEntries.recordedAt,
    })
    .from(moodEntries)
    .where(
      and(
        eq(moodEntries.userId, session!.user.id),
        gte(moodEntries.recordedAt, todayIso),
      ),
    )
    .orderBy(desc(moodEntries.recordedAt))
    .limit(1);

  // 直近 3 件のアクティビティ
  const recentMood = await db
    .select({
      id: moodEntries.id,
      moodScore: moodEntries.moodScore,
      recordedAt: moodEntries.recordedAt,
    })
    .from(moodEntries)
    .where(eq(moodEntries.userId, session!.user.id))
    .orderBy(desc(moodEntries.recordedAt))
    .limit(3);

  const greeting = greetingByTime();
  const name = profile?.displayName ?? '';

  return (
    <div className="px-5 pt-safe space-y-5 pb-8">
      {/* ヘッダー */}
      <header className="pt-4">
        <p className="text-kana uppercase tracking-widest text-muted">
          KOMOREBI · {today.getMonth() + 1}/{today.getDate()}
        </p>
        <h1 className="mt-1 font-mincho text-h1 leading-tight">
          {greeting}{name ? `、${name}さん` : ''}
        </h1>
      </header>

      {/* 今日の体調プロンプト or 完了メッセージ */}
      {todayMood ? (
        <Card warm>
          <CardLabel>今日の体調</CardLabel>
          <CardTitle className="mt-2">
            {moodLabel(todayMood.moodScore as 1 | 2 | 3 | 4 | 5)} と記録しました
          </CardTitle>
          <p className="mt-2 text-small text-muted">
            記録してくれてありがとう。一日の途中でまた感じ方が変わったら、いつでも追加で残せます。
          </p>
          <Link
            href="/record/mood"
            className="mt-4 inline-flex items-center gap-1 text-small text-terracotta"
          >
            もう一度記録する
            <ChevronRight size={16} />
          </Link>
        </Card>
      ) : (
        <Card warm>
          <CardLabel>今日のチェックイン</CardLabel>
          <CardTitle className="mt-2 leading-relaxed">
            いま、どんな感じですか？
          </CardTitle>
          <p className="mt-2 text-small text-muted">
            言葉にできなくても、5 段階で十分です。
          </p>
          <Link
            href="/record/mood"
            className="btn-primary mt-4 w-full"
          >
            記録する
          </Link>
        </Card>
      )}

      {/* クイックアクション */}
      <section>
        <h2 className="font-mincho text-h3 mb-3 px-1">そっと気を整える</h2>
        <div className="grid grid-cols-2 gap-3">
          <QuickAction
            href="/mindfulness"
            Icon={Wind}
            label="呼吸を整える"
            description="3 分の 4-7-8 呼吸法"
          />
          <QuickAction
            href="/record/thought"
            Icon={NotebookPen}
            label="考えを整理する"
            description="CBT コラム法"
          />
          <QuickAction
            href="/kotone"
            Icon={MessageCircleHeart}
            label="ことねと話す"
            description="話を聞いてほしいとき"
          />
          <QuickAction
            href="/library"
            Icon={BookOpen}
            label="読みもの"
            description="心の仕組みを知る"
          />
        </div>
      </section>

      {/* 最近の記録 */}
      {recentMood.length > 0 ? (
        <section>
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="font-mincho text-h3">最近の自分</h2>
            <Link href="/insights" className="text-small text-muted">
              ぜんぶ見る
            </Link>
          </div>
          <Card>
            <ul className="divide-y divide-accent-soft">
              {recentMood.map((m) => (
                <li key={m.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between">
                  <span className="text-body">
                    {moodLabel(m.moodScore as 1 | 2 | 3 | 4 | 5)}
                  </span>
                  <span className="text-small text-muted">
                    {formatRelativeJa(m.recordedAt)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      {/* 静かな一言 */}
      <Card className="text-center py-8 bg-paper/40">
        <p className="font-mincho text-lead leading-loose text-ink/80">
          記録できた日も、できない日も<br />
          どちらの自分も、ここにいて大丈夫です。
        </p>
      </Card>
    </div>
  );
}

function QuickAction({
  href,
  Icon,
  label,
  description,
}: {
  href: string;
  Icon: React.ComponentType<{ size?: number; strokeWidth?: number; className?: string }>;
  label: string;
  description: string;
}) {
  return (
    <Link href={href} className="card hover:shadow-lift transition-shadow active:translate-y-[1px]">
      <Icon size={22} strokeWidth={1.5} className="text-terracotta" />
      <p className="mt-3 font-medium text-body">{label}</p>
      <p className="mt-1 text-kana text-muted">{description}</p>
    </Link>
  );
}
