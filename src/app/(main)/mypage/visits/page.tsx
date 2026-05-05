import { StubPage } from '@/components/shared/StubPage';
export default function Page() {
  return (
    <StubPage
      title="通院の記録"
      description="通院日の記録や、次回の予定を管理できるようになります。主治医に伝えたいことのメモも残せる場所に。"
      backHref="/mypage"
    />
  );
}
