# 変更・仕様履歴ログ

このファイルは仕様変更・実装完了・設計決定の記録を時系列で蓄積します。

---

## 2026-03-20 — プロジェクト開始

### 仕様書読み込み
- 仕様書 `ピアノレンタル管理システム_仕様書_v1.3.docx` を確認
- 2サービスライン（ご家庭/教室用・イベント用）の構成を把握

### 確認済み技術スタック
- Next.js 14 (App Router) + TypeScript + Tailwind CSS
- Supabase（DB・Auth・Storage）
- @react-pdf/renderer（PDF生成）
- Resend（メール送信）
- Vercel（ホスティング）
- Zustand / React Query（状態管理）

### インフラ
- Supabase・Vercel・Resend は music-room-booking プロジェクトで既存アカウント済み
- 本システムは独立したプロジェクトとして新規追加

### 開発フェーズ方針
- Phase 1: 顧客管理・ご家庭/教室用契約・請求書PDF（MVP）
- Phase 2: イベント用・帳票充実
- Phase 3: 運用最適化
- Phase 4: Web申込フロー統合（将来）

---

## 2026-03-20 — Phase 1 基盤構築 ✅

### 作成ファイル
- `package.json` — 依存パッケージ定義（Next.js 14 / Supabase / @react-pdf/renderer / Resend / Zod 等）
- `tsconfig.json`, `next.config.mjs`, `postcss.config.mjs`, `tailwind.config.ts` — 設定ファイル
- `.env.local.example`, `.gitignore` — 環境変数テンプレート・除外設定
- `src/middleware.ts` — 認証・ロールチェック（/admin/* 保護）
- `src/types/index.ts` — 全テーブルの型定義
- `src/lib/constants.ts` — ラベル・色・ナビゲーション等の定数
- `src/lib/utils.ts` — 金額フォーマット・日付フォーマット・税計算ユーティリティ
- `src/lib/supabase/{client,server,admin}.ts` — Supabase クライアント
- `src/lib/resend.ts` — Resend クライアント
- `src/actions/auth-actions.ts` — signIn / signOut / getCurrentStaff
- `src/app/layout.tsx`, `page.tsx` — ルートレイアウト・リダイレクト
- `src/app/admin/login/page.tsx` — ログイン画面
- `src/app/admin/layout.tsx` — 管理画面共通レイアウト
- `src/app/admin/dashboard/page.tsx` — KPIカード・クイックアクション
- `src/components/layout/Sidebar.tsx` — サイドバーナビゲーション（9項目）
- `supabase/schema.sql` — 全テーブル定義・RLS・トリガー
- `supabase/seed.sql` — マスタ初期データ（プラン6件・オプション3件・スポット費用4件）

### ビルド確認
- `npm run build` 成功（エラーなし）

### 設計決定事項
- Stripe は Phase 3 以降のため今回は除外
- `staff` テーブルで auth_user_id に基づくロール管理（music-room-bookingの is_admin/role から変更）
- 運送費はマスタ管理しない（帳票作成時に手入力、仕様書通り）
- clsx を utils.ts で使用するため追加

## 2026-03-21 — インフラ設定・意思決定メモ

### 環境変数設定
- Supabase プロジェクト作成完了
- `.env.local` に SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY を設定済み
- RESEND_API_KEY はメール実装タイミングで設定予定

### ドメイン方針（決定）
- 既存ドメインあり（所有権はあるが管理権限は管理会社が保有）
- DNS変更は管理会社への依頼が必要（数日〜1週間かかる可能性あり）
- 本番公開まではVercelの自動ドメイン（xxx.vercel.app）を使用
- 本番公開1〜2週間前に管理会社へ依頼開始すること
- 推奨構成:
  - `admin.ドメイン名` → Vercel（管理システム）
  - `mail.ドメイン名` → Resend（メール送信用）
- 将来的にDNS管理をCloudflareへ移管することも選択肢として保留

### 次のアクション（手動作業）
1. Supabase SQL Editor で schema.sql を実行
2. Supabase SQL Editor で seed.sql を実行
3. Supabase Authentication > Users でオーナーユーザーを作成
4. staff テーブルに owner レコードを INSERT
5. `npm run dev` で動作確認

<!-- 以降、機能追加・仕様変更のたびに追記 -->
