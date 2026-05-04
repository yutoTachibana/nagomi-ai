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
【最重要】利用者は今すぐの危機にある可能性があります。次の応答は厳密に以下の構造に従ってください:

1. まず利用者を否定せず、しんどさを受け止める短い言葉 (1-2 文)
2. 専門の支援につながることをそっと提案する
3. 以下のいずれかの連絡先のうち、利用者の状況に合うものを 1-2 個だけ伝える:
   - よりそいホットライン (24時間無料): 0120-279-338
   - いのちの電話: 0570-783-556
   - 命の危険があるときは 119 番
4. 「あなたが今ここにいてくれて良かった」のような存在肯定で締める

絶対にしてはいけないこと:
- 解決策を一気に提示すること
- 「大丈夫」「気のせい」と否定すること
- 長い説教
- 自己解決を促すこと
- 楽観的な未来予測 ("きっと良くなる" など)
`.trim();
  }

  // concern レベル
  return `
利用者は強いつらさを表現しています。次のことを心がけてください:

- まず受け止める言葉から始める
- すぐに解決策を提示しない
- 「もし良ければ」と前置きしてから、必要に応じてよりそいホットライン (0120-279-338) を案内
- 第三者についての話 / 過去の話の場合、本人の今の安全をやんわり確認する
- 利用者の感情を裁定しない

会話の最後に、画面下に表示される「緊急時サポート」ボタンの存在をそっと触れても良いです。
`.trim();
}

/**
 * 日本国内のクライシスリソース.
 * 必ず最新の番号を確認すること. 番号が古いと逆効果.
 */
export const CRISIS_RESOURCES = [
  {
    id: 'yorisoi',
    name: 'よりそいホットライン',
    phone: '0120-279-338',
    description: '24時間無料・通話無料。どんな悩みでも。',
    available: '24時間 365日',
    url: 'https://www.since2011.net/yorisoi/',
  },
  {
    id: 'inochi',
    name: 'いのちの電話',
    phone: '0570-783-556',
    description: '一人で抱え込まず、まずは電話で。',
    available: '10:00 - 22:00',
    url: 'https://www.inochinodenwa.org/',
  },
  {
    id: 'tell',
    name: 'TELL Lifeline',
    phone: '03-5774-0992',
    description: '英語対応。日本在住の英語話者向け。',
    available: '9:00 - 23:00',
    url: 'https://telljp.com/',
  },
  {
    id: 'kokoro',
    name: 'こころの健康相談統一ダイヤル',
    phone: '0570-064-556',
    description: '各都道府県の精神保健福祉センターにつながります。',
    available: '都道府県により異なる',
    url: 'https://www.mhlw.go.jp/',
  },
  {
    id: 'emergency',
    name: '緊急通報 (生命の危険があるとき)',
    phone: '119',
    description: '救急車・命の危機があるときは迷わず。',
    available: '24時間',
    url: null,
  },
] as const;
