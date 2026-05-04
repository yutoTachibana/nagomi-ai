export interface JournalPrompt {
  key: string;
  text: string;
  category: 'gentle' | 'body' | 'gratitude' | 'reflection' | 'creative';
}

export const JOURNAL_PROMPTS: JournalPrompt[] = [
  // gentle (日常) — 6 prompts
  { key: 'gentle_window', text: '今日、窓の外で気づいたことは？', category: 'gentle' },
  { key: 'gentle_relieved', text: '最近、ほっとした瞬間はありましたか？', category: 'gentle' },
  { key: 'gentle_nearby', text: 'いま手の届くところにある、好きなものは？', category: 'gentle' },
  { key: 'gentle_sound', text: '今日聞こえた音の中で、心地よかったものは？', category: 'gentle' },
  { key: 'gentle_small_joy', text: '最近の小さな「よかった」を一つ思い出すと？', category: 'gentle' },
  { key: 'gentle_weather', text: '今日の天気は、どんな気持ちに似ていますか？', category: 'gentle' },

  // body (からだ) — 6 prompts
  { key: 'body_comfortable', text: 'いま、体のどこがいちばん楽ですか？', category: 'body' },
  { key: 'body_sleep', text: '最後にぐっすり眠れたのはいつでしたか？', category: 'body' },
  { key: 'body_tasty', text: '今日、口にしたもので美味しかったものは？', category: 'body' },
  { key: 'body_warmth', text: '最近、体が温かいと感じた瞬間はありますか？', category: 'body' },
  { key: 'body_breath', text: 'いま、ゆっくり深呼吸してみて。どんな感じがしますか？', category: 'body' },
  { key: 'body_tension', text: '今日、力が抜けた瞬間はありましたか？', category: 'body' },

  // gratitude (ありがとう) — 6 prompts
  { key: 'gratitude_small', text: '今日、小さな「ありがとう」を感じた瞬間は？', category: 'gratitude' },
  { key: 'gratitude_someone', text: '最近、誰かにしてもらって嬉しかったことは？', category: 'gratitude' },
  { key: 'gratitude_self', text: '今日の自分に「よくやったね」と言えることは？', category: 'gratitude' },
  { key: 'gratitude_place', text: '安心できる場所について、少し書いてみませんか？', category: 'gratitude' },
  { key: 'gratitude_thing', text: '毎日使っている、お気に入りのものはありますか？', category: 'gratitude' },
  { key: 'gratitude_nature', text: '最近、自然の中で気持ちよかった瞬間はありますか？', category: 'gratitude' },

  // reflection (ふりかえり) — 6 prompts
  { key: 'reflection_year_ago', text: '1 年前の自分に伝えたいことがあるとしたら？', category: 'reflection' },
  { key: 'reflection_like_me', text: '最近「これは自分らしいな」と思ったことは？', category: 'reflection' },
  { key: 'reflection_learned', text: 'この頃、なんとなく気づいたことはありますか？', category: 'reflection' },
  { key: 'reflection_boundary', text: '最近、「ここまでで十分」と思えたことはありますか？', category: 'reflection' },
  { key: 'reflection_change', text: '去年の今頃と比べて、変わったことはありますか？', category: 'reflection' },
  { key: 'reflection_pace', text: '自分のペースで進めていること、何かありますか？', category: 'reflection' },

  // creative (想像) — 6 prompts
  { key: 'creative_color', text: 'もし今日一日が色だったら、何色でしょう？', category: 'creative' },
  { key: 'creative_talisman', text: '自分のための「お守りの言葉」を作るとしたら？', category: 'creative' },
  { key: 'creative_animal', text: '今の気分を動物にたとえると？', category: 'creative' },
  { key: 'creative_letter', text: '未来の自分に短い手紙を書くとしたら？', category: 'creative' },
  { key: 'creative_season', text: 'いちばん好きな季節の、いちばん好きな瞬間は？', category: 'creative' },
  { key: 'creative_soundtrack', text: '今日の BGM を選ぶとしたら、どんな曲？', category: 'creative' },
];

/**
 * ランダムに count 個のプロンプトを返す.
 * Fisher-Yates シャッフルで偏りなく選択.
 */
export function getRandomPrompts(count: number): JournalPrompt[] {
  const shuffled = [...JOURNAL_PROMPTS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
