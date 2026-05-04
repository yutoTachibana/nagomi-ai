import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Card, CardLabel, CardTitle } from '@/components/ui/Card';

interface Props {
  title: string;
  description: string;
  backHref?: string;
}

/**
 * Phase 1 で実装予定の画面用. CLAUDE.md にも記載がある.
 */
export function StubPage({ title, description, backHref = '/home' }: Props) {
  return (
    <div className="px-5 pt-safe pb-8 space-y-5">
      <header className="flex items-center gap-2 pt-4">
        <Link
          href={backHref}
          aria-label="戻る"
          className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2">{title}</h1>
      </header>

      <Card warm>
        <CardLabel>近日公開</CardLabel>
        <CardTitle className="mt-2 leading-relaxed">準備中です</CardTitle>
        <p className="mt-3 text-body leading-relaxed text-ink/80">
          {description}
        </p>
        <p className="mt-4 text-small text-muted leading-relaxed">
          じっくり、慎重に作っています。
          急がず、丁寧に届けたいので、もう少しだけ待ってもらえると嬉しいです。
        </p>
      </Card>
    </div>
  );
}
