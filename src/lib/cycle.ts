/**
 * 月経サイクルのフェーズ推定.
 *
 * - 直近 3 周期の平均長で推定 (なければ 28 日デフォルト)
 * - フェーズ: menstrual (生理中) / follicular (卵胞期) / ovulation (排卵期) / luteal (黄体期)
 * - 推定であって医学的診断ではない. 利用者にもそう伝える.
 */

export interface CycleEntry {
  id: string;
  startDate: string; // YYYY-MM-DD
  endDate: string | null;
}

export type CyclePhase = 'menstrual' | 'follicular' | 'ovulation' | 'luteal' | 'unknown';

export interface CyclePhaseInfo {
  phase: CyclePhase;
  /** 周期内の日数 (1 = 開始日) */
  dayInCycle: number;
  /** 推定される平均周期長 */
  cycleLength: number;
  /** 次の生理予定日 (YYYY-MM-DD) */
  nextPeriodEstimate: string;
}

const PHASE_LABELS: Record<CyclePhase, string> = {
  menstrual: '生理中',
  follicular: '卵胞期',
  ovulation: '排卵期 (推定)',
  luteal: '黄体期',
  unknown: 'まだ推定できません',
};

export function phaseLabel(phase: CyclePhase): string {
  return PHASE_LABELS[phase];
}

/**
 * 直近の周期から平均長を計算.
 * 3 周期未満なら 28 日を返す.
 */
export function estimateCycleLength(entries: CycleEntry[]): number {
  if (entries.length < 2) return 28;
  // entries は startDate 降順想定. 直近 4 周期を見る (3 期間 = 4 開始)
  const recent = [...entries]
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
    .slice(0, 4);
  const diffs: number[] = [];
  for (let i = 0; i < recent.length - 1; i++) {
    const a = new Date(recent[i].startDate).getTime();
    const b = new Date(recent[i + 1].startDate).getTime();
    const days = Math.round((a - b) / (1000 * 60 * 60 * 24));
    if (days >= 18 && days <= 45) diffs.push(days); // 異常値除外
  }
  if (diffs.length === 0) return 28;
  return Math.round(diffs.reduce((a, b) => a + b, 0) / diffs.length);
}

/**
 * 今日のフェーズを推定する.
 */
export function estimatePhase(entries: CycleEntry[], today: Date = new Date()): CyclePhaseInfo | null {
  if (entries.length === 0) return null;

  const sorted = [...entries].sort((a, b) => b.startDate.localeCompare(a.startDate));
  const lastStart = new Date(sorted[0].startDate);
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const lastStartDateOnly = new Date(lastStart.getFullYear(), lastStart.getMonth(), lastStart.getDate());

  const diffMs = todayDateOnly.getTime() - lastStartDateOnly.getTime();
  if (diffMs < 0) return null; // 未来の入力

  const dayInCycle = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // 1-indexed
  const cycleLength = estimateCycleLength(entries);

  // フェーズ判定
  let phase: CyclePhase;
  const ovulationDay = cycleLength - 14; // 黄体期は安定して 14 日と仮定

  // 終了日が記録済みなら生理日数はそれに従う
  const lastEnd = sorted[0].endDate;
  let menstrualLength = 5; // デフォルト
  if (lastEnd) {
    const endDate = new Date(lastEnd);
    menstrualLength = Math.floor((endDate.getTime() - lastStartDateOnly.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    if (menstrualLength < 1 || menstrualLength > 14) menstrualLength = 5;
  }

  if (dayInCycle > cycleLength + 7) {
    // 1 周期分以上経過 → 推定不能
    return {
      phase: 'unknown',
      dayInCycle,
      cycleLength,
      nextPeriodEstimate: addDays(lastStartDateOnly, cycleLength).toISOString().slice(0, 10),
    };
  }

  if (dayInCycle <= menstrualLength) phase = 'menstrual';
  else if (dayInCycle < ovulationDay - 1) phase = 'follicular';
  else if (dayInCycle <= ovulationDay + 1) phase = 'ovulation';
  else phase = 'luteal';

  const nextPeriodEstimate = addDays(lastStartDateOnly, cycleLength).toISOString().slice(0, 10);

  return { phase, dayInCycle, cycleLength, nextPeriodEstimate };
}

function addDays(d: Date, days: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + days);
  return r;
}

/**
 * YYYY-MM-DD → "M/D" 短縮表記
 */
export function formatShortDate(dateStr: string): string {
  const [, m, d] = dateStr.split('-');
  return `${Number(m)}/${Number(d)}`;
}
