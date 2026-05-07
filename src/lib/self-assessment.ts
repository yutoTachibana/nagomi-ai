/**
 * PHQ-9 / GAD-7 のセルフチェック.
 *
 * 重要: これは **スクリーニング** ツールであり、診断ではない.
 * 結果が高くても診断を意味しない. 利用者には「主治医と一緒に経過を見るためのもの」
 * と伝える.
 *
 * 出典: 著作権はパブリックドメイン (PHQ-9: Pfizer 公式に無料利用可、
 * GAD-7: 同様). 日本語訳は厚労省・国立精神研究所版を参考.
 */

export type ScaleType = 'phq9' | 'gad7';

export interface AssessmentScale {
  type: ScaleType;
  name: string;
  shortName: string;
  description: string;
  /** 過去 N 週間の状態を尋ねる */
  timeFrame: string;
  questions: string[];
  /** スコアラベル (0-3) */
  optionLabels: [string, string, string, string];
  /** スコア帯と所感. score >= threshold[i] で labels[i] を採用 */
  bands: { threshold: number; label: string; advice: string }[];
}

const COMMON_OPTIONS: [string, string, string, string] = [
  '全くない',
  '数日',
  '半分以上',
  'ほとんど毎日',
];

export const PHQ9: AssessmentScale = {
  type: 'phq9',
  name: 'PHQ-9 (こころの健康自己チェック)',
  shortName: 'PHQ-9',
  description: 'うつの程度を見るための、9 つの質問への自己評価です. 診断ではなく、自分の状態を主治医と共有するためのものです.',
  timeFrame: '過去 2 週間',
  questions: [
    '物事に対して興味が湧かない、または楽しめない',
    '気分が落ち込む、憂うつ、または絶望的に感じる',
    '寝つきが悪い、途中で目が覚める、または逆に眠り過ぎる',
    '疲れた感じがする、または気力がない',
    '食欲がない、または食べ過ぎる',
    '自分はダメな人間だ、または家族や周りに申し訳ないと感じる',
    '新聞を読む、テレビを見るなど、集中することが難しい',
    '動きや話し方が遅くなる、または逆にそわそわして落ち着かない',
    '死んだ方がましだ、または自分を傷つけようと思ったことがある',
  ],
  optionLabels: COMMON_OPTIONS,
  bands: [
    { threshold: 0, label: 'ほとんどない', advice: '今のところ、うつ症状は目立っていないようです。' },
    { threshold: 5, label: '軽め', advice: '少しお疲れが見えるかもしれません。生活リズムや休息を意識してみても.' },
    { threshold: 10, label: '中くらい', advice: '一度、主治医や相談窓口に話してみることをおすすめします。' },
    { threshold: 15, label: 'やや強め', advice: '専門家のサポートを受けることを強くおすすめします。' },
    { threshold: 20, label: '強め', advice: '一人で抱え込まず、できるだけ早く専門家につながってください。' },
  ],
};

export const GAD7: AssessmentScale = {
  type: 'gad7',
  name: 'GAD-7 (不安の自己チェック)',
  shortName: 'GAD-7',
  description: '不安の程度を見るための、7 つの質問への自己評価です. 診断ではなく、自分の状態を主治医と共有するためのものです.',
  timeFrame: '過去 2 週間',
  questions: [
    '緊張感、不安感、または神経過敏を感じる',
    '心配することを止められない、コントロールできない',
    'いろいろな心配ごとがありすぎる',
    'くつろぐことができない',
    'じっと座っているのが難しいくらい落ち着かない',
    'いらいらしやすい、怒りっぽくなる',
    'ひどいことが起こるのではないかと不安におびえる',
  ],
  optionLabels: COMMON_OPTIONS,
  bands: [
    { threshold: 0, label: 'ほとんどない', advice: '今のところ、不安は目立っていないようです。' },
    { threshold: 5, label: '軽め', advice: '少し落ち着かない時期かもしれません. 呼吸法や休息を試してみても.' },
    { threshold: 10, label: '中くらい', advice: '一度、主治医や相談窓口に話してみることをおすすめします。' },
    { threshold: 15, label: '強め', advice: '一人で抱え込まず、専門家のサポートを早めに.' },
  ],
};

export const ALL_SCALES = [PHQ9, GAD7];

export function getScale(type: ScaleType): AssessmentScale {
  return type === 'phq9' ? PHQ9 : GAD7;
}

export function interpretScore(scale: AssessmentScale, score: number): { label: string; advice: string } {
  let result = scale.bands[0];
  for (const band of scale.bands) {
    if (score >= band.threshold) result = band;
  }
  return { label: result.label, advice: result.advice };
}

/**
 * 危機シグナル: PHQ-9 の Q9 (希死念慮) のスコアが 1 以上
 * (= 「数日」以上で死を思った) なら、結果ページで crisis ヒントを表示する.
 */
export function isPhq9CrisisSignal(scaleType: ScaleType, itemScores: number[]): boolean {
  if (scaleType !== 'phq9') return false;
  return (itemScores[8] ?? 0) >= 1;
}
