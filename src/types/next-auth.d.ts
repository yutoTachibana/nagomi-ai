import 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      email: string;
    };
  }

  interface User {
    id: string;
    email: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    sub: string;
    /** users テーブルへの存在確認＋必要に応じた再作成が完了済みか */
    recovered?: boolean;
    /** リカバリすら失敗した状態. middleware で未認証扱いにしてログイン画面へ */
    invalid?: boolean;
  }
}
