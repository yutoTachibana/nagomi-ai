import Link from 'next/link';
import { Phone, Globe, Clock, ArrowLeft, ShieldCheck, ChevronRight } from 'lucide-react';
import { CRISIS_RESOURCES } from '@/lib/safety/crisis-detector';
import { Card, CardLabel, CardTitle } from '@/components/ui/Card';

/**
 * 緊急サポート画面.
 * ログイン前でもアクセス可能 (middleware で /crisis を除外している).
 *
 * 設計上の重要な配慮:
 *  - 番号を視覚的に見やすく
 *  - 「自殺」「リスカ」など刺激語を画面に出さない
 *  - 各リソースにワンタップで電話できる tel: リンク
 *  - 「あなたが今ここを開いてくれたこと」を肯定する
 */
export default function CrisisPage() {
  return (
    <div className="mx-auto max-w-md px-5 pt-safe pb-4 space-y-5">
      <header className="flex items-center gap-2 pt-4">
        <Link
          href="/home"
          aria-label="戻る"
          className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2">サポート</h1>
      </header>

      <Card warm>
        <CardTitle className="leading-relaxed">
          ここを開いてくれて、ありがとう
        </CardTitle>
        <p className="mt-3 text-body leading-relaxed text-ink/85">
          いまの時間が、すごくしんどいかもしれません。<br />
          一人で抱えなくて大丈夫です。
        </p>
        <p className="mt-3 text-small text-muted leading-relaxed">
          下のどれかに、ためしに電話してみてもいいし、ただ番号を見るだけでも大丈夫です。
        </p>
      </Card>

      <Link href="/crisis/plan" className="block">
        <Card className="hover:bg-accent-soft/30 transition-colors">
          <div className="flex items-start gap-3">
            <div className="rounded-full bg-plum/10 p-2.5 mt-0.5">
              <ShieldCheck size={18} className="text-plum" />
            </div>
            <div className="flex-1 min-w-0">
              <CardLabel>セーフティプラン</CardLabel>
              <p className="mt-1 text-body text-ink">あなたの「もしも」のときの備え</p>
              <p className="mt-1 text-kana text-muted">
                平時に書いておくと、しんどい時の自分が助かります
              </p>
            </div>
            <ChevronRight size={18} className="text-muted shrink-0 mt-1" />
          </div>
        </Card>
      </Link>

      <section className="space-y-3">
        <h2 className="font-mincho text-h3 px-1">話せる相手</h2>
        {CRISIS_RESOURCES.map((r) => (
          <Card key={r.id}>
            <div className="flex items-start gap-3">
              <div className="rounded-full bg-terracotta/10 p-2.5 mt-0.5">
                <Phone size={18} className="text-terracotta" />
              </div>
              <div className="flex-1 min-w-0">
                <CardLabel>{r.id === 'emergency' ? '生命の危機' : '相談窓口'}</CardLabel>
                <p className="mt-0.5 font-mincho text-body">{r.name}</p>
                <p className="mt-2 text-small text-muted leading-relaxed">
                  {r.description}
                </p>
                <div className="mt-2 flex items-center gap-1.5 text-kana text-muted">
                  <Clock size={12} />
                  <span>{r.available}</span>
                </div>
                {r.phone ? (
                  <a
                    href={`tel:${r.phone.replace(/-/g, '')}`}
                    className="btn-primary mt-3 w-full text-body"
                    style={r.id === 'emergency' ? { background: 'rgb(178, 92, 92)' } : undefined}
                  >
                    <Phone size={16} />
                    {r.phone}
                  </a>
                ) : r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-primary mt-3 w-full text-body"
                  >
                    <Globe size={16} />
                    LINE で相談する
                  </a>
                ) : null}
                {r.phone && r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1 text-kana text-muted hover:text-ink"
                  >
                    <Globe size={12} /> 公式サイト
                  </a>
                ) : null}
              </div>
            </div>
          </Card>
        ))}
      </section>

      <Card className="bg-paper/40 text-center py-7">
        <p className="font-mincho text-body leading-loose text-ink/85">
          話したくない日があってもいいし、<br />
          話したい日があってもいいです。<br />
          <br />
          あなたのペースで大丈夫です。
        </p>
      </Card>

      <Link
        href="/home"
        className="block text-center text-small text-muted underline"
      >
        ホームに戻る
      </Link>
    </div>
  );
}
