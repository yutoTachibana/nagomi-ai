'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

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

  // 表示名 (プロフィール)
  const [displayName, setDisplayName] = useState<string>('');
  const [originalName, setOriginalName] = useState<string>('');
  const [savingName, setSavingName] = useState(false);
  const [nameMessage, setNameMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  // プロフィールを取得して表示名を埋める
  useEffect(() => {
    let cancelled = false;
    fetch('/api/profile')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (cancelled || !data?.profile) return;
        const name = data.profile.displayName ?? '';
        setDisplayName(name);
        setOriginalName(name);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  async function handleSaveName() {
    const trimmed = displayName.trim();
    if (!trimmed) {
      setNameMessage({ type: 'error', text: '表示名を入力してください' });
      return;
    }
    if (trimmed === originalName) {
      return;
    }
    setSavingName(true);
    setNameMessage(null);
    try {
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ display_name: trimmed }),
      });
      if (!res.ok) {
        throw new Error('failed');
      }
      setOriginalName(trimmed);
      setNameMessage({ type: 'success', text: '保存しました' });
    } catch {
      setNameMessage({ type: 'error', text: '保存できませんでした。もう一度お試しください' });
    } finally {
      setSavingName(false);
    }
  }

  if (!loaded) return null;

  const nameChanged = displayName.trim() !== originalName && displayName.trim().length > 0;

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link href="/mypage" className="text-muted hover:text-ink transition-colors" aria-label="戻る">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="font-mincho text-h2">設定</h1>
      </header>

      {/* Profile */}
      <Card className="p-5 space-y-4">
        <CardTitle>プロフィール</CardTitle>
        <div className="space-y-3">
          <Input
            label="表示名"
            type="text"
            value={displayName}
            onChange={(e) => {
              setDisplayName(e.target.value);
              setNameMessage(null);
            }}
            maxLength={40}
            placeholder="ホーム画面で表示されます"
          />
          {nameMessage ? (
            <p className={`text-small ${nameMessage.type === 'success' ? 'text-sage' : 'text-error'}`}>
              {nameMessage.text}
            </p>
          ) : null}
          <Button
            type="button"
            onClick={handleSaveName}
            loading={savingName}
            disabled={!nameChanged}
            className="w-full"
          >
            保存する
          </Button>
        </div>
      </Card>

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
