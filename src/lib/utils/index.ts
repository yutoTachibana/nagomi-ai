import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 日本語の相対時刻表記.
 * 「たった今」「3 分前」「今日 14:30」「昨日 14:30」「5 月 4 日」など
 */
export function formatRelativeJa(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'たった今';
  if (diffMin < 60) return `${diffMin} 分前`;

  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');

  if (isToday) return `今日 ${hh}:${mm}`;
  if (isYesterday) return `昨日 ${hh}:${mm}`;

  const sameYear = d.getFullYear() === now.getFullYear();
  if (sameYear) return `${d.getMonth() + 1} 月 ${d.getDate()} 日`;
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日`;
}

/**
 * 「いま」のあいさつ. 時間帯で変わる.
 * 朝 5-10, 昼 10-17, 夕 17-21, 夜 21-5
 */
export function greetingByTime(now = new Date()): string {
  const h = now.getHours();
  if (h >= 5 && h < 10) return 'おはようございます';
  if (h >= 10 && h < 17) return 'こんにちは';
  if (h >= 17 && h < 21) return 'こんばんは';
  return 'おつかれさま';
}

export function moodLabel(score: 1 | 2 | 3 | 4 | 5): string {
  return (
    {
      1: 'とてもしんどい',
      2: 'しんどい',
      3: 'ふつう',
      4: '穏やか',
      5: 'のびやか',
    } as const
  )[score];
}

export function energyLabel(level: 1 | 2 | 3 | 4 | 5): string {
  return (
    {
      1: 'ほぼゼロ',
      2: '低め',
      3: 'ふつう',
      4: '高め',
      5: 'たかぶり',
    } as const
  )[level];
}
