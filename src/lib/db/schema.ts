import {
  sqliteTable,
  text,
  integer,
} from 'drizzle-orm/sqlite-core';
import { randomUUID } from 'crypto';

// ====================================================================
// users (Supabase auth.users の代替)
// ====================================================================
export const users = sqliteTable('users', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // nullable: OAuth ユーザーはパスワードなし
  emailVerified: integer('email_verified', { mode: 'boolean' }).notNull().default(false),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  // OAuth プロバイダー情報
  oauthProvider: text('oauth_provider'), // 'google' | 'twitter' | null
  oauthProviderId: text('oauth_provider_id'), // プロバイダー側の ID
  avatarUrl: text('avatar_url'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// email_verification_tokens
// ====================================================================
export const emailVerificationTokens = sqliteTable('email_verification_tokens', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// password_reset_tokens
// ====================================================================
export const passwordResetTokens = sqliteTable('password_reset_tokens', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  token: text('token').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// profiles
// ====================================================================
export const profiles = sqliteTable('profiles', {
  id: text('id').primaryKey().references(() => users.id),
  displayName: text('display_name'),
  birdPersona: text('bird_persona').default('kotone'),
  birthYear: integer('birth_year'),
  diagnosisSelfReport: text('diagnosis_self_report', { mode: 'json' }).$type<string[]>().$defaultFn(() => []),
  preferredCheckInTime: text('preferred_check_in_time'),
  onboardingCompleted: integer('onboarding_completed', { mode: 'boolean' }).default(false),
  termsAcceptedVersion: text('terms_accepted_version'),
  termsAcceptedAt: text('terms_accepted_at'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// mood_entries
// ====================================================================
export const moodEntries = sqliteTable('mood_entries', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  moodScore: integer('mood_score').notNull(),
  energyLevel: integer('energy_level').notNull(),
  tags: text('tags', { mode: 'json' }).$type<string[]>().$defaultFn(() => []),
  noteEncrypted: text('note_encrypted'),
  recordedAt: text('recorded_at').notNull().$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// thought_records (CBT コラム法)
// ====================================================================
export const thoughtRecords = sqliteTable('thought_records', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  situationEncrypted: text('situation_encrypted'),
  emotionsBefore: text('emotions_before', { mode: 'json' }),
  automaticThoughtEncrypted: text('automatic_thought_encrypted'),
  evidenceForEncrypted: text('evidence_for_encrypted'),
  evidenceAgainstEncrypted: text('evidence_against_encrypted'),
  balancedThoughtEncrypted: text('balanced_thought_encrypted'),
  emotionsAfter: text('emotions_after', { mode: 'json' }),
  cognitiveDistortions: text('cognitive_distortions', { mode: 'json' }).$type<string[]>().$defaultFn(() => []),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// journal_entries
// ====================================================================
export const journalEntries = sqliteTable('journal_entries', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  contentEncrypted: text('content_encrypted'),
  promptKey: text('prompt_key'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// mindfulness_sessions
// ====================================================================
export const mindfulnessSessions = sqliteTable('mindfulness_sessions', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  sessionType: text('session_type').notNull(),
  durationSeconds: integer('duration_seconds'),
  completed: integer('completed', { mode: 'boolean' }).notNull().default(false),
  startedAt: text('started_at').notNull().$defaultFn(() => new Date().toISOString()),
  endedAt: text('ended_at'),
});

// ====================================================================
// conversations & messages (ことねとのチャット)
// ====================================================================
export const conversations = sqliteTable('conversations', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  title: text('title').default(''),
  summary: text('summary'), // 会話終了時に AI が生成する要約
  everCrisisFlagged: integer('ever_crisis_flagged', { mode: 'boolean' }).notNull().default(false),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// user_context (ことねノート - ユーザー理解コンテキスト)
// ====================================================================
export const userContext = sqliteTable('user_context', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  // 'background' | 'coping' | 'trigger' | 'preference' | 'custom'
  category: text('category').notNull(),
  content: text('content').notNull(),
  // AI が抽出したか、ユーザーが手動追加したか
  source: text('source').notNull().default('ai'), // 'ai' | 'user'
  // 抽出元の会話 (AI の場合)
  conversationId: text('conversation_id').references(() => conversations.id),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const messages = sqliteTable('messages', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  conversationId: text('conversation_id').notNull().references(() => conversations.id),
  userId: text('user_id').notNull().references(() => users.id),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  contentEncrypted: text('content_encrypted').notNull(),
  crisisFlagged: integer('crisis_flagged', { mode: 'boolean' }).notNull().default(false),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// safety_events
// ====================================================================
export const safetyEvents = sqliteTable('safety_events', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  eventType: text('event_type').notNull(),
  contextPath: text('context_path'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// medications & medication_logs
// ====================================================================
export const medications = sqliteTable('medications', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  nameEncrypted: text('name_encrypted').notNull(),
  dosage: text('dosage'),
  schedule: text('schedule', { mode: 'json' }),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

export const medicationLogs = sqliteTable('medication_logs', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  medicationId: text('medication_id').notNull().references(() => medications.id),
  scheduledFor: text('scheduled_for').notNull(),
  takenAt: text('taken_at'),
  status: text('status').notNull().default('missed'), // 'taken' | 'skipped' | 'missed'
  noteEncrypted: text('note_encrypted'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// doctor_visits
// ====================================================================
export const doctorVisits = sqliteTable('doctor_visits', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  visitedAt: text('visited_at').notNull(),
  nextVisit: text('next_visit'),
  doctorNameEncrypted: text('doctor_name_encrypted'),
  notesEncrypted: text('notes_encrypted'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// safety_plans (Stanley-Brown 6 ステップ. 1 ユーザー 1 行)
// ====================================================================
export const safetyPlans = sqliteTable('safety_plans', {
  userId: text('user_id').primaryKey().references(() => users.id),
  warningSignsEncrypted: text('warning_signs_encrypted'),
  internalCopingEncrypted: text('internal_coping_encrypted'),
  socialDistractionsEncrypted: text('social_distractions_encrypted'),
  trustedPeopleEncrypted: text('trusted_people_encrypted'),
  professionalsEncrypted: text('professionals_encrypted'),
  environmentEncrypted: text('environment_encrypted'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// sleep_entries (簡易. bedtime/waketime/quality の 3 軸)
// ====================================================================
export const sleepEntries = sqliteTable('sleep_entries', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  /** 寝た日 (起床日の YYYY-MM-DD). 1日 1 行を想定 */
  recordedDate: text('recorded_date').notNull(),
  /** ISO datetime, 任意 */
  bedtime: text('bedtime'),
  /** ISO datetime, 任意 */
  wakeTime: text('wake_time'),
  /** 1 (とても悪い) - 5 (とても良い) */
  qualityScore: integer('quality_score'),
  noteEncrypted: text('note_encrypted'),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});

// ====================================================================
// medication_side_effects (服薬中の副作用の記録)
// ====================================================================
export const medicationSideEffects = sqliteTable('medication_side_effects', {
  id: text('id').primaryKey().$defaultFn(() => randomUUID()),
  userId: text('user_id').notNull().references(() => users.id),
  /** 任意. 特定の薬と紐づけたい場合に使用 */
  medicationId: text('medication_id').references(() => medications.id),
  /** 種類: 'drowsiness' | 'weight_gain' | ... see UI options */
  effectType: text('effect_type').notNull(),
  /** 1 (軽微) - 5 (強い). 0 は記録なし扱い */
  severity: integer('severity'),
  noteEncrypted: text('note_encrypted'),
  recordedAt: text('recorded_at').notNull().$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
});
