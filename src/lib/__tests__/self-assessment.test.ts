import { describe, expect, it } from 'vitest';
import {
  PHQ9,
  GAD7,
  interpretScore,
  isPhq9CrisisSignal,
  getScale,
} from '../self-assessment';

/**
 * PHQ-9: 9 問 / 各 0-3 / 合計 0-27.
 * バンド: 0-4 ほとんどない / 5-9 軽め / 10-14 中くらい / 15-19 やや強め / 20-27 強め
 */
describe('PHQ-9 スコア解釈', () => {
  it('合計 0 → ほとんどない', () => {
    expect(interpretScore(PHQ9, 0).label).toBe('ほとんどない');
  });

  it('合計 4 → ほとんどない (境界の上限)', () => {
    expect(interpretScore(PHQ9, 4).label).toBe('ほとんどない');
  });

  it('合計 5 → 軽め (境界の最小)', () => {
    expect(interpretScore(PHQ9, 5).label).toBe('軽め');
  });

  it('合計 9 → 軽め (境界の上限)', () => {
    expect(interpretScore(PHQ9, 9).label).toBe('軽め');
  });

  it('合計 10 → 中くらい', () => {
    expect(interpretScore(PHQ9, 10).label).toBe('中くらい');
  });

  it('合計 14 → 中くらい (境界の上限)', () => {
    expect(interpretScore(PHQ9, 14).label).toBe('中くらい');
  });

  it('合計 15 → やや強め', () => {
    expect(interpretScore(PHQ9, 15).label).toBe('やや強め');
  });

  it('合計 19 → やや強め (境界の上限)', () => {
    expect(interpretScore(PHQ9, 19).label).toBe('やや強め');
  });

  it('合計 20 → 強め', () => {
    expect(interpretScore(PHQ9, 20).label).toBe('強め');
  });

  it('合計 27 (満点) → 強め', () => {
    expect(interpretScore(PHQ9, 27).label).toBe('強め');
  });

  it('質問は 9 問', () => {
    expect(PHQ9.questions.length).toBe(9);
  });

  it('Q9 (希死念慮) が含まれている', () => {
    expect(PHQ9.questions[8]).toContain('死');
  });

  it('全バンドにアドバイス文言がある', () => {
    for (const b of PHQ9.bands) {
      expect(b.advice.length).toBeGreaterThan(0);
    }
  });
});

/**
 * PHQ-9 Q9 (希死念慮) の crisis signal:
 * - itemScores[8] >= 1 (= 数日以上で死を思った) なら true
 */
describe('PHQ-9 Q9 危機シグナル', () => {
  it('Q9 = 0 (全くない) → false', () => {
    const scores = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    expect(isPhq9CrisisSignal('phq9', scores)).toBe(false);
  });

  it('Q9 = 1 (数日) → true', () => {
    const scores = [0, 0, 0, 0, 0, 0, 0, 0, 1];
    expect(isPhq9CrisisSignal('phq9', scores)).toBe(true);
  });

  it('Q9 = 2 (半分以上) → true', () => {
    const scores = [0, 0, 0, 0, 0, 0, 0, 0, 2];
    expect(isPhq9CrisisSignal('phq9', scores)).toBe(true);
  });

  it('Q9 = 3 (ほとんど毎日) → true', () => {
    const scores = [0, 0, 0, 0, 0, 0, 0, 0, 3];
    expect(isPhq9CrisisSignal('phq9', scores)).toBe(true);
  });

  it('GAD-7 では常に false (PHQ-9 専用)', () => {
    const scores = [3, 3, 3, 3, 3, 3, 3];
    expect(isPhq9CrisisSignal('gad7', scores)).toBe(false);
  });

  it('Q9 だけ高くて他がゼロでも危機シグナル', () => {
    const scores = [0, 0, 0, 0, 0, 0, 0, 0, 1];
    expect(isPhq9CrisisSignal('phq9', scores)).toBe(true);
    // でも合計は低い
    const total = scores.reduce((a, b) => a + b, 0);
    expect(interpretScore(PHQ9, total).label).toBe('ほとんどない');
  });
});

/**
 * GAD-7: 7 問 / 各 0-3 / 合計 0-21.
 * バンド: 0-4 ほとんどない / 5-9 軽め / 10-14 中くらい / 15-21 強め
 */
describe('GAD-7 スコア解釈', () => {
  it('合計 0 → ほとんどない', () => {
    expect(interpretScore(GAD7, 0).label).toBe('ほとんどない');
  });

  it('合計 4 → ほとんどない (境界の上限)', () => {
    expect(interpretScore(GAD7, 4).label).toBe('ほとんどない');
  });

  it('合計 5 → 軽め', () => {
    expect(interpretScore(GAD7, 5).label).toBe('軽め');
  });

  it('合計 9 → 軽め (境界の上限)', () => {
    expect(interpretScore(GAD7, 9).label).toBe('軽め');
  });

  it('合計 10 → 中くらい', () => {
    expect(interpretScore(GAD7, 10).label).toBe('中くらい');
  });

  it('合計 14 → 中くらい (境界の上限)', () => {
    expect(interpretScore(GAD7, 14).label).toBe('中くらい');
  });

  it('合計 15 → 強め', () => {
    expect(interpretScore(GAD7, 15).label).toBe('強め');
  });

  it('合計 21 (満点) → 強め', () => {
    expect(interpretScore(GAD7, 21).label).toBe('強め');
  });

  it('質問は 7 問', () => {
    expect(GAD7.questions.length).toBe(7);
  });

  it('GAD-7 には希死念慮の質問は含まない', () => {
    for (const q of GAD7.questions) {
      expect(q).not.toContain('死');
    }
  });
});

describe('getScale', () => {
  it('phq9 を返す', () => {
    expect(getScale('phq9')).toBe(PHQ9);
  });

  it('gad7 を返す', () => {
    expect(getScale('gad7')).toBe(GAD7);
  });
});
