import { describe, it, expect } from 'vitest';
import { checkCrisis, getCrisisPrompt } from '../crisis-detector';

describe('checkCrisis', () => {
  it('returns no flag for normal text', () => {
    const result = checkCrisis('天気が良くて気持ちいいですね');
    expect(result.flagged).toBe(false);
    expect(result.level).toBe('none');
    expect(result.matched_categories).toEqual([]);
  });

  it('returns no flag for normal text even if imminent hint matches', () => {
    // '今日' is an imminent hint but without critical keyword, should not flag
    const result = checkCrisis('今日はいい天気ですね');
    expect(result.flagged).toBe(false);
    expect(result.level).toBe('none');
    // imminent hint is still recorded in matched_categories
    expect(result.matched_categories).toContain('imminent');
  });

  it('returns no flag for empty string', () => {
    const result = checkCrisis('');
    expect(result.flagged).toBe(false);
    expect(result.level).toBe('none');
    expect(result.contextual_softener).toBe(false);
    expect(result.matched_categories).toEqual([]);
  });

  it('flags critical keyword with concern level', () => {
    const result = checkCrisis('死にたい');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
    expect(result.matched_categories).toContain('critical');
  });

  it('flags 消えたい as concern', () => {
    const result = checkCrisis('もう消えたいです');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('flags 自殺 as concern', () => {
    const result = checkCrisis('自殺を考えてしまう');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('flags リスカ as concern', () => {
    const result = checkCrisis('リスカしたくなる');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('flags OD (オーバードーズ) as concern', () => {
    const result = checkCrisis('ODしたい');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('flags 楽になりたい as concern', () => {
    const result = checkCrisis('もう楽になりたい');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('flags いなくなりたい as concern', () => {
    const result = checkCrisis('いなくなりたいと思う');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('escalates to imminent when critical + imminent hint present', () => {
    const result = checkCrisis('今夜死にたい');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('imminent');
    expect(result.matched_categories).toContain('critical');
    expect(result.matched_categories).toContain('imminent');
  });

  it('escalates to imminent with もう限界 + critical keyword', () => {
    const result = checkCrisis('もう限界、消えたい');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('imminent');
  });

  it('escalates to imminent with 遺書 + critical keyword', () => {
    const result = checkCrisis('遺書を書いた。自殺する');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('imminent');
  });

  it('escalates to imminent with さよなら + critical keyword', () => {
    const result = checkCrisis('さよなら、もう生きていけない');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('imminent');
  });

  it('sets contextual_softener for past tense mentions', () => {
    // Note: 死にたかった (past tense) does not match 死にたい exactly,
    // so we use a phrase that includes the keyword as-is plus a past hint
    const result = checkCrisis('昔、死にたいと思っていた');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
    expect(result.contextual_softener).toBe(true);
  });

  it('sets contextual_softener for hypothetical phrasing', () => {
    const result = checkCrisis('死にたいって思うこともある');
    expect(result.flagged).toBe(true);
    expect(result.contextual_softener).toBe(true);
  });

  it('sets contextual_softener for 以前 (past reference)', () => {
    const result = checkCrisis('以前は自殺を考えたことがあった');
    expect(result.flagged).toBe(true);
    expect(result.contextual_softener).toBe(true);
  });

  it('sets contextual_softener for third party mentions', () => {
    const result = checkCrisis('友達が死にたいと言っている');
    expect(result.flagged).toBe(true);
    expect(result.contextual_softener).toBe(true);
  });

  it('sets contextual_softener for 相談された', () => {
    const result = checkCrisis('自殺したいと相談された');
    expect(result.flagged).toBe(true);
    expect(result.contextual_softener).toBe(true);
  });

  it('does NOT escalate to imminent when third party + imminent hint', () => {
    // Line 123: hitsImminent && !hitsThirdParty
    const result = checkCrisis('友達が今夜死にたいと言っている');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern'); // NOT imminent
    expect(result.contextual_softener).toBe(true);
    expect(result.matched_categories).toContain('critical');
    expect(result.matched_categories).toContain('imminent');
  });

  it('does NOT escalate when 彼女が + imminent', () => {
    const result = checkCrisis('彼女がもう無理、死にたいと言っている');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
    expect(result.contextual_softener).toBe(true);
  });

  it('handles NFKC normalization (fullwidth characters)', () => {
    // ＯＤ (fullwidth) should normalize to OD
    const result = checkCrisis('ＯＤしたい');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('handles multiple critical keywords', () => {
    const result = checkCrisis('死にたい、自傷もしたい');
    expect(result.flagged).toBe(true);
    // matched_categories should still just have 'critical' once (some() stops at first match)
    expect(result.matched_categories).toContain('critical');
  });

  it('does not flag imminent hints without critical keywords', () => {
    // 'もう限界' alone should not flag since no critical keyword is present
    const result = checkCrisis('もう限界だけど頑張る');
    expect(result.flagged).toBe(false);
    expect(result.level).toBe('none');
  });

  it('does not flag past/hypothetical hints alone', () => {
    const result = checkCrisis('昔はいろいろ大変だった');
    expect(result.flagged).toBe(false);
    expect(result.level).toBe('none');
  });

  it('does not flag third party hints alone', () => {
    const result = checkCrisis('友達が最近元気がない');
    expect(result.flagged).toBe(false);
    expect(result.level).toBe('none');
  });

  it('flags 首吊 variant', () => {
    const result = checkCrisis('首吊りたい');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('flags 練炭', () => {
    const result = checkCrisis('練炭を買いたい');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('flags 飛び降り', () => {
    const result = checkCrisis('飛び降りたい');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('flags 生きてる意味がない', () => {
    const result = checkCrisis('生きてる意味がない');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('contextual_softener is false when no softener hints', () => {
    const result = checkCrisis('死にたい');
    expect(result.contextual_softener).toBe(false);
  });

  it('detects 準備した as imminent with critical keyword', () => {
    const result = checkCrisis('準備した。自殺する');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('imminent');
  });

  it('detects 最後の + critical as imminent', () => {
    const result = checkCrisis('最後のお願い。死にたい');
    expect(result.flagged).toBe(true);
    expect(result.level).toBe('imminent');
  });

  it('handles text with both past and third-party softeners', () => {
    const result = checkCrisis('以前、友人が死にたいと言っていた');
    expect(result.flagged).toBe(true);
    expect(result.contextual_softener).toBe(true);
    expect(result.level).toBe('concern');
  });

  it('returns contextual_softener even when not flagged', () => {
    // Past hint without critical keyword
    const result = checkCrisis('昔のことを思い出した');
    expect(result.flagged).toBe(false);
    expect(result.contextual_softener).toBe(true);
  });
});

describe('getCrisisPrompt', () => {
  it('returns null when not flagged', () => {
    const result = checkCrisis('今日はいい天気ですね');
    expect(getCrisisPrompt(result)).toBeNull();
  });

  it('returns concern-level prompt for concern', () => {
    const result = checkCrisis('死にたい');
    const prompt = getCrisisPrompt(result);
    expect(prompt).not.toBeNull();
    expect(prompt).toContain('つらさを表現しています');
    expect(prompt).toContain('0120-279-338');
    expect(prompt).toContain('緊急時サポート');
  });

  it('returns imminent-level prompt with hotline numbers', () => {
    const result = checkCrisis('今夜死にたい');
    const prompt = getCrisisPrompt(result);
    expect(prompt).not.toBeNull();
    expect(prompt).toContain('crisis_imminent');
    expect(prompt).toContain('0120-279-338');
    expect(prompt).toContain('lifelink.or.jp');
    expect(prompt).toContain('119');
  });

  it('imminent prompt forbids saying 大丈夫', () => {
    const result = checkCrisis('今日、自殺する');
    const prompt = getCrisisPrompt(result);
    expect(prompt).toContain('「大丈夫」「気のせい」と否定する');
  });

  it('concern prompt advises confirming current safety', () => {
    const result = checkCrisis('友達が死にたいと言っている');
    const prompt = getCrisisPrompt(result);
    expect(prompt).toContain('本人の今の安全をやんわり 1 度だけ確認する');
  });
});
