# こもれび (Komorebi)

> 木漏れ日のような、長期伴走型メンタルケアアプリ

20 代女性の不安障害・適応障害・双極性障害を抱える方のための、CBT を中心とした Web アプリです。

**重要**: このリポジトリは医療行為を提供しません。医師の診療・治療を補助するものでもなく、利用者ご自身の振り返りツールです。

---

## クイックスタート

```bash
# 1. 依存関係のインストール
npm install

# 2. 環境変数を設定
cp .env.example .env.local
# 以下を埋める:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   ANTHROPIC_API_KEY

# 3. Supabase をローカル起動 (Docker 必要)
npx supabase start
npx supabase db reset

# 4. 開発サーバー
npm run dev
# → http://localhost:3000
```

## ドキュメント

- [`CLAUDE.md`](./CLAUDE.md) - 開発ガイド & Claude Code 引き継ぎ仕様
- [`docs/komorebi-spec.html`](./docs/komorebi-spec.html) - デザイン仕様書（別ファイル）
- [`docs/SAFETY.md`](./docs/SAFETY.md) - 安全性・倫理ガイドライン
- [`docs/PRIVACY.md`](./docs/PRIVACY.md) - プライバシーポリシー素案

## ライセンス

MIT で公開予定。ただし以下の制限を検討中:

- 商用利用時は安全性レビューを必須化
- ブランド名「こもれび」「ことね」「みつめる」の使用は制限

詳細は本リリース前に決定します。
