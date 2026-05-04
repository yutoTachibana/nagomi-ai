import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  users,
  profiles,
  moodEntries,
  thoughtRecords,
  journalEntries,
  mindfulnessSessions,
  conversations,
  messages,
  medications,
  medicationLogs,
  doctorVisits,
  safetyEvents,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ message: '認証が必要です' }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const [user] = await db
      .select({ email: users.email, createdAt: users.createdAt })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    const [profile] = await db
      .select()
      .from(profiles)
      .where(eq(profiles.id, userId))
      .limit(1);

    const moods = await db
      .select()
      .from(moodEntries)
      .where(eq(moodEntries.userId, userId));

    const thoughts = await db
      .select()
      .from(thoughtRecords)
      .where(eq(thoughtRecords.userId, userId));

    const journals = await db
      .select()
      .from(journalEntries)
      .where(eq(journalEntries.userId, userId));

    const mindfulness = await db
      .select()
      .from(mindfulnessSessions)
      .where(eq(mindfulnessSessions.userId, userId));

    const convos = await db
      .select()
      .from(conversations)
      .where(eq(conversations.userId, userId));

    const msgs = await db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId));

    const meds = await db
      .select()
      .from(medications)
      .where(eq(medications.userId, userId));

    const medLogs = await db
      .select()
      .from(medicationLogs)
      .where(eq(medicationLogs.userId, userId));

    const visits = await db
      .select()
      .from(doctorVisits)
      .where(eq(doctorVisits.userId, userId));

    const safety = await db
      .select()
      .from(safetyEvents)
      .where(eq(safetyEvents.userId, userId));

    const data = {
      exported_at: new Date().toISOString(),
      user: { email: user?.email },
      profile: profile ?? null,
      mood_entries: moods,
      thought_records: thoughts,
      journal_entries: journals,
      mindfulness_sessions: mindfulness,
      conversations: convos,
      messages: msgs,
      medications: meds,
      medication_logs: medLogs,
      doctor_visits: visits,
      safety_events: safety,
    };

    return new NextResponse(JSON.stringify(data, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="komorebi-export.json"',
      },
    });
  } catch {
    return NextResponse.json(
      { message: 'データの取得に失敗しました。もう一度お試しください。' },
      { status: 500 },
    );
  }
}
