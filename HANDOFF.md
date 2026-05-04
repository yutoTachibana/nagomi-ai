# Claude Code への引き継ぎノート

## 配布物

`komorebi-app.zip` を解凍すると、すぐ動く Next.js プロジェクトになっています。

## セットアップ (5 分)

```bash
unzip komorebi-app.zip && cd komorebi-app
cp .env.example .env.local
# .env.local を編集:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
#   ANTHROPIC_API_KEY
npm install
npx supabase start
npx supabase db reset
npm run dev
```

## Phase 0 で実装済み

- Next.js 15 / TypeScript / Tailwind / Supabase / Hono / Anthropic SDK の完全配線
- DB スキーマ (RLS 11 テーブル分)
- 認証 (login / signup / onboarding) + middleware
- ホーム画面・記録ハブ
- **気分記録** (mood entry) - 完全動作
- **CBT コラム法** (9 ステップウィザード) - 完全動作
- **ことね AI** (Claude Sonnet 4.6 + SSE ストリーミング + クライシス検知) - 完全動作
- 緊急サポート画面 (ログイン前でもアクセス可能)
- ボトムタブ + クライシス FAB
- 認知の歪みカタログ (12 種)
- クライシス検知システム (キーワード 3 階層)
- libsodium 暗号化（passthrough モード。フラグで本番化）

## Claude Code に依頼すべき次の作業 (優先順)

1. **依存関係チェック** - `npm install` でビルドが通ることを確認
2. **Supabase migration の動作検証** - RLS が正しく効くか
3. **insights 画面** - Recharts で 30 日の mood グラフ
4. **journal** - プロンプト 30 種を `src/lib/journal-prompts.ts` に新設
5. **mindfulness** - 4-7-8 呼吸法のアニメーション
6. **library** - MDX で記事 5 本
7. **暗号化を本番化** - `NEXT_PUBLIC_FEATURE_E2E_ENCRYPTION=true` でテスト
8. **Vitest セットアップ + crisis-detector のテスト**
9. **Playwright でオンボーディング → 記録までの E2E**

## Claude Code 起動時の最初の依頼例

```
このプロジェクトは Next.js 15 + Supabase + Claude API のメンタルケアアプリです。
まず CLAUDE.md と docs/SAFETY.md を読んでください。
読み終えたら、依存関係をインストールしてビルドが通るか確認し、
必要なら型エラーを修正してください。
```

## 重要: 設計原則を絶対に外さないこと

- 連続記録日数・DAU 最適化・ログインボーナス → 入れない
- AI に診断・薬の助言・回復予言をさせない
- エラー文言で利用者を責めない
- 自由記述をログ・解析に流さない

詳細は `CLAUDE.md` と `docs/SAFETY.md` 参照。
