# ピアノレンタル管理システム 仕様書

最終更新: 2026-03-24

---

## 1. 概要

ピアノレンタル事業（ご家庭/教室向け長期レンタル＋イベント向け短期レンタル）を
一元管理するための社内業務システム。

| 項目 | 内容 |
|------|------|
| 運営会社 | 株式会社エルフラット（L-flat PiANOS Co.,LTD） |
| 対象ユーザー | 社内スタッフ（オーナー・スタッフ・閲覧のみ） |
| 主な機能 | 顧客管理・ピアノ在庫管理・契約管理・帳票発行・入金管理 |
| リポジトリ | GitHub `L-flat-co/piano-rental-service` |

---

## 2. 技術スタック

| 層 | 技術 |
|----|------|
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| Backend | Next.js Server Actions + API Routes |
| Database | Supabase (PostgreSQL + Row Level Security) |
| Auth | Supabase Auth |
| PDF生成 | @react-pdf/renderer v3.4.4 |
| メール送信 | Resend |
| Storage | Supabase Storage (`invoice-pdfs` バケット) |
| Hosting | Vercel |

---

## 3. 環境変数

| 変数名 | 必須 | 説明 |
|--------|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Supabase Service Role Key（Admin Client 用） |
| `RESEND_API_KEY` | — | Resend API キー（メール送信機能に必要） |
| `NEXT_PUBLIC_APP_URL` | — | アプリ URL（メール内リンク用） |

---

## 4. 認証・ロール

Supabase Auth でメール/パスワード認証。`staff` テーブルと `auth.users` を `auth_user_id` で紐付け。

| ロール | 権限 |
|--------|------|
| `owner` | 全操作（設定変更含む） |
| `staff` | 顧客・契約・帳票の読み書き |
| `viewer` | 全テーブル SELECT のみ |

RLS ポリシーで `get_staff_role(auth.uid())` を使い、テーブル単位でアクセス制御。

---

## 5. DB設計

### ENUM型（15個）

```
staff_role, service_type, contract_period, piano_type, piano_status,
contract_status, contract_origin, event_status, invoice_status,
payment_method, document_type, spot_fee_section, spot_fee_entry_type,
customer_status, plan_type
```

### テーブル一覧（14テーブル）

| テーブル | 主な列 | 説明 |
|---------|--------|------|
| `staff` | auth_user_id, name, email, role | 管理者ユーザー |
| `system_settings` | company_name, tax_rate, bank_info, invoice_due_days | システム設定（1レコード） |
| `customers` | name, name_kana, email, phone, address, status | 顧客マスタ |
| `pianos` | maker, model, serial_number, piano_type, status | ピアノ在庫 |
| `rental_plans` | plan_type, period, name, monthly_fee, is_active | 料金プラン（UNIQUE: plan_type+period、6件固定） |
| `rental_options` | name, monthly_fee, is_active | 月額オプション |
| `spot_fee_types` | name, unit_price, unit, is_active | スポット費用マスタ |
| `contracts` | customer_id, piano_id, plan_id, option_ids[], contract_period, status, start_date, billing_day | ご家庭/教室用契約 |
| `event_contracts` | customer_id, piano_id, piano_type, event_name, venue, delivery_date, pickup_date, status | イベント用案件 |
| `contract_spot_fees` | contract_id, contract_type, section(initial/monthly), label, amount, quantity, memo | スポット費用明細（両契約兼用） |
| `invoices` | invoice_number, contract_id/event_contract_id, customer_id, billing_month, subtotal, tax_amount, total_amount, status, pdf_url | 請求書 |
| `invoice_items` | invoice_id, label, unit_price, quantity, amount, sort_order | 請求書明細 |
| `payments` | invoice_id, customer_id, payment_date, amount, payment_method | 入金記録 |
| `documents` | document_type, document_number, pdf_url, sent_at, sent_to | 帳票履歴 |

---

## 6. マスタデータ（seed.sql）

### rental_plans（6件固定）

| plan_type | period | name | monthly_fee（税込） |
|-----------|--------|------|-------------------|
| home | yearly | ご家庭用（1年契約） | ¥5,500 |
| home | half_year | ご家庭用（半年契約） | ¥6,050 |
| home | monthly | ご家庭用（単月契約） | ¥6,600 |
| school | yearly | 教室用（1年契約） | ¥7,700 |
| school | half_year | 教室用（半年契約） | ¥8,250 |
| school | monthly | 教室用（単月契約） | ¥8,800 |

### rental_options（3件）

| name | monthly_fee（税込） |
|------|-------------------|
| あんしん楽器プラン | ¥1,100 |
| 機種自己選択 | ¥1,100 |
| 消音機能付きピアノ | ¥1,100 |

### spot_fee_types（4件）

| name | unit_price（税込） | unit |
|------|-------------------|------|
| 調律料（アップライト） | ¥16,500 | 回 |
| 調律料（グランド） | ¥19,800 | 回 |
| 時間外料金 | ¥5,500 | 時間 |
| 時間指定料金 | ¥3,300 | 回 |

---

## 7. 管理画面ページ一覧

### Admin ページ（26ページ）

| パス | 説明 |
|------|------|
| `/admin/login` | ログイン画面 |
| `/admin/dashboard` | ダッシュボード（KPI・タイムライン・未送付アラート） |
| `/admin/customers` | 顧客一覧（検索・CSVインポートリンク） |
| `/admin/customers/new` | 顧客新規登録 |
| `/admin/customers/[id]` | 顧客詳細 |
| `/admin/customers/[id]/edit` | 顧客編集 |
| `/admin/customers/import` | 顧客CSVインポート |
| `/admin/pianos` | ピアノ一覧（ステータスフィルタ・稼働率） |
| `/admin/pianos/new` | ピアノ新規登録 |
| `/admin/pianos/[id]` | ピアノ詳細 |
| `/admin/pianos/[id]/edit` | ピアノ編集 |
| `/admin/contracts` | ご家庭/教室用契約一覧（検索・ステータスフィルタ・CSVエクスポート） |
| `/admin/contracts/new` | 契約登録（初期費用セクション付き） |
| `/admin/contracts/[id]` | 契約詳細（契約書PDF・初期費用・月額・解約ボタン） |
| `/admin/contracts/[id]/edit` | 契約編集 |
| `/admin/events` | イベント案件一覧（ステータスタブ・検索） |
| `/admin/events/new` | イベント案件登録（初期費用セクション付き） |
| `/admin/events/[id]` | イベント案件詳細（ステータス変更・キャンセルモーダル） |
| `/admin/events/[id]/edit` | イベント案件編集 |
| `/admin/invoices` | 請求書一覧（一括発行ボタン） |
| `/admin/invoices/new` | 請求書生成 |
| `/admin/invoices/[id]` | 請求書詳細（見積書/請求書/領収書PDF・メール送信・入金記録） |
| `/admin/payments` | 入金管理（KPI・記録一覧・未入金一覧） |
| `/admin/pricing` | 料金設定（プラン・オプション・スポット費用） |
| `/admin/settings` | システム設定 ※Phase 3 |
| `/admin/reports` | 会計レポート ※Phase 3 |

### API Routes（4エンドポイント）

| パス | メソッド | 説明 |
|------|---------|------|
| `/api/invoices/[id]/pdf` | GET | 請求書/見積書/領収書 PDF（`?type=invoice\|estimate\|receipt`） |
| `/api/contracts/[id]/pdf` | GET | 契約書 PDF（テンプレート準拠） |
| `/api/contracts/export` | GET | 契約一覧 CSV エクスポート（BOM付きUTF-8） |
| `/api/customers/import` | POST | 顧客 CSV インポート（列名自動マッピング） |

---

## 8. 機能仕様

### 8.1 顧客管理

- CRUD（name, name_kana, company_name, email, phone, postal_code, address, memo）
- ステータス: active / suspended / terminated
- CSVインポート（ドラッグ&ドロップ、列名自動マッピング、結果サマリー）
- 顧客詳細: 基本情報 + 紐づく契約・請求書一覧

### 8.2 ピアノ在庫管理

- CRUD（maker, model, serial_number, piano_type, is_mute, is_white, storage_location, memo）
- ステータス: available / rented / maintenance / disposed
- 契約登録時に自動で `rented`、解約時に `available` へ遷移
- 稼働率サマリー表示

### 8.3 ご家庭/教室用契約

**契約登録フォーム:**
- 顧客選択 → ピアノ選択（在庫のみ）→ プラン選択 → オプション選択
- 契約期間（yearly / half_year / monthly）はプラン選択で自動セット
- 開始日・請求日（1〜28日）・メモ

**初期費用セクション（`InitialFeeSection`）:**
- **運送費** — 常設フィールド
  - ラジオ選択: `往復` / `搬入のみ`
  - 金額は都度直接入力（税抜）
  - `搬入のみ` 選択時: 搬出参考金額フィールドが表示（薄いスタイル、`※搬出費用は解約時に別途請求` 注記）
- **その他の費用** — マスタからクイック追加（調律料等）+ カスタム品目追加
- 保存先: `contract_spot_fees`（section='initial'）
  - 往復: `label='運送費（往復）'`
  - 搬入のみ: `label='運送費（搬入）'` + `label='搬出費用（参考）', quantity=0, memo='pickup_pending'`

**月額費用:**
- プラン月額 + 選択オプション月額の合計を自動計算・表示

**中途解約料自動計算:**
- `yearly` → 最低12ヶ月、`half_year` → 最低6ヶ月、`monthly` → 解約料なし
- 解約日が最低期間満了前の場合: 残り月数（切り上げ） × 月額合計（税込）
- 解約モーダルで入力日に連動してリアルタイムプレビュー

**搬出費用の解約時追跡:**
- 解約モーダルに搬出費用セクションを表示
  - `往復` → 「搬出費込み」（アクション不要）
  - `搬入のみ + 搬出請求済み` → 「請求済み」
  - `搬入のみ + 搬出未請求` → 「未請求」+ 搬出請求書同時作成チェックボックス（金額編集可）
- チェックON + 解約実行で `draft` の搬出請求書を自動生成

**解約処理:**
- ステータスを `terminated` に変更、`end_date` を記録
- ピアノを `available` に戻す
- 搬出請求書の自動作成（オプション）

### 8.4 イベント案件

**ステータスフロー:**
```
estimate → confirmed → completed
              ↓
          cancelled
```

**案件登録フォーム:**
- 顧客・案件名・会場・搬入日/搬出日・ピアノ種別・ピアノ割当（任意）・メモ
- 初期費用セクション（契約と同一の `InitialFeeSection` を共用）

**キャンセルポリシー（`EVENT_CANCEL_POLICY`）:**

| 条件 | キャンセル料率 |
|------|-------------|
| 搬入日の8日以上前 | 0%（無料） |
| 搬入日の3〜7日前 | 50% |
| 搬入日の2日前以内 | 100% |

- 基準金額: 関連請求書（draft/issued/paid）の total_amount 合計
- キャンセルモーダルでリアルタイム計算プレビュー

### 8.5 帳票発行

**請求書（INV-YYYYMM-NNN）:**
- 自動生成: 月額プラン + オプション + スポット費用を合算
- 一括発行: 指定月の全アクティブ契約に対し一括生成（重複スキップ）
- ステータス: draft → issued → paid / cancelled
- カスタム品目追加/削除（draft のみ）
- Supabase Storage に自動保存（pdf_url）

**見積書（`?type=estimate`）:**
- 請求書データを使い、タイトル/ラベルを変更（見積書番号・有効期限・お見積先・御見積内容）
- 振込先情報は非表示

**領収書（`?type=receipt`）:**
- `paid` の請求書から生成、タイトル/ラベルを変更（領収書番号・宛先・内訳）
- 振込先情報は非表示

**契約書（CNT-YYYYMM-XXXX）:**
- 実物テンプレート準拠のレイアウト
- 構成: ヘッダー帯 → 契約番号バー → 借主/貸主2カラム（署名欄付き）→ レンタル商品・設置情報 → 料金明細（初期費用+月額費用）→ お支払い情報 → 契約条件（7項目固定文）→ フッター
- プラン種別/契約形態は ■/□ チェックボックス表示

**PDF共通:**
- フォント: NotoSansJP（ローカル優先、CDN fallback）
- ロゴ: `/public/images/logo.png`（透明部分トリム済み）
- カラー: 紺色（#1e3a5f）ヘッダー帯・セクションヘッダー・フッター

### 8.6 メール送信

- Resend API 経由で HTML メール送信
- 請求書詳細ページのサイドバーに「メール送信」ボタン
- モーダル: 送信先（顧客メールを初期値）・件名（自動生成）・追加メッセージ
- 送信後、draft の請求書は自動で `issued` に昇格
- RESEND_API_KEY 未設定時はエラーメッセージを表示

### 8.7 入金管理

- 入金記録（payment_date, amount, payment_method, notes）
- 記録時に請求書を `paid` に自動昇格
- 削除時に最後の入金なら `issued` に戻す
- `/admin/payments` ページ: KPI4枚 + 入金記録一覧 + 未入金請求書一覧（期限超過ハイライト）
- 請求書詳細（`issued` 状態のみ）のサイドバーに「入金を記録する」ボタン

### 8.8 料金プラン管理

- **基本プラン**: 6件固定（追加/削除不可）、金額・名前・有効/無効をインライン編集
- **月額オプション**: CRUD、インライン編集、有効/無効トグル
- **スポット費用マスタ**: CRUD、`unit` フィールド（回/時間等）、有効/無効トグル

### 8.9 ダッシュボード

- KPIカード（アクティブ契約数・今月請求総額・未入金数・進行中イベント数）→ クリックで各一覧へ遷移
- 直近アクティビティタイムライン（過去30日・契約+請求書、最新10件）
- 未送付請求書アラート（draft 状態の請求書をアンバーバナーで表示）
- 未入金請求書カード

### 8.10 CSV機能

- **契約一覧エクスポート**: 21カラム、BOM付きUTF-8、Excel対応
- **顧客CSVインポート**: RFC 4180パーサー、列名自動マッピング（日本語→DBフィールド）、結果サマリー

---

## 9. 帳票番号体系

| 帳票種別 | プレフィックス | フォーマット | 例 |
|---------|-------------|-----------|-----|
| 見積書 | EST | EST-{INV番号} | EST-INV-202603-001 |
| 契約書 | CNT | CNT-YYYYMM-XXXX | CNT-202603-A1B2 |
| 請求書 | INV | INV-YYYYMM-NNN | INV-202603-001 |
| 領収書 | RCP | RCP-{INV番号} | RCP-INV-202603-001 |

---

## 10. 消費税

- デフォルト税率: 10%（`DEFAULT_TAX_RATE = 0.1`）
- マスタデータ（rental_plans, rental_options, spot_fee_types）は**税込**で格納
- 請求書明細（invoice_items）は**税抜**で格納し、subtotal → tax_amount → total_amount を計算

---

## 11. 運送費デフォルト値

| 種別 | 金額（税込） |
|------|------------|
| 片道 | ¥48,400 |
| 往復 | ¥96,800（片道×2 が目安） |

※ 実際の金額は案件ごとに直接入力（距離・条件により変動）

---

## 12. 実装フェーズ

### Phase 1 — MVP ✅ 完了
セットアップ、認証、ダッシュボード、顧客管理、ピアノ在庫管理、
ご家庭/教室用契約管理、請求書自動生成・PDF・一括発行・Storage保存・メール送信、
料金プラン管理、CSV機能

### Phase 2 — イベント用・帳票充実 ✅ 完了
イベント案件管理、キャンセル料自動計算、見積書/領収書/契約書PDF、入金管理

### Phase 3 — 運用最適化（未着手）
- 請求書バッチ自動生成（月次）
- 会計レポート・グラフ
- CSVエクスポート（会計ソフト向け）
- システム設定画面
- メールテンプレート管理

### Phase 4 — 将来（未着手）
- applications テーブル追加
- 公開Web申込フォーム
- 申込→審査→契約ワンストップフロー
- Stripe連携

---

## 13. Server Actions 一覧

| ファイル | 主なアクション |
|---------|-------------|
| `auth-actions.ts` | signIn, signOut, getCurrentStaff |
| `customer-actions.ts` | getCustomers, getCustomer, createCustomer, updateCustomer |
| `piano-actions.ts` | getPianos, getPiano, createPiano, updatePiano |
| `contract-actions.ts` | getContracts, getContract, createContract, updateContract, terminateContract, calculateEarlyTerminationFee |
| `event-actions.ts` | getEventContracts, getEventContract, createEventContract, updateEventContract, updateEventStatus, calculateCancellationFee |
| `invoice-actions.ts` | getInvoices, getInvoice, generateInvoice, bulkGenerateInvoices, updateInvoiceStatus, addCustomInvoiceItem, removeInvoiceItem, getSystemSettings |
| `email-actions.ts` | sendInvoiceEmail |
| `payment-actions.ts` | getPayments, recordPayment, deletePayment, getUnpaidInvoices |
| `pricing-actions.ts` | getAllPlans, updatePlan, getOptions, createOption, updateOption, getSpotFeeTypes, createSpotFeeType, updateSpotFeeType |

---

## 14. 主要コンポーネント

| コンポーネント | 用途 |
|-------------|------|
| `Sidebar.tsx` | サイドバーナビゲーション |
| `ContractForm.tsx` | 契約登録/編集（InitialFeeSection 内包） |
| `EventForm.tsx` | イベント案件登録/編集（InitialFeeSection 内包） |
| `InitialFeeSection.tsx` | 初期費用入力（運送費 往復/搬入のみ + その他費用） |
| `TerminateButton.tsx` | 解約モーダル（中途解約料 + 搬出費用追跡） |
| `EventStatusButtons.tsx` | イベントステータス変更 + キャンセルモーダル |
| `InvoicePDF.tsx` | 請求書/見積書/領収書PDF（`documentType` で切替） |
| `ContractPDF.tsx` | 契約書PDF（テンプレート準拠） |
| `BulkGenerateButton.tsx` | 一括請求書発行モーダル |
| `SendEmailButton.tsx` | メール送信モーダル |
| `RecordPaymentButton.tsx` | 入金記録モーダル |
| `AddInvoiceItemForm.tsx` | 請求書カスタム品目追加 |
| `PlanSection.tsx` | 基本プランインライン編集 |
| `OptionSection.tsx` | 月額オプションCRUD |
| `SpotFeeSection.tsx` | スポット費用マスタCRUD |
