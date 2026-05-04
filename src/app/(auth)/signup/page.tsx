'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { generateMasterKey, storeMasterKey, ENCRYPTION_ENABLED } from '@/lib/crypto';

export default function SignupPage() {
  const router = useRouter();

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) {
      setError('パスワードは 8 文字以上にしてください');
      return;
    }
    setBusy(true);
    setError(null);

    // 端末暗号化が有効なら、サインアップと同時にマスターキーを生成
    if (ENCRYPTION_ENABLED) {
      try {
        const key = await generateMasterKey();
        storeMasterKey(key);
      } catch (e) {
        console.error('encryption key generation failed', e);
      }
    }

    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.message ?? '登録できませんでした。少し時間をおいて、もう一度試してください。');
      setBusy(false);
      return;
    }
    // Auto-login after signup
    await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    router.push('/onboarding');
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col justify-center space-y-6">
      <div className="text-center">
        <h1 className="font-mincho text-display">こもれび</h1>
        <p className="mt-2 text-small text-muted">
          長く、ゆっくりと
        </p>
      </div>

      <OAuthButtons />

      <Card warm>
        <form onSubmit={onSubmit} className="space-y-4">
          <Input
            label="メールアドレス"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
          <Input
            label="パスワード"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="new-password"
            hint="8 文字以上。記録されたものはあなただけが読めます。"
          />
          {error ? (
            <p role="alert" className="text-small text-error text-center">
              {error}
            </p>
          ) : null}
          <Button type="submit" loading={busy} className="w-full" size="lg">
            はじめる
          </Button>
        </form>
      </Card>

      <p className="text-center text-kana text-muted leading-relaxed">
        登録すると<Link href="/terms" className="underline">利用規約</Link>と
        <Link href="/privacy" className="underline">プライバシーポリシー</Link>に同意したものとみなされます。
      </p>

      <p className="text-center text-small">
        <Link href="/login" className="text-muted">
          すでにアカウントがあります
        </Link>
      </p>
    </div>
  );
}
