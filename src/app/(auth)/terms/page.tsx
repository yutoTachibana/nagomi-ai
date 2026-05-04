import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';

export default function TermsPage() {
  return (
    <div className="space-y-6">
      <header className="flex items-center gap-3">
        <Link href="/login" className="text-muted">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h1">利用規約</h1>
      </header>

      <p className="text-small text-muted">最終更新日: 2026年5月1日</p>

      <Card>
        <CardTitle>サービスの概要</CardTitle>
        <p className="mt-2 text-body text-muted leading-relaxed">
          こもれびは、日々の気分や考えを記録し、ご自身のペースで心の健康と向き合うためのアプリです。
          AI アシスタント「ことね」との対話機能を含みますが、
          これは医療行為の提供ではなく、あくまで自己理解を深めるための補助ツールです。
        </p>
      </Card>

      <Card>
        <CardTitle>利用条件</CardTitle>
        <div className="mt-2 space-y-2 text-body text-muted leading-relaxed">
          <p>
            どなたでもご利用いただけます。年齢制限はありませんが、未成年の方は保護者の方と一緒にご確認ください。
          </p>
          <p>
            本サービスは医療の代替ではありません。体調に不安がある場合は、必ず医療機関にご相談ください。
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle>禁止事項</CardTitle>
        <ul className="mt-2 list-disc list-inside space-y-1 text-body text-muted leading-relaxed">
          <li>他の利用者への嫌がらせや差別的な行為</li>
          <li>虚偽の情報を意図的に流布する行為</li>
          <li>サービスの運営を妨害する行為</li>
          <li>不正アクセスやリバースエンジニアリング</li>
        </ul>
      </Card>

      <Card>
        <CardTitle>免責事項</CardTitle>
        <div className="mt-2 space-y-2 text-body text-muted leading-relaxed">
          <p>
            AI アシスタント「ことね」の応答は医療アドバイスではありません。
            診断、治療方針の決定、薬の変更などについては、必ず主治医や専門家にご相談ください。
          </p>
          <p>
            本サービスの利用によって生じたいかなる損害についても、
            運営者は法令で許容される範囲で責任を負いません。
          </p>
        </div>
      </Card>

      <Card>
        <CardTitle>データの取り扱い</CardTitle>
        <p className="mt-2 text-body text-muted leading-relaxed">
          あなたの記録は暗号化して保存されます。詳しくは{' '}
          <Link href="/privacy" className="text-terracotta underline underline-offset-2">
            プライバシーポリシー
          </Link>
          {' '}をご覧ください。
          いつでもデータのエクスポートやアカウントの削除が可能です。
        </p>
      </Card>

      <Card>
        <CardTitle>サービスの変更・終了</CardTitle>
        <p className="mt-2 text-body text-muted leading-relaxed">
          運営者は、事前に通知したうえでサービスの内容を変更、または終了することがあります。
          終了する場合は、十分な猶予期間を設け、データのエクスポート手段を提供します。
        </p>
      </Card>

      <Card>
        <CardTitle>お問い合わせ</CardTitle>
        <p className="mt-2 text-body text-muted leading-relaxed">
          ご不明な点やご意見がございましたら、アプリ内の設定画面またはメールにてお問い合わせください。
        </p>
      </Card>
    </div>
  );
}
