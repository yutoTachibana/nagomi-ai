/**
 * クライシス検知モジュール
 *
 * 設計思想:
 *  - **誤判定が利用者を傷つける** ことを最優先で考える
 *  - 機械学習による感情分析は使わない (誤判定リスクが大きすぎる)
 *  - キーワードマッチで確実に拾う層 + 文脈で判定する層の二段
 *  - 検知=「警告を出す」ではなく「専門リソースを優しく差し出す」
 *  - 利用者が普通に「死にたいくらいしんどかった」と過去を話す文脈と
 *    今まさに行動に移そうとしている文脈を区別する努力をする
 *
 * 重要: このファイルの判定結果は本文を保存しない. type のみ safety_events へ.
 */

// 直接的な危機表現 (ほぼ確実に拾うべき)
const CRITICAL_KEYWORDS = [
  '死にたい',
  '消えたい',
  '殺して',
  '自殺',
  '自死',
  'リスカ',
  'リストカット',
  '自傷',
  'OD',
  'オーバードーズ',
  '飛び降り',
  '首吊',
  '首をつ',
  '練炭',
  '楽になりたい',  // 文脈次第だが拾う
  'もう生きていけない',
  '生きてる意味がない',
  'いなくなりたい',
  '生きるのが辛い',
  '生きるのがつらい',
  '生きるのがしんどい',
  '死ぬほど辛い',
  '死ぬほどつらい',
];

// 過去形 / 仮定形のヒント (誤検知を減らすための補助)
// 例: 「昔は死にたかった」「死にたいって思うこともある」
const PAST_OR_HYPOTHETICAL_HINTS = [
  '昔',
  '前は',
  '以前',
  '過去',
  '若い頃',
  'こともある',
  'こともあった',
  '思っていた',
  'と聞いた',
];

// 第三者についての言及 (「友達が死にたいと言っている」)
const THIRD_PARTY_HINTS = [
  '友達が',
  '友人が',
  '彼が',
  '彼女が',
  '家族が',
  '母が',
  '父が',
  '同僚が',
  '相談された',
  'と言っている',
  'と話していた',
];

// 直近の意図を示すサイン (緊急度高)
const IMMINENT_HINTS = [
  '今夜',
  '今日',
  'もう限界',
  '準備した',
  '遺書',
  'さよなら',
  'これで終わり',
  '最後の',
  'もう無理',
];

export interface CrisisCheckResult {
  /** 何らかの懸念が検出されたか */
  flagged: boolean;
  /** 緊急度. 'imminent' は即座にリソース提示 */
  level: 'none' | 'concern' | 'imminent';
  /** 過去/第三者の文脈ヒントがあるか */
  contextual_softener: boolean;
  /** マッチしたカテゴリ (デバッグ用. **DB には保存しない**) */
  matched_categories: string[];
}

/**
 * テキストをスキャンして危機表現を検出する.
 * 結果の matched_categories は永続化しないこと.
 */
export function checkCrisis(text: string): CrisisCheckResult {
  const normalized = text.normalize('NFKC');

  const matched: string[] = [];

  const hitsCritical = CRITICAL_KEYWORDS.some((kw) => normalized.includes(kw));
  if (hitsCritical) matched.push('critical');

  const hitsImminent = IMMINENT_HINTS.some((kw) => normalized.includes(kw));
  if (hitsImminent) matched.push('imminent');

  const hitsPastHypothetical = PAST_OR_HYPOTHETICAL_HINTS.some((kw) =>
    normalized.includes(kw),
  );
  const hitsThirdParty = THIRD_PARTY_HINTS.some((kw) => normalized.includes(kw));

  const contextualSoftener = hitsPastHypothetical || hitsThirdParty;

  if (!hitsCritical) {
    return {
      flagged: false,
      level: 'none',
      contextual_softener: contextualSoftener,
      matched_categories: matched,
    };
  }

  // critical を含み、かつ imminent も含む → 即時対応レベル
  if (hitsImminent && !hitsThirdParty) {
    return {
      flagged: true,
      level: 'imminent',
      contextual_softener: contextualSoftener,
      matched_categories: matched,
    };
  }

  // critical のみ → 懸念レベル (リソース提示するが穏やかに)
  return {
    flagged: true,
    level: 'concern',
    contextual_softener: contextualSoftener,
    matched_categories: matched,
  };
}

/**
 * 危機検出時に AI に追加させるシステム指示.
 * **元のシステムプロンプトに上書きするのではなく追記する**.
 */
export function getCrisisPrompt(result: CrisisCheckResult): string | null {
  if (!result.flagged) return null;

  if (result.level === 'imminent') {
    return `
<crisis_imminent>
利用者は今すぐの危機にある可能性があります. 次の 3 段階で応答してください (Dartmouth Therabot RCT で有効性が示された構造).

1. **共感を 1-2 文** で. 「言葉にしてここに来てくれたこと、受け止めています」のように
2. **適切なリソースを 1-2 個だけ** 提示. 利用者の状況に合うものを選ぶ:
   - 若年女性向け: #いのちSOS LINE 相談 (https://www.lifelink.or.jp/inochisos/)
   - 24時間電話: よりそいホットライン (0120-279-338, 通話無料)
   - 命の危険があるとき: 119
3. **本題に戻りたいか確認**. 「もう少しこのしんどさを話したいか、別のことでも聞いてほしいか、教えてください」

絶対にしないこと:
- 解決策を一気に提示する
- 「大丈夫」「気のせい」と否定する
- 長い説教
- 「あなたが消えたら悲しい」のような感情的圧力
- 楽観的な未来予測 ("きっと良くなる" など)
- 同じセッションで一度提示したリソースを繰り返す
</crisis_imminent>
`.trim();
  }

  // concern レベル
  return `
<crisis_concern>
利用者は強いつらさを表現しています. 次の点を心がけてください:

- まず受け止める言葉から始める
- すぐに解決策を提示しない
- 「もし良ければ」と前置きしてから、必要なときだけ #いのちSOS の LINE 相談 (https://www.lifelink.or.jp/inochisos/) または よりそいホットライン (0120-279-338) を 1 つだけ案内. 過剰に提示しない
- 第三者についての話 / 過去の話の場合、本人の今の安全をやんわり 1 度だけ確認する
- 利用者の感情を裁定しない
- リソースを提示したあとも、利用者が話したいことに会話を戻す

画面下の「緊急時サポート」ボタンの存在を、必要を感じたときだけ静かに触れても構いません.
</crisis_concern>
`.trim();
}

/**
 * 日本国内のクライシスリソース.
 * 必ず最新の番号を確認すること. 番号が古いと逆効果.
 *
 * 若年層 (特に 20-30 代女性) は電話よりチャット/LINE 相談の利用率が高いため、
 * #いのちSOS / 生きづらびっと を上位に配置.
 */
export const CRISIS_RESOURCES = [
  {
    id: 'inochisos',
    name: '#いのちSOS',
    phone: '0120-061-338',
    description: 'チャット・電話どちらも対応. 若年層も気軽に使えます.',
    available: '電話: 平日12-22時/土日12-17時, LINE 相談あり',
    url: 'https://www.lifelink.or.jp/inochisos/',
  },
  {
    id: 'ikidura',
    name: '生きづらびっと (LINE 相談)',
    phone: null,
    description: 'LINE で相談できる. 文字でやり取りしたい人向け.',
    available: '月・火・木・金・日 17-22時 (受付21:30まで)',
    url: 'https://yorisoi-chat.jp/',
  },
  {
    id: 'yorisoi',
    name: 'よりそいホットライン',
    phone: '0120-279-338',
    description: '24時間無料. どんな悩みでも.',
    available: '24時間 365日',
    url: 'https://www.since2011.net/yorisoi/',
  },
  {
    id: 'inochi',
    name: 'いのちの電話',
    phone: '0570-783-556',
    description: '一人で抱え込まず、まずは電話で.',
    available: '10:00 - 22:00',
    url: 'https://www.inochinodenwa.org/',
  },
  {
    id: 'tell',
    name: 'TELL Lifeline',
    phone: '03-5774-0992',
    description: '英語対応. 日本在住の英語話者向け.',
    available: '9:00 - 23:00',
    url: 'https://telljp.com/',
  },
  {
    id: 'kokoro',
    name: 'こころの健康相談統一ダイヤル',
    phone: '0570-064-556',
    description: '各都道府県の精神保健福祉センターにつながります.',
    available: '都道府県により異なる',
    url: 'https://www.mhlw.go.jp/',
  },
  {
    id: 'emergency',
    name: '緊急通報 (生命の危険があるとき)',
    phone: '119',
    description: '救急車・命の危機があるときは迷わず.',
    available: '24時間',
    url: null,
  },
] as const;
