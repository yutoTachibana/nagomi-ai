import {
  pgTable,
  uuid,
  text,
  smallint,
  integer,
  boolean,
  timestamp,
  date,
  time,
  jsonb,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ====================================================================
// users (Supabase auth.users の代替)
// ====================================================================
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  passwordHash: text('password_hash'), // nullable: OAuth ユーザーはパスワードなし
  emailVerified: boolean('email_verified').notNull().default(false),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  // OAuth プロバイダー情報
  oauthProvider: text('oauth_provider'), // 'google' | 'twitter' | null
  oauthProviderId: text('oauth_provider_id'), // プロバイダー側の ID
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// email_verification_tokens
// ====================================================================
export const emailVerificationTokens = pgTable('email_verification_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// password_reset_tokens
// ====================================================================
export const passwordResetTokens = pgTable('password_reset_tokens', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// profiles
// ====================================================================
export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  displayName: text('display_name'),
  birdPersona: text('bird_persona').default('kotone'),
  birthYear: smallint('birth_year'),
  diagnosisSelfReport: text('diagnosis_self_report').array().default(sql`ARRAY[]::text[]`),
  preferredCheckInTime: time('preferred_check_in_time'),
  onboardingCompleted: boolean('onboarding_completed').default(false),
  termsAcceptedVersion: text('terms_accepted_version'),
  termsAcceptedAt: timestamp('terms_accepted_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// mood_entries
// ====================================================================
export const moodEntries = pgTable('mood_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  moodScore: smallint('mood_score').notNull(),
  energyLevel: smallint('energy_level').notNull(),
  tags: text('tags').array().default(sql`ARRAY[]::text[]`),
  noteEncrypted: text('note_encrypted'),
  recordedAt: timestamp('recorded_at', { withTimezone: true }).notNull().defaultNow(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// thought_records (CBT コラム法)
// ====================================================================
export const thoughtRecords = pgTable('thought_records', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  situationEncrypted: text('situation_encrypted'),
  emotionsBefore: jsonb('emotions_before'),
  automaticThoughtEncrypted: text('automatic_thought_encrypted'),
  evidenceForEncrypted: text('evidence_for_encrypted'),
  evidenceAgainstEncrypted: text('evidence_against_encrypted'),
  balancedThoughtEncrypted: text('balanced_thought_encrypted'),
  emotionsAfter: jsonb('emotions_after'),
  cognitiveDistortions: text('cognitive_distortions').array().default(sql`ARRAY[]::text[]`),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// journal_entries
// ====================================================================
export const journalEntries = pgTable('journal_entries', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  contentEncrypted: text('content_encrypted'),
  promptKey: text('prompt_key'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// mindfulness_sessions
// ====================================================================
export const mindfulnessSessions = pgTable('mindfulness_sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionType: text('session_type').notNull(),
  durationSeconds: integer('duration_seconds'),
  completed: boolean('completed').notNull().default(false),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  endedAt: timestamp('ended_at', { withTimezone: true }),
});

// ====================================================================
// conversations & messages (ことねとのチャット)
// ====================================================================
export const conversations = pgTable('conversations', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: text('title').default(''),
  summary: text('summary'), // 会話終了時に AI が生成する要約
  everCrisisFlagged: boolean('ever_crisis_flagged').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// user_context (ことねノート - ユーザー理解コンテキスト)
// ====================================================================
export const userContext = pgTable('user_context', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  // 'background' | 'coping' | 'trigger' | 'preference' | 'custom'
  category: text('category').notNull(),
  content: text('content').notNull(),
  // AI が抽出したか、ユーザーが手動追加したか
  source: text('source').notNull().default('ai'), // 'ai' | 'user'
  // 抽出元の会話 (AI の場合)
  conversationId: uuid('conversation_id').references(() => conversations.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  conversationId: uuid('conversation_id').notNull().references(() => conversations.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull(), // 'user' | 'assistant' | 'system'
  contentEncrypted: text('content_encrypted').notNull(),
  crisisFlagged: boolean('crisis_flagged').notNull().default(false),
  tokensInput: integer('tokens_input'),
  tokensOutput: integer('tokens_output'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// safety_events
// ====================================================================
export const safetyEvents = pgTable('safety_events', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  eventType: text('event_type').notNull(),
  contextPath: text('context_path'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// medications & medication_logs
// ====================================================================
export const medications = pgTable('medications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  nameEncrypted: text('name_encrypted').notNull(),
  dosage: text('dosage'),
  schedule: jsonb('schedule'),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const medicationLogs = pgTable('medication_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  medicationId: uuid('medication_id').notNull().references(() => medications.id, { onDelete: 'cascade' }),
  scheduledFor: timestamp('scheduled_for', { withTimezone: true }).notNull(),
  takenAt: timestamp('taken_at', { withTimezone: true }),
  status: text('status').notNull().default('missed'), // 'taken' | 'skipped' | 'missed'
  noteEncrypted: text('note_encrypted'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ====================================================================
// doctor_visits
// ====================================================================
export const doctorVisits = pgTable('doctor_visits', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  visitedAt: date('visited_at').notNull(),
  nextVisit: date('next_visit'),
  doctorNameEncrypted: text('doctor_name_encrypted'),
  notesEncrypted: text('notes_encrypted'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

