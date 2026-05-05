import { StubPage } from '@/components/shared/StubPage';
export default function Page() {
  return (
    <StubPage
      title="通知設定"
      description="お知らせのタイミングを自分で決められます。通知は完全にオフにすることもできます。急かすことはありません。"
      backHref="/mypage"
    />
  );
}
