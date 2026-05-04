import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';

export default function PrivacyPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Link href="/login" className="text-muted">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h1">プライバシーポリシー</h1>
      </header>

      <p className="text-small text-muted">最終更新日: 2026年5月1日</p>

      <Card>
        <CardTitle>収集する情報</CardTitle>
        <div className="mt-2 space-y-2 text-body text-muted leading-relaxed">
          <p>こもれびでは、以下の情報を収集します。</p>
          <ul className="list-disc list-inside space-y-1">
            <li>メールアドレス（アカウント認証のため）</li>
            <li>気分・思考・ジャーナルなどの記録データ</li>
            <li>AI アシスタントとの会話履歴</li>
            <li>服薬・通院の記録</li>
          </ul>
          <p>
            自由記述の内容は端末側で暗号化してから保存されるため、
            運営者がその内容を閲覧することはできません。
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle>情報の利用目的</CardTitle>
        <ul className="mt-2 list-disc list-inside space-y-1 text-body text-muted leading-relaxed">
          <li>サービスの提供と改善</li>
          <li>AI アシスタント「ことね」による応答の生成</li>
          <li>グラフや振り返りなど、ご自身の記録の表示</li>
          <li>サービスの安全性の維持</li>
        </ul>
      </Card>

      <Card>
        <CardTitle>情報の第三者提供</CardTitle>
        <p className="mt-2 text-body text-muted leading-relaxed">
          あなたの個人データを第三者に販売・提供することはありません。
          AI 応答の生成のために Anthropic 社の API を利用しますが、
          会話内容がモデルの学習に使用されることはありません。
        </p>
      </Card>

      <Card>
        <CardTitle>データの暗号化</CardTitle>
        <div className="mt-2 space-y-2 text-body text-muted leading-relaxed">
          <p>
            自由記述データ（ジャーナル、思考記録、メモなど）は、
            お使いの端末上で暗号化してからサーバーに保存されます。
          </p>
          <p>
            暗号化の鍵はあなたの端末にのみ保存されるため、
            運営者を含め第三者が内容を読むことはできません。
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle>データの保存期間</CardTitle>
        <p className="mt-2 text-body text-muted leading-relaxed">
          アカウントを利用している間、データは保存されます。
          アカウントを削除した場合、すべてのデータは速やかに完全削除されます。
        </p>
      </Card>

      <Card>
        <CardTitle>ユーザーの権利</CardTitle>
        <div className="mt-2 space-y-2 text-body text-muted leading-relaxed">
          <p>あなたにはいつでも以下の権利があります。</p>
          <ul className="list-disc list-inside space-y-1">
            <li>すべてのデータを JSON 形式でエクスポートする</li>
            <li>アカウントとすべてのデータを完全に削除する</li>
          </ul>
          <p>
            これらの操作は{' '}
            <Link href="/mypage/data" className="text-terracotta underline underline-offset-2">
              マイページ &gt; データの管理
            </Link>
            {' '}から行えます。
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle>Cookie の使用</CardTitle>
        <p className="mt-2 text-body text-muted leading-relaxed">
          こもれびでは、ログイン状態を維持するためのセッション Cookie のみを使用しています。
          広告やトラッキングのための Cookie は使用しません。
        </p>
      </Card>

      <Card>
        <CardTitle>お問い合わせ</CardTitle>
        <p className="mt-2 text-body text-muted leading-relaxed">
          プライバシーに関するご質問やご懸念がございましたら、
          アプリ内の設定画面またはメールにてお気軽にお問い合わせください。
        </p>
      </Card>
    </div>
  );
}
