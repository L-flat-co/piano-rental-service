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

### Vercel デプロイ完了
- GitHub リポジトリ: `L-flat-co/piano-rental-service`
- Vercel プロジェクト: `piano-rental-service`（l-flat-co's projects / Hobby）
- 本番URL: `https://piano-rental-service.vercel.app`
- 環境変数 4件を Vercel に設定済み

### 次のアクション（手動作業）
1. Supabase SQL Editor で schema.sql を実行
2. Supabase SQL Editor で seed.sql を実行
3. Supabase Authentication > Users でオーナーユーザーを作成
4. staff テーブルに owner レコードを INSERT
5. `npm run dev` でローカル動作確認 → ログイン画面が表示されればOK

## 2026-03-21 — Phase 1 セットアップ完了 ✅

### 完了した手動作業
- Supabase SQL Editor で schema.sql を実行（全テーブル・RLS・トリガー）
- Supabase SQL Editor で seed.sql を実行（マスタ初期データ）
- Supabase Authentication でオーナーユーザーを作成
- staff テーブルに owner レコードを INSERT
- ローカル `npm run dev -p 3001` でダッシュボード表示確認 ✅

### バグ修正
- `src/app/admin/layout.tsx` のリダイレクトループを修正
  - **原因**: layout.tsx が /admin/login にも適用されるため、未ログイン時に `redirect('/admin/login')` を呼ぶと自己ループが発生
  - **修正**: layout.tsx から redirect を削除し、未ログイン時は `<>{children}</>` をそのまま返す。認証保護はミドルウェアに一元化

### Phase 1 基盤構築 完了
- ローカル開発環境・Supabase DB・Vercel デプロイすべて稼働確認済み
- 次は Phase 1 機能実装（顧客管理・ピアノ管理・契約管理・帳票発行）へ

## 2026-03-21 — 帳票発行・CSV機能 追加 ✅

### 請求書PDF redesign
- InvoicePDF.tsx を仕様書サンプルデザインに合わせてリデザイン
  - 紺色ヘッダー帯（高さ70pt）・ロゴ左配置・書類タイトル右配置
  - 2カラム（宛先情報 / 発行者情報）・紺色セクションヘッダー
  - 品目テーブル・合計ボックス（紺色）・備考欄・紺色フッター
- ロゴ画像対応（public/images/logo.png）
  - PDF API route でロゴパスを解決し `logoSrc` として InvoicePDF に渡す

### 料金プラン管理画面 追加
- `/admin/pricing` — rental_plans / rental_options / spot_fee_types の管理画面
- Server Actions: `pricing-actions.ts`（getAllPlans / updatePlan / getOptions / createOption / updateOption / getSpotFeeTypes / createSpotFeeType / updateSpotFeeType）
- Client Components: PlanSection / OptionSection / SpotFeeSection（インライン行編集）

### ダッシュボード強化
- 下書き請求書アラートバナー
- 直近30日アクティビティタイムライン（契約＋請求書）
- KPIカードのリンク化

### 手動品目追加（カスタム明細）
- 請求書詳細画面（下書き状態限定）で品目の追加・削除
- `addCustomInvoiceItem` / `removeInvoiceItem` Server Actions
- `recalcInvoiceTotals` で合計を自動再計算

### 契約一覧CSVエクスポート
- `/api/contracts/export` — 21カラム・BOM付きUTF-8（Excel対応）
- 契約一覧ページに「CSVエクスポート」ボタン追加

### 顧客CSVインポート
- `/api/customers/import` — 列名自動マッピング（複数エイリアス対応）
- CustomerImportForm — ドラッグ＆ドロップ UI・結果サマリー表示
- `/admin/customers/import` ページ追加
- 顧客一覧ページに「CSVインポート」ボタン追加

### 一括発行（当月分まとめて生成）
- `bulkGenerateInvoices` Server Action — アクティブな全契約に対して請求月指定で一括生成
  - 既存インボイスがある契約はスキップ（重複防止）
  - 生成件数・スキップ件数・エラー詳細を返す
- BulkGenerateButton Client Component — モーダルダイアログ形式
  - 請求月・発行日・支払期限・備考を入力して実行
  - 生成後は件数サマリーを表示
- 帳票発行一覧ページに「一括発行」ボタン追加

## 2026-03-21 — Phase 1 残タスク完了 ✅

### 中途解約料自動計算
- `calculateEarlyTerminationFee` Server Action 追加（`contract-actions.ts`）
  - 契約期間（yearly/half_year/monthly）に応じて最低契約満了日を算出
  - 解約日が満了前の場合、残り月数（切り上げ）× 月額合計（税込）を返す
  - 単月契約は解約料なし
- `TerminateButton.tsx` 更新: `useTransition` で解約日変更のたびに自動計算・プレビュー表示

### Supabase Storage PDF保存
- `Invoice` 型に `pdf_url: string | null` を追加
- PDF route が生成後に `invoice-pdfs` バケットへアップロード（失敗は非致命的）
- 請求書詳細ページに「保存済みPDF」リンクを追加
- **Supabase 手動作業**: `ALTER TABLE invoices ADD COLUMN IF NOT EXISTS pdf_url TEXT;` + バケット作成

### メール送信（Resend）
- `src/actions/email-actions.ts` 新規: `sendInvoiceEmail` Server Action
  - HTMLメールテンプレート（請求書情報テーブル・PDFリンク・カスタムメッセージ対応）
  - 送信後、下書き請求書を自動的に「発行済み」に変更
- `src/components/invoices/SendEmailButton.tsx` 新規: モーダル形式の送信UI
- 請求書詳細ページのサイドバーに「メール送信」セクション追加
- **起動条件**: `.env.local` に `RESEND_API_KEY` を設定すること

### Phase 1 全タスク完了

## 2026-03-21 — Phase 2 実装 ✅

### イベント案件管理
- `src/actions/event-actions.ts` 新規（CRUD + `calculateCancellationFee`）
  - キャンセルポリシー: 8日前以上=無料 / 7〜3日前=50% / 2日前以内=100%
- `EventForm.tsx` / `EventStatusButtons.tsx`（キャンセルモーダル・料金プレビュー付き）
- 一覧ページ（ステータスタブ・検索）、詳細ページ、新規・編集ページ

### 見積書・領収書 PDF
- `InvoicePDF.tsx` に `documentType: 'invoice' | 'estimate' | 'receipt'` prop 追加
- PDF API route が `?type=estimate` / `?type=receipt` クエリに対応
- 請求書詳細ページのPDFボタンをドロップダウン化（3種類選択）

### 入金管理
- `payment-actions.ts`（recordPayment / deletePayment / getUnpaidInvoices）
- `RecordPaymentButton.tsx`（モーダル形式）
- `/admin/payments` ページ（KPI4枚 + 記録一覧 + 未入金一覧）
- 請求書詳細ページのサイドバーに「入金を記録する」追加

## 2026-03-21 — 契約書PDF生成 ✅

### ContractPDF（テンプレート準拠）
- `src/components/contracts/ContractPDF.tsx` 新規作成
  - 実物テンプレート（`【契約書】テンプレート_L-flat.pdf`）に合わせた構成
  - ヘッダー帯（ロゴ + 「ピアノレンタル契約書 / LEASING PIANO AGREEMENT」）
  - 契約番号バー（CNT-YYYYMM-XXXX / 契約日 / 見積番号）
  - 2カラム：借主（顧客情報・署名欄）/ 貸主（会社情報・社印欄）
  - レンタル商品・設置情報セクション（ピアノ情報・プラン種別・契約形態のチェックボックス表示）
  - 料金明細（初期費用テーブル + 月額費用テーブル + 合計ボックス）
  - お支払い情報（振込先・請求日）
  - 契約条件（7項目固定テキスト）
- `src/app/api/contracts/[id]/pdf/route.tsx` 新規作成
  - 契約データ + 初期費用スポット明細を取得してPDF生成
  - ファイル名: `CNT-{YYYYMM}-{UUID4chars}.pdf`
- 契約詳細ページのヘッダーに「契約書PDF」ボタンを追加

### Phase 2 全タスク完了

## 2026-03-25 — Phase 3 実装 + SPEC.md 作成

### SPEC.md 作成
- `~/Desktop/piano-rental-service/SPEC.md` に全14セクションの仕様書を作成
- 全テーブル・ページ・アクション・コンポーネントを網羅

### 運送費デフォルト修正
- 片道 ¥48,400 / 往復 ¥96,800 に修正（SPEC.md + constants.ts）

### システム設定画面（/admin/settings）
- `settings-actions.ts` — getSettings / updateSettings
- `SettingsForm.tsx` — 会社情報・請求設定・振込先・メールテンプレート
- `/admin/settings/page.tsx` — 設定ページ

### 会計レポート（/admin/reports）
- `report-actions.ts` — getReportSummary（年次・月次集計）
- 月次推移バーチャート（CSS棒グラフ・請求額/入金額）
- 月次テーブル（請求額・入金額・未回収・回収率）
- KPI5枚（年間請求額・入金額・未回収残高・契約数・イベント数）
- 年切替ナビゲーション

### CSVエクスポート（会計ソフト向け）
- `/api/reports/export?year=YYYY` — 請求一覧+入金一覧を1ファイルに結合
- BOM付きUTF-8、Excel対応
- レポートページにCSVボタン追加

### メールテンプレート管理
- `SystemSettings` 型に `email_subject_template` / `email_body_template` を追加
- 設定画面で件名テンプレート・デフォルト追加メッセージを編集可能
- `SendEmailButton` が設定値を初期値として使用
- **Supabase手動作業**: `ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_subject_template TEXT; ALTER TABLE system_settings ADD COLUMN IF NOT EXISTS email_body_template TEXT;`

## 2026-03-25 — Phase 4 Web申込フロー ✅

### applications テーブル
- `supabase/migrations/add_applications.sql` — 新テーブル + ENUM + RLS
- RLS: 公開INSERT（認証不要）+ 管理者全操作 + 閲覧者SELECT
- `Application` 型を `types/index.ts` に追加

### 公開Web申込フォーム（/apply）
- `/apply` — 認証不要の公開ページ（ロゴ付きヘッダー・フッターレイアウト）
- `ApplicationForm.tsx` — プラン種別/契約期間（カード選択UI）/ピアノ種別/オプション（チェックボックス）/設置場所入力
- 月額合計をリアルタイム表示（プラン+オプション）
- `/apply/complete` — Thank you ページ

### application-actions.ts
- `submitApplication` — 公開フォームから申込（Admin Client使用）
- `getApplications` / `getApplication` — 管理画面用一覧/詳細
- `updateApplicationStatus` — submitted → reviewing → approved / rejected
- `convertToContract` — 承認→契約変換（顧客自動作成/既存検索 + 契約作成 + ピアノ割当 + 運送費 + ステータス更新）
- `getNewApplicationCount` — ダッシュボード通知用

### 管理画面
- `/admin/applications` — 申込一覧（ステータスタブ・検索）
- `/admin/applications/[id]` — 申込詳細（申込者情報・レンタル希望・設置場所・ステータス変更・契約変換ボタン）
- `ApplicationStatusButtons.tsx` — ステータス変更ボタン群
- `ConvertToContractButton.tsx` — 契約変換モーダル（ピアノ割当・開始日・請求日・運送費入力）

### サイドバー + ダッシュボード
- サイドバーに「Web申込」ナビ追加（clipboard-list アイコン）
- ダッシュボードに新規申込アラート（submitted件数）

### Supabase手動作業
`supabase/migrations/add_applications.sql` を Supabase SQL Editor で実行すること

## 2026-04-01 — Phase 4 以降の機能追加 ✅

### 契約フォーム拡張
- 支払方法に `direct_debit`（口座振替）を追加（DB ENUM + UI）
- 付属品セクション追加（ピアノ椅子・インシュレーター・敷板・ヘッドホン + カスタム追加）
- カスタム月額オプション（名前+月額を自由入力で追加）
- 運送費: 搬入のみ選択時に搬出参考金額が運送費と自動連動
- 契約書PDF: 付属品・支払方法・領収書代替文言を反映

### 契約詳細ページ UIリニューアル
- 「さん」→「様」表記
- 顧客・ピアノを上部に横並び表示（サイドバー廃止→1カラム化）
- 見積書・請求書リストを契約詳細内に表示
- 初期費用の編集・追加・削除機能（EditInitialFees コンポーネント）
- 契約抹消機能（完全抹消 / 一部保持の2モード）
- 顧客・ピアノの削除機能（紐づきチェック付き）

### 見積書フロー
- 契約詳細から「見積書を作成」→ `/admin/contracts/[id]/estimate/new`
  - プラン・オプション・カスタムオプション・初期費用を自由に変更可能
  - 同じ契約から複数見積書を作成可能（オプション違い比較用）
- `createEstimateWithOptions` Server Action（`estimate_metadata` JSONB保存）
- 見積→請求書変換時にメタデータで契約内容を自動更新
- 見積書リスト表示（契約詳細内）
- 備考の編集機能（EditableNotes コンポーネント）

### 契約ステータス拡張
- `draft`（見積段階）→ `confirmed`（契約書PDF発行時に自動）→ `active`（開始日到来で自動）→ `terminated`（解約）
- 契約書PDFダウンロード時に draft → confirmed へ自動遷移
- ページ表示時に confirmed + start_date ≤ 今日 → active へ自動遷移

### 月次請求書自動生成 + メール自動送信
- `/api/cron/monthly-billing` — Vercel Cron（毎日 UTC 0:00 = JST AM 9:00）
- 支払期限 = start_date の日 - 1（1日開始は28日、上限28日で2月対応）
- 発行日 = 支払期限 - invoice_due_days（システム設定）
- 重複防止（同月・同契約の INV が既にあればスキップ）
- 顧客にメールアドレスがあれば HTML メールで自動送信
- `CRON_SECRET` で外部からの不正実行を防止

### スタッフ管理
- `/admin/staff` ページ新規作成
- スタッフ追加（Supabase Auth ユーザー作成 + staff テーブル INSERT）
- ロール変更・パスワード変更・有効/無効切り替え

### ドメイン・メール設定
- `rental.l-flat-reserve.com` を Vercel に設定（お名前.com A レコード `76.76.21.21`）
- Resend: 親ドメイン `l-flat-reserve.com` の DKIM を共有（追加設定不要）
- SPF TXT レコード追加
- `FROM_EMAIL` を `noreply@rental.l-flat-reserve.com` に更新

### システム設定修正
- 設定保存が動作しない問題を修正（Admin Client で RLS バイパス）
- 「支払期限（日数）」→「請求書発行日（支払期限の◯日前）」にラベル修正

### 支払期限ロジック統一（全6箇所）
- 1日開始 → 28日（前月末扱い）
- 30/31日開始 → 28上限で2月対応
- Cron / 契約詳細 / 契約一覧 / 契約フォーム / 契約書PDF / 申込→契約変換

<!-- 以降、機能追加・仕様変更のたびに追記 -->
