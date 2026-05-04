import type { CognitiveDistortion } from '@/types/db';

interface DistortionInfo {
  key: CognitiveDistortion;
  name: string;
  description: string;
  example: string;
}

export const COGNITIVE_DISTORTIONS: DistortionInfo[] = [
  {
    key: 'all_or_nothing',
    name: '全か無か思考',
    description: '物事を白か黒か、完璧か失敗かでしか見られなくなる',
    example: '「一つでもミスしたら、もう終わりだ」',
  },
  {
    key: 'overgeneralization',
    name: '過度の一般化',
    description: '一度の出来事を、すべてに当てはめてしまう',
    example: '「また失敗した。私はいつもこうだ」',
  },
  {
    key: 'mental_filter',
    name: '心のフィルター',
    description: '良いことが見えず、悪いことばかりが目に入る',
    example: '「9 個褒められたけど、1 個の指摘ばかり気になる」',
  },
  {
    key: 'disqualifying',
    name: 'プラスの否定',
    description: '良かったことを「たまたま」「運」と片づけてしまう',
    example: '「うまくいったのは、相手が優しかっただけ」',
  },
  {
    key: 'mind_reading',
    name: '読心',
    description: '相手の心を勝手に読み、ネガティブに決めつける',
    example: '「絶対に嫌われたに違いない」',
  },
  {
    key: 'fortune_telling',
    name: '占い思考',
    description: '根拠なく未来を悲観的に予言する',
    example: '「どうせまた失敗するに決まっている」',
  },
  {
    key: 'magnification',
    name: '拡大解釈',
    description: '小さな失敗を大ごとに膨らませる',
    example: '「メールの誤字一つで、もう信用を失った」',
  },
  {
    key: 'minimization',
    name: '縮小解釈',
    description: '自分の良いところや成功を、過小評価する',
    example: '「これくらい誰でもできる」',
  },
  {
    key: 'emotional_reasoning',
    name: '感情的決めつけ',
    description: '「そう感じる=そうである」と思い込む',
    example: '「不安だから、きっと危険なんだ」',
  },
  {
    key: 'should_statements',
    name: '〜すべき思考',
    description: '「〜すべき」「〜でなければ」で自分を縛る',
    example: '「もっと頑張るべきなのに、私はダメだ」',
  },
  {
    key: 'labeling',
    name: 'レッテル貼り',
    description: '一つの行動から、自分や他人にレッテルを貼る',
    example: '「失敗した。私はダメ人間だ」',
  },
  {
    key: 'personalization',
    name: '自己関連付け',
    description: '自分のせいではないことまで、自分のせいにする',
    example: '「友達が機嫌悪い…私が何かしたのかも」',
  },
];

export const DISTORTION_BY_KEY: Record<CognitiveDistortion, DistortionInfo> =
  COGNITIVE_DISTORTIONS.reduce(
    (acc, d) => {
      acc[d.key] = d;
      return acc;
    },
    {} as Record<CognitiveDistortion, DistortionInfo>,
  );

/**
 * 一般的な感情ラベル. ユーザーが選択 + 自由追加できる
 */
export const EMOTION_OPTIONS = [
  '不安', '心配', '恐れ', 'パニック',
  '悲しみ', '空虚', '絶望', '寂しさ',
  '怒り', 'いらだち', 'もどかしさ',
  '罪悪感', '恥', '自己嫌悪',
  '焦り', '緊張', '落ち着かない',
  '疲労', '無気力', '麻痺した感じ',
  '高揚', 'そわそわ', '止まらない感じ',
] as const;
