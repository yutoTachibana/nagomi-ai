-- ====================================================================
-- こもれび 初期スキーマ
-- ====================================================================
-- 設計方針:
--   1. すべてのユーザーデータテーブルに RLS を設定。auth.uid() = user_id でフィルタ
--   2. 自由記述カラムは `*_encrypted` と命名。クライアント側で暗号化してから保存
--   3. crisis 関連は本文を保存しない (type のみ)
--   4. created_at / updated_at は trigger で自動更新
-- ====================================================================

-- pgcrypto は Supabase で標準有効
create extension if not exists "uuid-ossp";

-- ----------------------------------------------------------------------
-- 共通: updated_at 自動更新トリガー
-- ----------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ====================================================================
-- profiles
-- ====================================================================
create table public.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  display_name    text,
  -- ユーザーが選んだ「ことね」のペルソナ (将来用)
  bird_persona    text default 'kotone',
  birth_year      smallint check (birth_year between 1900 and 2100),
  -- 自己申告のみ。医療情報ではない。例: ['anxiety', 'adjustment', 'bipolar2']
  diagnosis_self_report text[] default array[]::text[],
  -- リマインダー希望時刻 (JST 想定)。null は通知 OFF
  preferred_check_in_time time,
  onboarding_completed boolean default false,
  -- 利用規約同意の記録 (バージョン文字列を入れる)
  terms_accepted_version text,
  terms_accepted_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

create policy "profiles: select own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles: insert own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles: update own"
  on public.profiles for update
  using (auth.uid() = id);

-- サインアップ時に profiles を自動作成
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ====================================================================
-- mood_entries
-- ====================================================================
create table public.mood_entries (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- 1 (とてもしんどい) ~ 5 (穏やか). 「good/bad」と命名しないことに注意
  mood_score      smallint not null check (mood_score between 1 and 5),
  -- 1 (低エネルギー) ~ 5 (高エネルギー). 双極性のサインを観察するため
  energy_level    smallint not null check (energy_level between 1 and 5),
  -- 例: ['睡眠不足', '仕事', '生理前']
  tags            text[] default array[]::text[],
  -- クライアント側で暗号化された自由記述. nullable
  note_encrypted  text,
  -- 記録対象の時刻 (ユーザーが過去分を記録できる)
  recorded_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index mood_entries_user_recorded_idx
  on public.mood_entries (user_id, recorded_at desc);

alter table public.mood_entries enable row level security;

create policy "mood_entries: select own" on public.mood_entries
  for select using (auth.uid() = user_id);
create policy "mood_entries: insert own" on public.mood_entries
  for insert with check (auth.uid() = user_id);
create policy "mood_entries: update own" on public.mood_entries
  for update using (auth.uid() = user_id);
create policy "mood_entries: delete own" on public.mood_entries
  for delete using (auth.uid() = user_id);

-- ====================================================================
-- thought_records (CBT コラム法)
-- ====================================================================
create table public.thought_records (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- すべて暗号化対象
  situation_encrypted          text,  -- どんな状況だった？
  emotions_before              jsonb, -- [{name:"不安", intensity:80}, ...]
  automatic_thought_encrypted  text,  -- そのとき頭に浮かんだ考え
  evidence_for_encrypted       text,  -- その考えを支持する事実
  evidence_against_encrypted   text,  -- 反対の事実
  balanced_thought_encrypted   text,  -- バランスのとれた考え
  emotions_after               jsonb, -- [{name:"不安", intensity:50}, ...]
  -- 頻出の認知の歪み (ユーザーが選択). 例: ['全か無か', '読心']
  cognitive_distortions text[] default array[]::text[],
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index thought_records_user_created_idx
  on public.thought_records (user_id, created_at desc);

create trigger thought_records_set_updated_at
  before update on public.thought_records
  for each row execute function public.set_updated_at();

alter table public.thought_records enable row level security;

create policy "thought_records: select own" on public.thought_records
  for select using (auth.uid() = user_id);
create policy "thought_records: insert own" on public.thought_records
  for insert with check (auth.uid() = user_id);
create policy "thought_records: update own" on public.thought_records
  for update using (auth.uid() = user_id);
create policy "thought_records: delete own" on public.thought_records
  for delete using (auth.uid() = user_id);

-- ====================================================================
-- journal_entries
-- ====================================================================
create table public.journal_entries (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  content_encrypted text,
  -- 使ったプロンプトのキー (例: 'gratitude_3', 'free_writing'). null は完全自由
  prompt_key      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index journal_entries_user_created_idx
  on public.journal_entries (user_id, created_at desc);

create trigger journal_entries_set_updated_at
  before update on public.journal_entries
  for each row execute function public.set_updated_at();

alter table public.journal_entries enable row level security;

create policy "journal: select own" on public.journal_entries
  for select using (auth.uid() = user_id);
create policy "journal: insert own" on public.journal_entries
  for insert with check (auth.uid() = user_id);
create policy "journal: update own" on public.journal_entries
  for update using (auth.uid() = user_id);
create policy "journal: delete own" on public.journal_entries
  for delete using (auth.uid() = user_id);

-- ====================================================================
-- mindfulness_sessions
-- ====================================================================
create table public.mindfulness_sessions (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- 'breathing_478', 'body_scan', 'loving_kindness', 'grounding_54321'
  session_type    text not null,
  duration_seconds integer,
  completed       boolean not null default false,
  started_at      timestamptz not null default now(),
  ended_at        timestamptz
);

create index mindfulness_user_started_idx
  on public.mindfulness_sessions (user_id, started_at desc);

alter table public.mindfulness_sessions enable row level security;

create policy "mindfulness: select own" on public.mindfulness_sessions
  for select using (auth.uid() = user_id);
create policy "mindfulness: insert own" on public.mindfulness_sessions
  for insert with check (auth.uid() = user_id);
create policy "mindfulness: update own" on public.mindfulness_sessions
  for update using (auth.uid() = user_id);

-- ====================================================================
-- conversations & messages (ことねとのチャット)
-- ====================================================================
create table public.conversations (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- 自動生成 or ユーザー入力
  title           text default '',
  -- このスレッドで一度でもクライシス検知が発生したか
  ever_crisis_flagged boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger conversations_set_updated_at
  before update on public.conversations
  for each row execute function public.set_updated_at();

alter table public.conversations enable row level security;
create policy "conv: select own" on public.conversations for select using (auth.uid() = user_id);
create policy "conv: insert own" on public.conversations for insert with check (auth.uid() = user_id);
create policy "conv: update own" on public.conversations for update using (auth.uid() = user_id);
create policy "conv: delete own" on public.conversations for delete using (auth.uid() = user_id);

create table public.messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id         uuid not null references auth.users(id) on delete cascade,
  role            text not null check (role in ('user', 'assistant', 'system')),
  content_encrypted text not null,
  -- 監査用: クライシスキーワードを含んだか (本文は保存しない)
  crisis_flagged  boolean not null default false,
  -- トークン数 (利用量分析用)
  tokens_input    integer,
  tokens_output   integer,
  created_at      timestamptz not null default now()
);

create index messages_conv_created_idx
  on public.messages (conversation_id, created_at);

alter table public.messages enable row level security;
create policy "msg: select own" on public.messages for select using (auth.uid() = user_id);
create policy "msg: insert own" on public.messages for insert with check (auth.uid() = user_id);
create policy "msg: delete own" on public.messages for delete using (auth.uid() = user_id);

-- ====================================================================
-- safety_events (クライシス検知の最小ログ)
-- 重要: 本文・キーワードは絶対に保存しない. 何が起きたかの type のみ
-- ====================================================================
create table public.safety_events (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- 'crisis_keyword_detected', 'crisis_resource_shown', 'user_clicked_hotline'
  event_type      text not null,
  -- 発生元の画面 / コンテキスト. 自由記述は入れない
  context_path    text,
  created_at      timestamptz not null default now()
);

create index safety_events_user_idx on public.safety_events (user_id, created_at desc);

alter table public.safety_events enable row level security;
create policy "safety: select own" on public.safety_events for select using (auth.uid() = user_id);
create policy "safety: insert own" on public.safety_events for insert with check (auth.uid() = user_id);

-- ====================================================================
-- medications & medication_logs
-- ====================================================================
create table public.medications (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  -- 薬の名称 (ユーザーが入力). 暗号化対象
  name_encrypted  text not null,
  dosage          text, -- '5mg', '1錠' などの自由文字列
  -- 服用スケジュール {times: ['08:00', '20:00'], days: ['mon','tue',...]}
  schedule        jsonb,
  active          boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger medications_set_updated_at
  before update on public.medications
  for each row execute function public.set_updated_at();

alter table public.medications enable row level security;
create policy "meds: select own" on public.medications for select using (auth.uid() = user_id);
create policy "meds: insert own" on public.medications for insert with check (auth.uid() = user_id);
create policy "meds: update own" on public.medications for update using (auth.uid() = user_id);
create policy "meds: delete own" on public.medications for delete using (auth.uid() = user_id);

create table public.medication_logs (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  medication_id   uuid not null references public.medications(id) on delete cascade,
  scheduled_for   timestamptz not null,
  taken_at        timestamptz,
  -- 'taken' | 'skipped' | 'missed'
  status          text not null default 'missed',
  note_encrypted  text,
  created_at      timestamptz not null default now()
);

create index medication_logs_user_scheduled_idx
  on public.medication_logs (user_id, scheduled_for desc);

alter table public.medication_logs enable row level security;
create policy "medlogs: select own" on public.medication_logs for select using (auth.uid() = user_id);
create policy "medlogs: insert own" on public.medication_logs for insert with check (auth.uid() = user_id);
create policy "medlogs: update own" on public.medication_logs for update using (auth.uid() = user_id);

-- ====================================================================
-- doctor_visits
-- ====================================================================
create table public.doctor_visits (
  id              uuid primary key default uuid_generate_v4(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  visited_at      date not null,
  next_visit      date,
  doctor_name_encrypted text,
  notes_encrypted text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger doctor_visits_set_updated_at
  before update on public.doctor_visits
  for each row execute function public.set_updated_at();

alter table public.doctor_visits enable row level security;
create policy "visits: select own" on public.doctor_visits for select using (auth.uid() = user_id);
create policy "visits: insert own" on public.doctor_visits for insert with check (auth.uid() = user_id);
create policy "visits: update own" on public.doctor_visits for update using (auth.uid() = user_id);
create policy "visits: delete own" on public.doctor_visits for delete using (auth.uid() = user_id);

-- ====================================================================
-- community_posts & community_hearts (Phase 2 で公開予定)
-- ====================================================================
create table public.community_posts (
  id              uuid primary key default uuid_generate_v4(),
  -- 内部参照のみ. UI には絶対に出さない
  author_id       uuid not null references auth.users(id) on delete cascade,
  -- 表示用ニックネーム (本名を入れない誓約あり)
  display_name    text not null,
  -- コミュニティ投稿は **平文**. モデレーション対象のため
  content         text not null check (length(content) <= 500),
  hearts_count    integer not null default 0,
  -- 'pending' | 'approved' | 'hidden'
  status          text not null default 'pending',
  created_at      timestamptz not null default now(),
  approved_at     timestamptz
);

create index community_posts_status_created_idx
  on public.community_posts (status, created_at desc);

alter table public.community_posts enable row level security;

-- 自分の投稿は常に見える. 他人の投稿は approved のみ
create policy "posts: read approved or own" on public.community_posts
  for select using (status = 'approved' or author_id = auth.uid());

create policy "posts: insert own" on public.community_posts
  for insert with check (author_id = auth.uid() and status = 'pending');

create policy "posts: delete own" on public.community_posts
  for delete using (author_id = auth.uid());

create table public.community_hearts (
  user_id         uuid not null references auth.users(id) on delete cascade,
  post_id         uuid not null references public.community_posts(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (user_id, post_id)
);

alter table public.community_hearts enable row level security;
create policy "hearts: read all" on public.community_hearts for select using (true);
create policy "hearts: insert own" on public.community_hearts for insert with check (user_id = auth.uid());
create policy "hearts: delete own" on public.community_hearts for delete using (user_id = auth.uid());

-- ハートのカウント自動更新 trigger
create or replace function public.update_hearts_count()
returns trigger language plpgsql as $$
begin
  if (tg_op = 'INSERT') then
    update public.community_posts set hearts_count = hearts_count + 1 where id = new.post_id;
  elsif (tg_op = 'DELETE') then
    update public.community_posts set hearts_count = greatest(0, hearts_count - 1) where id = old.post_id;
  end if;
  return null;
end;
$$;

create trigger hearts_count_trg
  after insert or delete on public.community_hearts
  for each row execute function public.update_hearts_count();
