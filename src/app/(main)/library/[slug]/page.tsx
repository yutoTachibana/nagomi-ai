import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Clock } from 'lucide-react';
import { ARTICLES, getArticleBySlug } from '@/lib/library/articles';
import { getArticleComponent } from '@/components/library/ArticleContent';

interface Props {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return ARTICLES.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  if (!article) return {};
  return {
    title: `${article.title} - こもれび`,
    description: article.description,
  };
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  const ArticleComponent = getArticleComponent(slug);

  if (!article || !ArticleComponent) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-md min-h-screen px-5 pt-safe pb-12">
      <header className="flex items-center gap-2 pt-4 mb-6">
        <Link
          href="/library"
          aria-label="読みものに戻る"
          className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <span className="text-kana text-muted">読みもの</span>
      </header>

      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-kana uppercase tracking-wider text-terracotta bg-terracotta/10 px-2 py-0.5 rounded-full">
            {article.category}
          </span>
          <span className="flex items-center gap-1 text-kana text-muted">
            <Clock size={12} />
            {article.readingTime}
          </span>
        </div>
        <h1 className="font-mincho text-h1 leading-tight">{article.title}</h1>
        <p className="mt-3 text-body text-muted leading-relaxed">
          {article.description}
        </p>
      </div>

      <ArticleComponent />

      <div className="mt-10 text-center">
        <Link
          href="/library"
          className="inline-flex items-center gap-1 text-small text-muted hover:text-ink transition-colors"
        >
          <ArrowLeft size={14} />
          読みもの一覧に戻る
        </Link>
      </div>
    </div>
  );
}
