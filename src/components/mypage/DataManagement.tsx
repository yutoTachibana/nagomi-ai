'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export function DataManagement() {
  const router = useRouter();
  const [exporting, setExporting] = React.useState(false);
  const [showDialog, setShowDialog] = React.useState(false);
  const [confirmation, setConfirmation] = React.useState('');
  const [deleting, setDeleting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'komorebi-export.json';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError('ダウンロードに失敗しました。もう一度お試しください。');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    if (confirmation !== '削除します') return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmation }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message ?? '削除に失敗しました');
      }
      router.push('/login');
    } catch (e) {
      setError(e instanceof Error ? e.message : '削除に失敗しました。もう一度お試しください。');
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl bg-error/10 px-4 py-3 text-small text-error">
          {error}
        </div>
      )}

      <Card>
        <CardTitle>データのエクスポート</CardTitle>
        <p className="mt-2 text-body text-muted">
          あなたの記録をすべて JSON ファイルとしてダウンロードできます。
        </p>
        <div className="mt-4">
          <Button variant="ghost" loading={exporting} onClick={handleExport}>
            ダウンロード
          </Button>
        </div>
      </Card>

      <Card warm>
        <CardTitle>アカウントの削除</CardTitle>
        <p className="mt-2 text-body text-muted">
          すべてのデータが完全に削除されます。この操作は取り消せません。
        </p>
        <div className="mt-4">
          <Button variant="ghost" onClick={() => setShowDialog(true)}>
            アカウントを削除する
          </Button>
        </div>
      </Card>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-6">
          <Card className="w-full max-w-sm space-y-4">
            <CardTitle>本当に削除しますか？</CardTitle>
            <p className="text-body text-muted">
              すべての記録が失われます。
            </p>
            <div>
              <label className="text-small text-muted" htmlFor="delete-confirm">
                「削除します」と入力してください
              </label>
              <Input
                id="delete-confirm"
                className="mt-1"
                value={confirmation}
                onChange={(e) => setConfirmation(e.target.value)}
                placeholder="削除します"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="danger"
                disabled={confirmation !== '削除します'}
                loading={deleting}
                onClick={handleDelete}
              >
                削除する
              </Button>
              <Button
                variant="ghost"
                onClick={() => {
                  setShowDialog(false);
                  setConfirmation('');
                }}
              >
                やめる
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
