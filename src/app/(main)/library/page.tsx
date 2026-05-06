import Link from 'next/link';
import { BookOpen, Clock } from 'lucide-react';
import { Card, CardTitle } from '@/components/ui/Card';
import { ARTICLES } from '@/lib/library/articles';

export default function LibraryPage() {
  return (
    <div className="px-5 pt-safe space-y-5 pb-4">
      <header className="pt-4">
        <p className="text-kana uppercase tracking-widest text-muted">
          LIBRARY
        </p>
        <h1 className="mt-1 font-mincho text-h1 leading-tight">読みもの</h1>
      </header>

      <Card warm>
        <div className="flex items-start gap-3">
          <BookOpen size={20} strokeWidth={1.5} className="text-terracotta mt-0.5 shrink-0" />
          <p className="text-body leading-relaxed text-ink/85">
            「治す」ではなく「付き合う」視点で書かれた記事です。
            気が向いたときに、気になるものだけ読んでみてください。
          </p>
        </div>
      </Card>

      <section className="space-y-3">
        {ARTICLES.map((article) => (
          <Link key={article.slug} href={`/library/${article.slug}`} className="block">
            <Card className="hover:shadow-lift transition-shadow active:translate-y-[1px]">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-kana uppercase tracking-wider text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full">
                  {article.category}
                </span>
                <span className="flex items-center gap-1 text-kana text-muted">
                  <Clock size={12} />
                  {article.readingTime}
                </span>
              </div>
              <CardTitle>{article.title}</CardTitle>
              <p className="mt-2 text-small text-muted leading-relaxed">
                {article.description}
              </p>
            </Card>
          </Link>
        ))}
      </section>

      <Card className="bg-paper/40 text-center py-7">
        <p className="font-mincho text-body leading-loose text-ink/80">
          全部読まなくても大丈夫。<br />
          必要なときに、必要なものだけ。
        </p>
      </Card>
    </div>
  );
}
