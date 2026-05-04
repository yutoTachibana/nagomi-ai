'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get('next') ?? '/home';

  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const verified = params.get('verified') === 'true';
  const tokenError = params.get('error') === 'invalid-token';

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const result = await signIn('credentials', { email, password, redirect: false });
    if (result?.error) {
      // エラー文言は利用者を責めない
      setError('メールアドレスかパスワードが、合わないようです。もう一度確認してみてください。');
      setBusy(false);
      return;
    }
    setBusy(false);
    router.push(next);
    router.refresh();
  }

  return (
    <div className="flex flex-1 flex-col justify-center space-y-6">
      <div className="text-center">
        <h1 className="font-mincho text-display">こもれび</h1>
        <p className="mt-2 text-small text-muted">
          おかえりなさい
        </p>
      </div>

      {verified ? (
        <p role="status" className="rounded-xl bg-sage/10 px-4 py-3 text-center text-small text-sage">
          メールアドレスが確認されました。ログインしてください。
        </p>
      ) : null}

      {tokenError ? (
        <p role="alert" className="rounded-xl bg-error/10 px-4 py-3 text-center text-small text-error">
          リンクが無効か期限切れです。もう一度お試しください。
        </p>
      ) : null}

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
            autoComplete="current-password"
          />
          {error ? (
            <p role="alert" className="text-small text-error text-center">
              {error}
            </p>
          ) : null}
          <Button type="submit" loading={busy} className="w-full" size="lg">
            ログイン
          </Button>
          <p className="text-center">
            <Link href="/forgot-password" className="text-small text-muted underline">
              パスワードを忘れた方
            </Link>
          </p>
        </form>
      </Card>

      <p className="text-center text-small text-muted">
        はじめて？{' '}
        <Link href="/signup" className="text-terracotta underline">
          アカウントを作る
        </Link>
      </p>

      <p className="text-center text-kana text-muted">
        <Link href="/crisis" className="underline">
          いまサポートが必要な方はこちら
        </Link>
      </p>
    </div>
  );
}
