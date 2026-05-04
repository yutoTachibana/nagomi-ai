// このファイルは手書き. 必要に応じて `supabase gen types typescript` で
// 自動生成版に置き換えても良い (CLAUDE.md 参照)

export type DiagnosisSelfReport =
  | 'anxiety'        // 不安障害
  | 'adjustment'     // 適応障害
  | 'bipolar1'       // 双極 I 型
  | 'bipolar2'       // 双極 II 型
  | 'depression'     // うつ病
  | 'panic'          // パニック障害
  | 'social_anxiety' // 社交不安障害
  | 'other';

export interface Profile {
  id: string;
  display_name: string | null;
  bird_persona: string;
  birth_year: number | null;
  diagnosis_self_report: DiagnosisSelfReport[];
  preferred_check_in_time: string | null; // 'HH:MM'
  onboarding_completed: boolean;
  terms_accepted_version: string | null;
  terms_accepted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoodEntry {
  id: string;
  user_id: string;
  mood_score: 1 | 2 | 3 | 4 | 5;
  energy_level: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  note_encrypted: string | null;
  recorded_at: string;
  created_at: string;
}

export type EmotionEntry = {
  name: string;
  intensity: number; // 0-100
};

export interface ThoughtRecord {
  id: string;
  user_id: string;
  situation_encrypted: string | null;
  emotions_before: EmotionEntry[] | null;
  automatic_thought_encrypted: string | null;
  evidence_for_encrypted: string | null;
  evidence_against_encrypted: string | null;
  balanced_thought_encrypted: string | null;
  emotions_after: EmotionEntry[] | null;
  cognitive_distortions: CognitiveDistortion[];
  created_at: string;
  updated_at: string;
}

// 認知の歪みカタログ. ライブラリ記事と紐づけ可能にしておく
export type CognitiveDistortion =
  | 'all_or_nothing'      // 全か無か思考
  | 'overgeneralization'  // 過度の一般化
  | 'mental_filter'       // 心のフィルター
  | 'disqualifying'       // プラスの否定
  | 'jumping_conclusions' // 結論の飛躍
  | 'mind_reading'        // 読心
  | 'fortune_telling'     // 占い思考
  | 'magnification'       // 拡大解釈
  | 'minimization'        // 縮小解釈
  | 'emotional_reasoning' // 感情的決めつけ
  | 'should_statements'   // 〜すべき思考
  | 'labeling'            // レッテル貼り
  | 'personalization';    // 自己関連付け

export interface JournalEntry {
  id: string;
  user_id: string;
  content_encrypted: string | null;
  prompt_key: string | null;
  created_at: string;
  updated_at: string;
}

export type MindfulnessSessionType =
  | 'breathing_478'     // 4-7-8 呼吸法
  | 'breathing_box'     // ボックス呼吸
  | 'body_scan'         // ボディスキャン
  | 'loving_kindness'   // 慈悲の瞑想
  | 'grounding_54321';  // 5-4-3-2-1 グラウンディング

export interface MindfulnessSession {
  id: string;
  user_id: string;
  session_type: MindfulnessSessionType;
  duration_seconds: number | null;
  completed: boolean;
  started_at: string;
  ended_at: string | null;
}

export interface Conversation {
  id: string;
  user_id: string;
  title: string;
  ever_crisis_flagged: boolean;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content_encrypted: string;
  crisis_flagged: boolean;
  tokens_input: number | null;
  tokens_output: number | null;
  created_at: string;
}

export type SafetyEventType =
  | 'crisis_keyword_detected'
  | 'crisis_resource_shown'
  | 'user_clicked_hotline'
  | 'user_clicked_119'
  | 'crisis_handoff_to_kotone';

export interface SafetyEvent {
  id: string;
  user_id: string;
  event_type: SafetyEventType;
  context_path: string | null;
  created_at: string;
}

// ----------------------------------------------------------------------
// 入力フォーム用 (DB に保存する前の中間型)
// ----------------------------------------------------------------------

export interface MoodEntryInput {
  mood_score: 1 | 2 | 3 | 4 | 5;
  energy_level: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  note?: string; // 平文. 保存前に encrypt
  recorded_at?: string;
}

export interface ThoughtRecordInput {
  situation?: string;
  emotions_before?: EmotionEntry[];
  automatic_thought?: string;
  evidence_for?: string;
  evidence_against?: string;
  balanced_thought?: string;
  emotions_after?: EmotionEntry[];
  cognitive_distortions?: CognitiveDistortion[];
}
