# CLAUDE.md - こもれび 開発ガイド

このファイルは Claude Code がこのプロジェクトを継続実装する際の指針です。**着手前に必ず全文に目を通すこと。**

---

## 0. このプロジェクトの「魂」

こもれびは、不安障害・適応障害・双極性障害を抱える 20 代女性のための、**長期伴走型** メンタルケアアプリです。

開発上の最重要原則を 3 行で:

1. **盛らない**: 派手な UI、過剰アニメーション、ゲーミフィケーションは入れない
2. **依存させない**: DAU・連続記録日数・通知バッジで引きつける設計は **してはいけない**
3. **医療を代替しない**: 診断っぽい言葉、症状判定、薬の変更示唆は **絶対に出力しない**

迷ったら `docs/komorebi-spec.html` （別途共有された仕様書）の「設計原則」セクションを読み返すこと。

---

## 1. 技術スタック (確定済み)

```
Frontend:  Next.js 15 (App Router) + TypeScript + Tailwind CSS
DB:        PostgreSQL 16 (Docker Compose ローカル / AWS RDS 本番)
ORM:       Drizzle ORM (型安全, SQL ライクなクエリビルダ)
認証:      Auth.js v5 (NextAuth) - Credentials provider + JWT
AI:        Claude Sonnet 4.6 (anthropic-sdk-typescript)
暗号化:    libsodium-wrappers (クライアント側で sealed box)
状態管理:  React Server Components + Server Actions が基本
           クライアント側は Zustand を最小限
グラフ:    Recharts
フォント:  Shippori Mincho (見出し) + Zen Maru Gothic (本文)
テスト:    Vitest (ユニット) + Playwright (E2E)
```

**入れない物**: Redux、Material-UI、フル shadcn インストール（必要なものだけコピー）、感情分析のために訓練された外部 API、広告 SDK、解析 SDK（Plausible だけ自前ホストで OK）。

---

## 2. ディレクトリ構造

```
src/
├── app/
│   ├── (auth)/              # 認証前ルート (login, signup, onboarding)
│   ├── (main)/              # 認証後メイン (タブナビ付き)
│   │   ├── home/            # ホーム: 今日の体調・近況の振り返り
│   │   ├── record/          # 記録: mood / thought / journal の分岐
│   │   │   ├── mood/        # 気分記録
│   │   │   ├── thought/     # CBT コラム法
│   │   │   └── journal/     # ジャーナル
│   │   ├── kotone/          # ことね (AI 相手)
│   │   ├── insights/        # みつめる: グラフ・気づき
│   │   ├── mypage/          # マイページ
│   │   ├── crisis/          # 緊急サポート (常時アクセス可能)
│   │   ├── mindfulness/     # 呼吸法・瞑想
│   │   ├── library/         # 心理教育コンテンツ
│   │   └── medication/      # 服薬記録
│   └── api/                 # API ルート
│       ├── auth/            # Auth.js ([...nextauth], signup, logout)
│       ├── kotone/          # AI チャット (SSE)
│       ├── mood/
│       ├── thought-record/
│       ├── journal/
│       ├── medication/      # + medication/log
│       └── profile/
├── components/
│   ├── ui/                  # 汎用 UI (Button, Card, Sheet, ...)
│   ├── layout/              # BottomNav, AppShell
│   ├── providers/           # AuthProvider (SessionProvider)
│   ├── insights/, mindfulness/, medication/, library/
│   ├── home/, record/, kotone/, shared/
├── lib/
│   ├── db/                  # Drizzle クライアント + スキーマ
│   ├── auth/                # Auth.js (NextAuth) 設定
│   ├── claude/              # Anthropic クライアント + プロンプト
│   ├── crypto/              # libsodium ラッパー
│   ├── safety/              # クライシス検知・倫理ガード
│   ├── library/             # 記事メタデータ
│   └── utils/
├── types/
└── drizzle/                 # Drizzle マイグレーション
```

---

## 3. データモデル (PostgreSQL + Drizzle)

`src/lib/db/schema.ts` を参照。重要ポイント:

- **認可はアプリ層で実装**: 全 API ルート・Server Component で `WHERE user_id = session.user.id` を明示
- **暗号化対象**: 自由記述（`*_encrypted` カラム）はクライアント側で暗号化してから保存
- **`safety_events`**: クライシス検知のメタログ。**本文・キーワードは保存しない** （何が起きたかの type のみ）

### 暗号化方針 (重要)

- ユーザーはサインアップ時、**マスターキーをクライアント生成** → パスフレーズで保護してローカル保存
- DB に保存される自由記述はすべてマスターキーで暗号化
- **Anthropic は復号できない**（鍵を持たない）
- AI に送るときは、ユーザー端末で復号 → API へ送信。サーバーは中継のみで保存しない

実装は段階的でよい。MVP では「平文保存 + アプリ層認可」で出してから、Phase 2 で E2E 暗号化に移行する。**その場合は UI に必ず「現在は端末暗号化はオフ」と明記する。**

---

## 4. 安全性・倫理（実装上の必須事項）

### 4.1 クライシス検知

`src/lib/safety/crisis-detector.ts` に実装済み。

- AI 出力前 + ユーザー入力後の両方でチェック
- 該当キーワード検出時:
  1. AI には共感応答 + 専門リソース提示のみさせる
  2. UI 上部に "緊急時の連絡先" バナーを表示
  3. `safety_events` テーブルに type のみログ（**本文は保存しない**）

キーワードリストは `crisis-detector.ts` 内で管理。**機械学習による感情分析は使わない**（誤判定で利用者を傷つけるリスクが高い）。

### 4.2 医療境界

`src/lib/claude/system-prompts.ts` の `KOTONE_SYSTEM_PROMPT` 参照。

ことねは:
- 診断名を断定しない（「〇〇障害ですね」と言わない）
- 薬の量・種類について意見しない（「主治医に相談を」に統一）
- 「治る」「悪化」など、回復の予言をしない
- 自分は AI である事実を聞かれたら明確に答える

### 4.3 反エンゲージメント設計

実装してはいけないもの:
- 連続記録日数（streak）の表示・通知
- DAU を上げる通知
- ログインボーナス
- 「もうすぐで〇日達成！」系の煽り

実装すべきもの:
- 「最近お疲れみたいですね、休む選択も大事ですよ」のような、サボることを肯定するメッセージ
- 設定で通知を完全 OFF にできる（デフォルト OFF も検討）

---

## 5. UI / デザイントークン

`src/app/globals.css` の `:root` に定義済み。**変更時は仕様書 HTML との整合性を保つこと。**

```
--paper:        #faf6ef    紙のような背景
--ink:          #2a2826    本文
--muted:        #6b6864    補足
--terracotta:   #c47a5a    主アクセント
--sage:         #7a8c6e    セージ
--plum:         #8a4a5c    紫みの差し色
--accent-soft:  #e8dfd1    薄いアクセント
--success:      #6b8c5c
--warn:         #c89557
--error:        #b25c5c    （多用しない: 警告色は刺激になる）
```

フォント: 見出しは `font-mincho` (Shippori Mincho)、本文は `font-maru` (Zen Maru Gothic)。

---

## 6. 実装ステータス

### ✅ 実装済み (Phase 0)

- プロジェクト設定 (Next.js 15, TS, Tailwind, ESLint)
- Supabase クライアント (server / client / middleware)
- DB スキーマ + RLS (`supabase/migrations/0001_initial_schema.sql`)
- 認証ミドルウェア
- グローバルスタイル + デザイントークン
- レイアウト (auth レイアウト / メインレイアウト + ボトムタブ)
- 共通 UI コンポーネント (Button, Card, Textarea, Slider など)
- **ホーム** (`/home`): 今日の体調プロンプト、最近の気づき
- **気分記録** (`/record/mood`): 5 段階気分 + エネルギー + タグ + 自由記述
- **CBT コラム法** (`/record/thought`): 状況→感情→自動思考→根拠→反対の証拠→バランス思考
- **ことね** (`/kotone`): Claude Sonnet 4.6 ストリーミング + クライシス検知
- **緊急サポート** (`/crisis`): よりそいホットライン等の日本国内リソース
- API: `/api/kotone` (SSE), `/api/mood`, `/api/thought-record`
- safety/crisis-detector
- 認証フロー: `/login`, `/signup`, `/onboarding`

### ✅ 実装済み (Phase 1)

1. **`/insights`** - Recharts で 30/90 日の mood_score + energy 折れ線グラフ、頻出タグ集計
2. **`/journal`** - 自由ジャーナル + プロンプト 30 種 (`src/lib/journal-prompts.ts`)、暗号化保存
3. **`/mindfulness`** - 4-7-8 呼吸法、ボックス呼吸（CSSアニメーション）、5-4-3-2-1 グラウンディング
4. **`/library`** - 心理教育記事 5 本（不安、適応障害、双極性障害、認知の歪み、服薬）
5. **`/medication`** - 服薬登録・ログ記録、飲み忘れを責めない UI
6. **オンボーディング詳細** - 3 ステップ肉付け、戻るボタン、暗号化・プライバシー説明追加
7. **暗号化** - libsodium 実装済み。`NEXT_PUBLIC_FEATURE_E2E_ENCRYPTION=true` で本番化可能
8. **テスト** - Vitest (51 テスト: crisis-detector + crypto) + Playwright E2E 構造
9. API 追加: `/api/journal`, `/api/medication`, `/api/medication/log`

### 🚧 未実装 (Phase 1.5 / マイページ系)

- `/mypage/visits` - 通院記録 (DB テーブルは `doctor_visits` で作成済み)
- `/mypage/notifications` - 通知設定
- `/mypage/security` - パスワード・暗号化設定
- `/mypage/data` - データエクスポート・全削除
- `/mypage/settings` - 表示・テーマ設定

### 📋 Phase 2 以降

- iOS/Android アプリ化 (Capacitor)
- 主治医共有レポート PDF 出力
- データ全削除機能の本実装
- 多言語対応 (英語)

---

## 7. 開発ワークフロー

```bash
# 初回
cp .env.example .env.local
# .env.local に DATABASE_URL, AUTH_SECRET, ANTHROPIC_API_KEY を設定

npm install
docker compose up -d            # PostgreSQL 起動
npm run db:push                 # Drizzle スキーマを DB に反映
npm run dev                     # http://localhost:3000

# テスト
npm run test                    # Vitest (ユニットテスト)
npm run test:e2e                # Playwright (E2E)

# DB 管理
npm run db:generate             # マイグレーション生成
npm run db:migrate              # マイグレーション適用
npm run db:studio               # Drizzle Studio (DB GUI)
```

---

## 8. Claude Code への指示テンプレート

新機能を実装するときは、以下のフォーマットで Claude Code に依頼してください:

```
[機能名] を実装してください。

要件:
- 仕様: docs/komorebi-spec.html の該当セクション参照
- 設計原則: CLAUDE.md セクション 4 に従う
- 既存パターン: src/app/(main)/record/mood/page.tsx を参照

特に注意:
- [この機能で踏み外しやすい倫理ライン]

成果物:
- ページ実装
- 必要なら API ルート
- Supabase マイグレーション (必要なら)
- 既存コードへの影響箇所
```

---

## 9. やってはいけないこと（最終チェックリスト）

実装する際、PR を出す前に以下を自問してください:

- [ ] 連続記録日数や DAU を可視化する UI を入れていないか
- [ ] 「あなたは〇〇障害です」と AI に断定させていないか
- [ ] 「もっと記録しましょう」「サボらないで」という押し付けがないか
- [ ] エラー文言が利用者を責める言い方になっていないか（× 「入力が間違っています」 ○ 「もう一度試してみてください」）
- [ ] 危機キーワードに対して、共感と専門リソース提示の **両方** が出るか
- [ ] 自由記述データをサーバーログ / Sentry に流していないか
- [ ] アクセシビリティ: コントラスト比 AA / フォントサイズ拡大対応 / フォーカスリング表示

---

最後に。このアプリは「使う人の人生に長く寄り添う」ことが目的です。技術的に華やかな機能より、**5 年後にも変わらず安心して開ける** ことを優先してください。
