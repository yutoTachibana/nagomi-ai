import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { CommunityFeed } from '@/components/community/CommunityFeed';

export default function Page() {
  return (
    <div className="px-5 pt-safe pb-8 space-y-5">
      <header className="flex items-center gap-2 pt-4">
        <Link
          href="/home"
          aria-label="戻る"
          className="p-2 -ml-2 rounded-pill hover:bg-accent-soft/40"
        >
          <ArrowLeft size={20} />
        </Link>
        <h1 className="font-mincho text-h2">コミュニティ</h1>
      </header>

      <p className="text-small text-muted leading-relaxed">
        ここでは、ハートだけで気持ちを伝え合います。
        <br />
        コメント機能はありません。そっと寄り添う場所です。
      </p>

      <CommunityFeed />
    </div>
  );
}
