/**
 * 精神科で処方されやすい薬のサジェスト候補.
 *
 * 設計方針:
 * - 商品名 (利用者が薬手帳で目にする名前) を中心
 * - 一般名 (成分名) は alias として持つ. 入力中のマッチに使う
 * - 順序は処方頻度や馴染みの深さを参考にざっくり並べる
 * - 完全網羅は目指さない. 入力補助としての候補が出ればよい
 *
 * 注意: ここにある = 推奨ではない. 薬の判断は必ず主治医と.
 */

export interface MedicationSuggestion {
  /** 商品名 (主に表示・登録に使う) */
  name: string;
  /** 別名・一般名 (検索マッチ用) */
  aliases?: string[];
  /** 大まかなカテゴリ (UI で参考表示) */
  category: 'antidepressant' | 'anxiolytic' | 'mood_stabilizer' | 'antipsychotic' | 'sleep' | 'adhd' | 'other';
}

export const MEDICATION_SUGGESTIONS: MedicationSuggestion[] = [
  // --- 抗うつ薬 (SSRI) ---
  { name: 'レクサプロ', aliases: ['エスシタロプラム', 'lexapro'], category: 'antidepressant' },
  { name: 'ジェイゾロフト', aliases: ['セルトラリン', 'jzoloft'], category: 'antidepressant' },
  { name: 'パキシル', aliases: ['パロキセチン', 'paxil'], category: 'antidepressant' },
  { name: 'デプロメール', aliases: ['フルボキサミン', 'depromel'], category: 'antidepressant' },
  { name: 'ルボックス', aliases: ['フルボキサミン', 'luvox'], category: 'antidepressant' },
  // --- 抗うつ薬 (SNRI) ---
  { name: 'サインバルタ', aliases: ['デュロキセチン', 'cymbalta'], category: 'antidepressant' },
  { name: 'イフェクサー', aliases: ['ベンラファキシン', 'effexor'], category: 'antidepressant' },
  { name: 'トレドミン', aliases: ['ミルナシプラン'], category: 'antidepressant' },
  // --- 抗うつ薬 (NaSSA) ---
  { name: 'リフレックス', aliases: ['ミルタザピン', 'reflex'], category: 'antidepressant' },
  { name: 'レメロン', aliases: ['ミルタザピン', 'remeron'], category: 'antidepressant' },
  // --- 抗うつ薬 (その他) ---
  { name: 'トリンテリックス', aliases: ['ボルチオキセチン', 'trintellix'], category: 'antidepressant' },
  { name: 'リフレックス OD', aliases: ['ミルタザピン'], category: 'antidepressant' },
  { name: 'アナフラニール', aliases: ['クロミプラミン'], category: 'antidepressant' },
  { name: 'トフラニール', aliases: ['イミプラミン'], category: 'antidepressant' },

  // --- 抗不安薬 (BZ) ---
  { name: 'デパス', aliases: ['エチゾラム', 'depas'], category: 'anxiolytic' },
  { name: 'ソラナックス', aliases: ['アルプラゾラム', 'solanax'], category: 'anxiolytic' },
  { name: 'コンスタン', aliases: ['アルプラゾラム'], category: 'anxiolytic' },
  { name: 'レキソタン', aliases: ['ブロマゼパム', 'lexotan'], category: 'anxiolytic' },
  { name: 'ワイパックス', aliases: ['ロラゼパム', 'wypax'], category: 'anxiolytic' },
  { name: 'メイラックス', aliases: ['ロフラゼプ酸エチル'], category: 'anxiolytic' },
  { name: 'リーゼ', aliases: ['クロチアゼパム'], category: 'anxiolytic' },
  { name: 'セルシン', aliases: ['ジアゼパム'], category: 'anxiolytic' },

  // --- 気分安定薬 ---
  { name: 'リーマス', aliases: ['炭酸リチウム', 'lithium'], category: 'mood_stabilizer' },
  { name: 'デパケン', aliases: ['バルプロ酸', 'depakene'], category: 'mood_stabilizer' },
  { name: 'デパケン R', aliases: ['バルプロ酸'], category: 'mood_stabilizer' },
  { name: 'ラミクタール', aliases: ['ラモトリギン', 'lamictal'], category: 'mood_stabilizer' },
  { name: 'テグレトール', aliases: ['カルバマゼピン', 'tegretol'], category: 'mood_stabilizer' },

  // --- 抗精神病薬 ---
  { name: 'エビリファイ', aliases: ['アリピプラゾール', 'abilify'], category: 'antipsychotic' },
  { name: 'レキサルティ', aliases: ['ブレクスピプラゾール', 'rexulti'], category: 'antipsychotic' },
  { name: 'ラツーダ', aliases: ['ルラシドン', 'latuda'], category: 'antipsychotic' },
  { name: 'ジプレキサ', aliases: ['オランザピン', 'zyprexa'], category: 'antipsychotic' },
  { name: 'リスパダール', aliases: ['リスペリドン', 'risperdal'], category: 'antipsychotic' },
  { name: 'セロクエル', aliases: ['クエチアピン', 'seroquel'], category: 'antipsychotic' },
  { name: 'インヴェガ', aliases: ['パリペリドン', 'invega'], category: 'antipsychotic' },
  { name: 'ロナセン', aliases: ['ブロナンセリン'], category: 'antipsychotic' },

  // --- 睡眠薬 ---
  { name: 'マイスリー', aliases: ['ゾルピデム', 'myslee'], category: 'sleep' },
  { name: 'アモバン', aliases: ['ゾピクロン', 'amoban'], category: 'sleep' },
  { name: 'ルネスタ', aliases: ['エスゾピクロン', 'lunesta'], category: 'sleep' },
  { name: 'ベルソムラ', aliases: ['スボレキサント', 'belsomra'], category: 'sleep' },
  { name: 'デエビゴ', aliases: ['レンボレキサント', 'dayvigo'], category: 'sleep' },
  { name: 'ロゼレム', aliases: ['ラメルテオン', 'rozerem'], category: 'sleep' },
  { name: 'ハルシオン', aliases: ['トリアゾラム', 'halcion'], category: 'sleep' },
  { name: 'レンドルミン', aliases: ['ブロチゾラム'], category: 'sleep' },
  { name: 'サイレース', aliases: ['フルニトラゼパム', 'silece'], category: 'sleep' },
  { name: 'ロゼレム OD', aliases: ['ラメルテオン'], category: 'sleep' },

  // --- ADHD ---
  { name: 'ストラテラ', aliases: ['アトモキセチン', 'strattera'], category: 'adhd' },
  { name: 'コンサータ', aliases: ['メチルフェニデート', 'concerta'], category: 'adhd' },
  { name: 'インチュニブ', aliases: ['グアンファシン', 'intuniv'], category: 'adhd' },
  { name: 'ビバンセ', aliases: ['リスデキサンフェタミン', 'vyvanse'], category: 'adhd' },

  // --- その他 (頓服・漢方含) ---
  { name: '半夏厚朴湯', aliases: ['ハンゲコウボクトウ'], category: 'other' },
  { name: '加味逍遥散', aliases: ['カミショウヨウサン'], category: 'other' },
  { name: '抑肝散', aliases: ['ヨクカンサン'], category: 'other' },
  { name: '酸棗仁湯', aliases: ['サンソウニントウ'], category: 'other' },
];

export const CATEGORY_LABEL: Record<MedicationSuggestion['category'], string> = {
  antidepressant: '抗うつ薬',
  anxiolytic: '抗不安薬',
  mood_stabilizer: '気分安定薬',
  antipsychotic: '抗精神病薬',
  sleep: '睡眠薬',
  adhd: 'ADHD治療薬',
  other: 'その他',
};

/**
 * 入力に対して候補を絞り込む.
 * - 商品名・別名のどちらかに前方一致 or 部分一致で照合
 * - 大文字小文字を無視. ひらがな⇄カタカナの揺れも吸収
 */
export function searchMedications(query: string, limit = 8): MedicationSuggestion[] {
  const q = normalize(query);
  if (!q) return [];

  const scored = MEDICATION_SUGGESTIONS.map((m) => {
    const candidates = [m.name, ...(m.aliases ?? [])].map(normalize);
    let bestScore = -1;
    for (const c of candidates) {
      if (c === q) bestScore = Math.max(bestScore, 100);
      else if (c.startsWith(q)) bestScore = Math.max(bestScore, 50);
      else if (c.includes(q)) bestScore = Math.max(bestScore, 10);
    }
    return { m, score: bestScore };
  }).filter((x) => x.score > 0);

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((x) => x.m);
}

/**
 * ひらがな↔カタカナ揺れの吸収 + 小文字化.
 */
function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[ぁ-ゖ]/g, (ch) => String.fromCharCode(ch.charCodeAt(0) + 0x60));
}
