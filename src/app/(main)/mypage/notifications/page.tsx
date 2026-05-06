'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';

interface NotificationSettings {
  checkinEnabled: boolean;
  checkinHour: number;
  visitReminderEnabled: boolean;
}

const STORAGE_KEY = 'komorebi.notifications';

const defaultSettings: NotificationSettings = {
  checkinEnabled: false,
  checkinHour: 9,
  visitReminderEnabled: false,
};

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-3">
      <span className="text-body">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-sage' : 'bg-accent-soft'}`}
      >
        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </label>
  );
}

export default function NotificationsPage() {
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
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

  const update = (patch: Partial<NotificationSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }));
  };

  if (!loaded) return null;

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link href="/mypage" className="text-muted hover:text-ink transition-colors" aria-label="戻る">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="font-mincho text-h2">通知設定</h1>
      </header>

      <p className="text-small text-muted">通知はすべてオプションです。急かすことはありません。</p>

      <Card className="p-5 space-y-2">
        <Toggle
          label="チェックインリマインダー"
          checked={settings.checkinEnabled}
          onChange={(v) => update({ checkinEnabled: v })}
        />
        {settings.checkinEnabled && (
          <div className="pl-1 pb-2">
            <label className="text-small text-muted block mb-1">時間</label>
            <select
              value={settings.checkinHour}
              onChange={(e) => update({ checkinHour: Number(e.target.value) })}
              className="input-paper w-auto px-3 py-2 text-small"
            >
              {Array.from({ length: 17 }, (_, i) => i + 6).map((h) => (
                <option key={h} value={h}>{h}:00</option>
              ))}
            </select>
          </div>
        )}

        <Toggle
          label="通院日リマインダー"
          checked={settings.visitReminderEnabled}
          onChange={(v) => update({ visitReminderEnabled: v })}
        />
        {settings.visitReminderEnabled && (
          <p className="text-kana text-muted pl-1">通院日の前日にお知らせ</p>
        )}
      </Card>

      <p className="text-small text-muted text-center pt-4">
        通知を完全にオフにしても、こもれびは変わらずここにあります。
      </p>
    </div>
  );
}
