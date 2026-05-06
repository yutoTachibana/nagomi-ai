/**
 * 服薬中によくある副作用のリスト.
 * 利用者が選びやすいよう、よくあるものを並べる. 「該当なし」は別途扱う.
 *
 * 設計方針:
 * - 「副作用かどうか自分で判断しなくていい. ただ気になることを記録する」スタンス
 * - カテゴリでまとめて選びやすく
 * - 自由入力 (custom) も最後に置く
 */

export interface SideEffectType {
  key: string;
  label: string;
  category: 'physical' | 'cognitive' | 'emotional' | 'sexual' | 'sleep' | 'other';
}

export const SIDE_EFFECT_TYPES: SideEffectType[] = [
  // 身体
  { key: 'drowsiness', label: '眠気・だるさ', category: 'physical' },
  { key: 'dry_mouth', label: '口の渇き', category: 'physical' },
  { key: 'nausea', label: '吐き気', category: 'physical' },
  { key: 'constipation', label: '便秘', category: 'physical' },
  { key: 'diarrhea', label: '下痢', category: 'physical' },
  { key: 'headache', label: '頭痛', category: 'physical' },
  { key: 'dizziness', label: 'めまい・ふらつき', category: 'physical' },
  { key: 'palpitations', label: '動悸', category: 'physical' },
  { key: 'tremor', label: '手の震え', category: 'physical' },
  { key: 'sweating', label: '異常な発汗', category: 'physical' },
  { key: 'weight_gain', label: '体重が増えた', category: 'physical' },
  { key: 'weight_loss', label: '体重が減った', category: 'physical' },
  { key: 'appetite_increase', label: '食欲が増した', category: 'physical' },
  { key: 'appetite_loss', label: '食欲が落ちた', category: 'physical' },

  // 認知・感情
  { key: 'fog', label: '頭がぼんやりする', category: 'cognitive' },
  { key: 'memory', label: '物忘れがある', category: 'cognitive' },
  { key: 'concentration', label: '集中できない', category: 'cognitive' },
  { key: 'flat', label: '感情が薄くなった', category: 'emotional' },
  { key: 'irritable', label: 'いらいらする', category: 'emotional' },
  { key: 'restless', label: '落ち着かない', category: 'emotional' },

  // 睡眠
  { key: 'insomnia', label: '眠れない', category: 'sleep' },
  { key: 'oversleep', label: '寝すぎてしまう', category: 'sleep' },
  { key: 'nightmares', label: '悪夢を見る', category: 'sleep' },

  // 性
  { key: 'sexual', label: '性に関すること', category: 'sexual' },

  // その他
  { key: 'other', label: 'その他', category: 'other' },
];

export const SIDE_EFFECT_CATEGORY_LABEL: Record<SideEffectType['category'], string> = {
  physical: '身体',
  cognitive: '認知',
  emotional: '感情',
  sexual: '性',
  sleep: '睡眠',
  other: 'その他',
};
