'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/Card';

interface AppSettings {
  fontSize: 'small' | 'normal' | 'large';
}

const STORAGE_KEY = 'komorebi.settings';

const defaultSettings: AppSettings = {
  fontSize: 'normal',
};

const fontSizeOptions: { value: AppSettings['fontSize']; label: string }[] = [
  { value: 'small', label: '小' },
  { value: 'normal', label: '標準' },
  { value: 'large', label: '大' },
];

export default function SettingsPage() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSettings({ ...defaultSettings, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    }
  }, [settings, loaded]);

  if (!loaded) return null;

  return (
    <div className="px-5 pt-safe pb-8 space-y-5">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link href="/mypage" className="text-muted hover:text-ink transition-colors" aria-label="戻る">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="font-mincho text-h2">設定</h1>
      </header>

      {/* Display */}
      <Card className="p-5 space-y-4">
        <CardTitle>表示</CardTitle>
        <div className="space-y-2">
          <p className="text-small text-muted">フォントサイズ</p>
          <div className="flex gap-2">
            {fontSizeOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSettings((prev) => ({ ...prev, fontSize: opt.value }))}
                className={`px-4 py-2 rounded-full text-small transition-colors ${
                  settings.fontSize === opt.value
                    ? 'bg-terracotta text-white'
                    : 'bg-accent-soft text-ink hover:bg-accent-soft/70'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* About */}
      <Card className="p-5 space-y-4">
        <CardTitle>アプリについて</CardTitle>
        <div className="space-y-2">
          <p className="text-small">
            <span className="text-muted">バージョン: </span>0.2.0
          </p>
          <p className="text-small text-muted">
            こもれびは、あなたの人生に長く寄り添うことを目指しています。
          </p>
        </div>
        <div className="flex flex-col gap-2 pt-2">
          <Link href="/terms" className="text-small text-terracotta hover:underline">
            利用規約
          </Link>
          <Link href="/privacy" className="text-small text-terracotta hover:underline">
            プライバシーポリシー
          </Link>
        </div>
      </Card>
    </div>
  );
}
