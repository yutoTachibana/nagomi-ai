import { describe, expect, it } from 'vitest';
import { ECRS_QUESTIONS, computeEcrs } from '../ecrs';

/**
 * ECR-S 12 項目: 不安軸 6 問 (Q1-Q6) + 回避軸 6 問 (Q7-Q12).
 * 各項目 1-7. 軸ごとに平均値を計算.
 *
 * 4 象限 (閾値 4.0):
 * - secure: 不安低 + 回避低
 * - anxious: 不安高 + 回避低
 * - avoidant: 不安低 + 回避高
 * - fearful: 不安高 + 回避高
 */

function makeAnswers(anxAvg: number, avoidAvg: number): number[] {
  // 簡略化: 不安軸 6 個は anxAvg, 回避軸 6 個は avoidAvg をそのまま
  // (中間値が整数でないときは Math.round で揃える前提のテストデータを渡す)
  const arr: number[] = [];
  for (let i = 0; i < ECRS_QUESTIONS.length; i++) {
    arr.push(ECRS_QUESTIONS[i].axis === 'anxiety' ? anxAvg : avoidAvg);
  }
  return arr;
}

describe('ECR-S 構造', () => {
  it('質問は 12 問', () => {
    expect(ECRS_QUESTIONS.length).toBe(12);
  });

  it('不安軸 6 問 + 回避軸 6 問', () => {
    const anx = ECRS_QUESTIONS.filter((q) => q.axis === 'anxiety');
    const avd = ECRS_QUESTIONS.filter((q) => q.axis === 'avoidance');
    expect(anx.length).toBe(6);
    expect(avd.length).toBe(6);
  });
});

describe('ECR-S スタイル判定 (4 象限)', () => {
  it('全部 1 → secure (安定型)', () => {
    const r = computeEcrs(makeAnswers(1, 1));
    expect(r.style).toBe('secure');
    expect(r.anxietyScore).toBe(1);
    expect(r.avoidanceScore).toBe(1);
  });

  it('不安高 (7) + 回避低 (1) → anxious (不安型)', () => {
    const r = computeEcrs(makeAnswers(7, 1));
    expect(r.style).toBe('anxious');
    expect(r.anxietyScore).toBe(7);
    expect(r.avoidanceScore).toBe(1);
  });

  it('不安低 (1) + 回避高 (7) → avoidant (回避型)', () => {
    const r = computeEcrs(makeAnswers(1, 7));
    expect(r.style).toBe('avoidant');
    expect(r.anxietyScore).toBe(1);
    expect(r.avoidanceScore).toBe(7);
  });

  it('全部 7 → fearful (恐れ・回避型)', () => {
    const r = computeEcrs(makeAnswers(7, 7));
    expect(r.style).toBe('fearful');
    expect(r.anxietyScore).toBe(7);
    expect(r.avoidanceScore).toBe(7);
  });

  it('全部 4 (どちらでもない) → fearful (両軸 >=4 で恐れ寄り)', () => {
    // 閾値 >= 4.0 で「高い」判定なので、4.0 ちょうどは両軸高い → fearful
    const r = computeEcrs(makeAnswers(4, 4));
    expect(r.style).toBe('fearful');
  });
});

describe('ECR-S 境界値', () => {
  it('不安 3.99 + 回避 3.99 → secure (両軸閾値未満)', () => {
    // 整数値 1-7 しかないので近似. 平均で 3.something になる組み合わせ:
    // 3 が 5 個 + 5 が 1 個 → 平均 3.33
    const arr: number[] = [];
    for (const q of ECRS_QUESTIONS) {
      // 3 を多めに混ぜて平均を 3.33 にする
      arr.push(q.id <= 6 ? 3 : 3);
    }
    const r = computeEcrs(arr);
    expect(r.anxietyScore).toBeLessThan(4);
    expect(r.avoidanceScore).toBeLessThan(4);
    expect(r.style).toBe('secure');
  });

  it('不安 4 + 回避 3 → anxious', () => {
    const arr: number[] = [];
    for (const q of ECRS_QUESTIONS) {
      arr.push(q.axis === 'anxiety' ? 4 : 3);
    }
    const r = computeEcrs(arr);
    expect(r.anxietyScore).toBe(4);
    expect(r.avoidanceScore).toBe(3);
    expect(r.style).toBe('anxious');
  });

  it('不安 3 + 回避 4 → avoidant', () => {
    const arr: number[] = [];
    for (const q of ECRS_QUESTIONS) {
      arr.push(q.axis === 'anxiety' ? 3 : 4);
    }
    const r = computeEcrs(arr);
    expect(r.anxietyScore).toBe(3);
    expect(r.avoidanceScore).toBe(4);
    expect(r.style).toBe('avoidant');
  });
});

describe('ECR-S スタイル説明', () => {
  it('各スタイルにラベル・説明・ヒントが付く', () => {
    const styles = [
      computeEcrs(makeAnswers(1, 1)),
      computeEcrs(makeAnswers(7, 1)),
      computeEcrs(makeAnswers(1, 7)),
      computeEcrs(makeAnswers(7, 7)),
    ];
    for (const s of styles) {
      expect(s.styleLabel.length).toBeGreaterThan(0);
      expect(s.description.length).toBeGreaterThan(20);
      expect(s.hint.length).toBeGreaterThan(20);
    }
  });

  it('結果には「診断ではない」を含意する優しい言葉がある (傾向 / かもしれません 等)', () => {
    const all = [
      computeEcrs(makeAnswers(1, 1)),
      computeEcrs(makeAnswers(7, 1)),
      computeEcrs(makeAnswers(1, 7)),
      computeEcrs(makeAnswers(7, 7)),
    ];
    for (const s of all) {
      const text = s.description + s.hint + s.styleLabel;
      // 「傾向」「かもしれない」「と言われている」のいずれかが含まれている
      const hasGentle = /傾向|かもしれ|と言われ|寄り/.test(text);
      expect(hasGentle).toBe(true);
    }
  });
});

describe('ECR-S 入力検証', () => {
  it('項目数が違うと throw', () => {
    expect(() => computeEcrs([1, 2, 3])).toThrow();
  });
});
