'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function SecurityPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 8) {
      setError('新しいパスワードは8文字以上にしてください');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('新しいパスワードが一致しません');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/account/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      if (res.ok) {
        setSuccess('パスワードを変更しました。');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? 'もう一度試してみてください');
      }
    } catch {
      setError('もう一度試してみてください');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      {/* Header */}
      <header className="flex items-center gap-3">
        <Link href="/mypage" className="text-muted hover:text-ink transition-colors" aria-label="戻る">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </Link>
        <h1 className="font-mincho text-h2">セキュリティ</h1>
      </header>

      {/* Password change */}
      <Card className="p-5 space-y-4">
        <CardTitle>パスワードの変更</CardTitle>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            label="現在のパスワード"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
          <Input
            type="password"
            label="新しいパスワード"
            hint="8文字以上"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          <Input
            type="password"
            label="新しいパスワード（確認）"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
          />
          {error && <p className="text-kana text-error">{error}</p>}
          {success && <p className="text-kana text-sage">{success}</p>}
          <Button type="submit" loading={loading}>
            変更する
          </Button>
        </form>
      </Card>

      {/* Encryption status */}
      <Card className="p-5 space-y-3">
        <CardTitle>暗号化</CardTitle>
        <p className="text-small text-muted">
          端末暗号化は現在テスト版のため無効です。将来のアップデートで有効になります。
        </p>
        <span className="inline-block text-kana px-3 py-1 rounded-full bg-accent-soft text-muted">
          無効
        </span>
      </Card>
    </div>
  );
}
