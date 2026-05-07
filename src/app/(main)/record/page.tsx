import Link from 'next/link';
import { Card, CardLabel, CardTitle } from '@/components/ui/Card';
import { Heart, Brain, BookOpen, Moon, Flower2, ClipboardCheck, Users } from 'lucide-react';

export default function RecordIndex() {
  return (
    <div className="px-5 pt-safe pb-4 space-y-5">
      <header className="pt-4">
        <p className="text-kana uppercase tracking-widest text-muted">RECORD</p>
        <h1 className="mt-1 font-mincho text-h1">記録する</h1>
        <p className="mt-2 text-small text-muted">
          どれを残すかは、その日の自分次第。順番もありません。
        </p>
      </header>

      <Link href="/record/mood" className="block">
        <Card warm>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-terracotta/10 p-3">
              <Heart size={22} strokeWidth={1.5} className="text-terracotta" />
            </div>
            <div className="flex-1">
              <CardLabel>気分の記録</CardLabel>
              <CardTitle className="mt-1">いまの感じを 5 段階で</CardTitle>
              <p className="mt-2 text-small text-muted">
                言葉にしなくても、選ぶだけで残せます。10 秒。
              </p>
            </div>
          </div>
        </Card>
      </Link>

      <Link href="/record/thought" className="block">
        <Card>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-sage/10 p-3">
              <Brain size={22} strokeWidth={1.5} className="text-sage" />
            </div>
            <div className="flex-1">
              <CardLabel>思考の整理 (CBT)</CardLabel>
              <CardTitle className="mt-1">頭のなかを書き出す</CardTitle>
              <p className="mt-2 text-small text-muted">
                状況・気持ち・考え・別の見方。一緒にゆっくり整理します。
              </p>
            </div>
          </div>
        </Card>
      </Link>

      <Link href="/record/journal" className="block">
        <Card>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-plum/10 p-3">
              <BookOpen size={22} strokeWidth={1.5} className="text-plum" />
            </div>
            <div className="flex-1">
              <CardLabel>ジャーナル</CardLabel>
              <CardTitle className="mt-1">自由に書き留める</CardTitle>
              <p className="mt-2 text-small text-muted">
                プロンプトに沿って書くか、そのまま自由に。
              </p>
            </div>
          </div>
        </Card>
      </Link>

      <Link href="/record/sleep" className="block">
        <Card>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-plum/10 p-3">
              <Moon size={22} strokeWidth={1.5} className="text-plum" />
            </div>
            <div className="flex-1">
              <CardLabel>睡眠の記録</CardLabel>
              <CardTitle className="mt-1">眠った時間と感じ</CardTitle>
              <p className="mt-2 text-small text-muted">
                気分の波を見るときに、睡眠のリズムが手がかりになります。
              </p>
            </div>
          </div>
        </Card>
      </Link>

      <Link href="/record/cycle" className="block">
        <Card>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-plum/10 p-3">
              <Flower2 size={22} strokeWidth={1.5} className="text-plum" />
            </div>
            <div className="flex-1">
              <CardLabel>サイクルの記録 (任意)</CardLabel>
              <CardTitle className="mt-1">月経サイクル</CardTitle>
              <p className="mt-2 text-small text-muted">
                気分の波の解釈に、サイクルの位置が手がかりになります。
              </p>
            </div>
          </div>
        </Card>
      </Link>

      <Link href="/record/checkup" className="block">
        <Card>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-sage/10 p-3">
              <ClipboardCheck size={22} strokeWidth={1.5} className="text-sage" />
            </div>
            <div className="flex-1">
              <CardLabel>セルフチェック (任意)</CardLabel>
              <CardTitle className="mt-1">PHQ-9 / GAD-7</CardTitle>
              <p className="mt-2 text-small text-muted">
                月に 1 回ぐらい、いまの状態を自己評価. 主治医との共有に.
              </p>
            </div>
          </div>
        </Card>
      </Link>

      <Link href="/record/attachment" className="block">
        <Card>
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-plum/10 p-3">
              <Users size={22} strokeWidth={1.5} className="text-plum" />
            </div>
            <div className="flex-1">
              <CardLabel>愛着スタイル (リフレクション)</CardLabel>
              <CardTitle className="mt-1">人との距離感を見つめる</CardTitle>
              <p className="mt-2 text-small text-muted">
                12 問で関係の中での自分のパターンを知る. 診断ではなく、気づきのため.
              </p>
            </div>
          </div>
        </Card>
      </Link>

      <Card className="bg-paper/40 text-center py-7">
        <p className="font-mincho text-body leading-loose text-ink/80">
          書かない日があっても<br />
          責められることは、ここにはありません
        </p>
      </Card>
    </div>
  );
}
