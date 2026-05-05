import { StubPage } from '@/components/shared/StubPage';
export default function Page() {
  return (
    <StubPage
      title="セキュリティ"
      description="パスワードの変更や、端末暗号化の設定を準備しています。あなたの記録を守るための機能です。"
      backHref="/mypage"
    />
  );
}
