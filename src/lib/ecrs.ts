/**
 * ECR-S (Experiences in Close Relationships - Short form) 12 項目版.
 *
 * 出典: Wei, Russell, Mallinckrodt, & Vogel (2007) — 学術利用可.
 * 日本語訳は研究文献を参考に、本アプリの語感に合わせて再構成.
 *
 * 重要: これは **自己理解のためのリフレクションツール** であり診断ではない.
 * 結果でラベル貼りをせず「傾向」として扱う.
 */

export type AttachmentStyle = 'secure' | 'anxious' | 'avoidant' | 'fearful';

export interface EcrsQuestion {
  id: number;
  text: string;
  /** どの軸の項目か */
  axis: 'anxiety' | 'avoidance';
  /** 逆転項目 (8 - score) */
  reverse?: boolean;
}

export const ECRS_QUESTIONS: EcrsQuestion[] = [
  // ----- 不安軸 (Anxiety: 見捨てられ不安・拒絶への過敏) -----
  { id: 1, text: '大切な人が、本当の意味では私を愛してくれていないかもしれないと心配になる', axis: 'anxiety' },
  { id: 2, text: '大切な人を失ってしまうのではないかと、よく心配になる', axis: 'anxiety' },
  { id: 3, text: '大切な人と離れているとき、つながりが薄れていくような気がする', axis: 'anxiety' },
  { id: 4, text: '大切な人が、私のことをそんなに大切に思っていないのではと不安になる', axis: 'anxiety' },
  { id: 5, text: '近づきたいと強く思うけれど、それで相手を遠ざけてしまうことがある', axis: 'anxiety' },
  { id: 6, text: '相手の反応がいつもよりそっけないと、自分が悪いことをしたかと考えてしまう', axis: 'anxiety' },

  // ----- 回避軸 (Avoidance: 親密さや依存を避ける) -----
  { id: 7, text: '大切な人に頼ることに抵抗がある', axis: 'avoidance' },
  { id: 8, text: '深い気持ちは、大切な人にも見せたくない', axis: 'avoidance' },
  { id: 9, text: '誰かと親密になりすぎることが、息苦しく感じる', axis: 'avoidance' },
  { id: 10, text: '相手に頼られると、距離を取りたくなる', axis: 'avoidance' },
  { id: 11, text: '一人でいる時間が、強く必要だと感じる', axis: 'avoidance' },
  { id: 12, text: '困ったときに、誰かを頼るより自分で何とかする方が落ち着く', axis: 'avoidance' },
];

/** 1-7 のリッカート尺度. 真ん中は 4 (どちらでもない) */
export const ECRS_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '全くそう思わない' },
  { value: 2, label: 'そう思わない' },
  { value: 3, label: 'あまりそう思わない' },
  { value: 4, label: 'どちらでもない' },
  { value: 5, label: '少しそう思う' },
  { value: 6, label: 'そう思う' },
  { value: 7, label: 'とてもそう思う' },
];

/** 高低の判定閾値 (中央 4 より上を「高め」とする) */
const HIGH_THRESHOLD = 4.0;

export interface EcrsResult {
  /** 不安軸の平均 (1-7) */
  anxietyScore: number;
  /** 回避軸の平均 (1-7) */
  avoidanceScore: number;
  /** 推定スタイル */
  style: AttachmentStyle;
  /** スタイルの呼び方 */
  styleLabel: string;
  /** 説明 */
  description: string;
  /** ヒント (短い) */
  hint: string;
}

const STYLE_INFO: Record<AttachmentStyle, { label: string; description: string; hint: string }> = {
  secure: {
    label: '安定型 (傾向)',
    description: '人と適度な距離をとりつつ、必要なときに頼る・頼られることに大きな葛藤がない傾向です. ストレスがあっても関係を続けやすいタイプです.',
    hint: 'いまの安心感を大切に. 周りに不安型・回避型の傾向がある人がいたら、自分の落ち着きが安全基地になることがあります.',
  },
  anxious: {
    label: '不安型 (とらわれ寄り)',
    description: '相手の反応に敏感で、見捨てられる不安が強くなりやすい傾向です. 関係を大切にする力でもあります.',
    hint: '不安が強いとき「相手の反応 ≠ 自分の価値」と切り分けて呼吸を整える練習が効くと言われています. 安心して頼れる人を 1-2 人持っておく.',
  },
  avoidant: {
    label: '回避型 (距離寄り)',
    description: '深く関わると息苦しく感じて距離を取る傾向です. 自立できる強みでもあります.',
    hint: '頼ることが「弱さ」ではなく「つながりの形」と気づくと楽になることがあります. 小さな範囲で頼ることを練習してみても.',
  },
  fearful: {
    label: '恐れ・回避型 (近づきたいけれど怖い)',
    description: '近づきたい気持ちと、近づくと怖くなる気持ちが両方ある傾向です. これまでの経験で身についた、揺れやすい状態です.',
    hint: '一人で扱うのは難しいことが多いタイプです. 信頼できるカウンセラーや主治医と一緒に、少しずつ安全な関係を経験できると変化が起きやすいと言われています.',
  },
};

export function computeEcrs(itemScores: number[]): EcrsResult {
  if (itemScores.length !== ECRS_QUESTIONS.length) {
    throw new Error('itemScores length mismatch');
  }

  const anxietyVals: number[] = [];
  const avoidanceVals: number[] = [];

  for (let i = 0; i < ECRS_QUESTIONS.length; i++) {
    const q = ECRS_QUESTIONS[i];
    const raw = itemScores[i];
    const v = q.reverse ? 8 - raw : raw;
    if (q.axis === 'anxiety') anxietyVals.push(v);
    else avoidanceVals.push(v);
  }

  const anxiety = avg(anxietyVals);
  const avoidance = avg(avoidanceVals);

  const highAnx = anxiety >= HIGH_THRESHOLD;
  const highAvd = avoidance >= HIGH_THRESHOLD;

  let style: AttachmentStyle;
  if (!highAnx && !highAvd) style = 'secure';
  else if (highAnx && !highAvd) style = 'anxious';
  else if (!highAnx && highAvd) style = 'avoidant';
  else style = 'fearful';

  const info = STYLE_INFO[style];
  return {
    anxietyScore: Math.round(anxiety * 10) / 10,
    avoidanceScore: Math.round(avoidance * 10) / 10,
    style,
    styleLabel: info.label,
    description: info.description,
    hint: info.hint,
  };
}

function avg(arr: number[]): number {
  if (arr.length === 0) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
