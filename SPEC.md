# ピアノレンタル管理システム 仕様書

最終更新: 2026-04-01

---

## 技術スタック

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Supabase (PostgreSQL + Auth + RLS + Storage)
- Resend（メール送信）
- @react-pdf/renderer（PDF生成）
- Vercel デプロイ

---

## 本番環境

| 項目 | 値 |
|------|-----|
| URL | https://rental.l-flat-reserve.com |
| 申込フォーム | https://rental.l-flat-reserve.com/apply |
| メール送信元 | `L-flat PiANOS <noreply@rental.l-flat-reserve.com>` |
| DNS | お名前.com（A レコード `76.76.21.21` + TXT SPF） |
| Resend ドメイン | l-flat-reserve.com（Verified・教室と共有） |

---

## ユーザーロール

| ロール | 権限 |
|--------|------|
| `owner` | 全機能アクセス・スタッフ管理・システム設定 |
| `staff` | データ読み書き（設定・スタッフ管理除く） |
| `viewer` | 閲覧のみ |

認証: Supabase Auth（メール/パスワード）。RLS は `get_staff_role()` で制御。

---

## ページ一覧

### 公開ページ（認証不要）

| パス | 説明 |
|------|------|
| `/apply` | Web申込フォーム（プラン選択・設置場所入力） |
| `/apply/complete` | 申込完了（Thank you ページ） |

### 管理画面（認証必須）

| パス | 説明 |
|------|------|
| `/admin/login` | ログイン |
| `/admin/dashboard` | ダッシュボード（KPI・アクティビティ・新規申込/未送付アラート） |
| `/admin/applications` | Web申込一覧（ステータスタブ・検索） |
| `/admin/applications/[id]` | 申込詳細（審査・承認・契約変換） |
| `/admin/customers` | 顧客一覧（検索） |
| `/admin/customers/new` | 顧客新規登録 |
| `/admin/customers/[id]` | 顧客詳細（削除可能・紐づきチェック付き） |
| `/admin/customers/[id]/edit` | 顧客編集 |
| `/admin/customers/import` | 顧客CSVインポート |
| `/admin/pianos` | ピアノ在庫一覧 |
| `/admin/pianos/new` | ピアノ新規登録 |
| `/admin/pianos/[id]` | ピアノ詳細（削除可能・貸出中/紐づきチェック付き） |
| `/admin/pianos/[id]/edit` | ピアノ編集 |
| `/admin/contracts` | ご家庭/教室用 契約一覧 |
| `/admin/contracts/new` | 契約新規登録（初期費用・運送費・付属品・支払方法含む） |
| `/admin/contracts/[id]` | 契約詳細（契約書PDF・解約処理・契約抹消・初期費用編集・見積書作成） |
| `/admin/contracts/[id]/edit` | 契約編集 |
| `/admin/events` | イベント案件一覧 |
| `/admin/events/new` | イベント案件登録（初期費用・運送費含む） |
| `/admin/events/[id]` | イベント案件詳細（キャンセル処理） |
| `/admin/events/[id]/edit` | イベント案件編集 |
| `/admin/estimates/new` | **見積書独立作成**（顧客+プラン+オプション+初期費用を自由選択） |
| `/admin/invoices` | 帳票一覧（見積書作成ボタン・請求書作成ボタン・一括発行） |
| `/admin/invoices/new` | 請求書手動作成 |
| `/admin/invoices/[id]` | 帳票詳細（見積書/請求書/領収書PDF・メール送信・入金記録・見積→請求書変換・見積→契約作成） |
| `/admin/payments` | 入金管理（KPI・記録一覧・未入金一覧） |
| `/admin/pricing` | 料金設定（プラン・オプション・スポット費用マスタ） |
| `/admin/reports` | 会計レポート（月次推移・CSVエクスポート） |
| `/admin/staff` | **スタッフ管理**（追加・ロール変更・PW変更・有効/無効） |
| `/admin/settings` | システム設定（会社情報・請求設定・メールテンプレート） |

### API ルート

| パス | メソッド | 説明 |
|------|---------|------|
| `/api/invoices/[id]/pdf` | GET | 請求書PDF（`?type=estimate` で見積書、`?type=receipt` で領収書） |
| `/api/contracts/[id]/pdf` | GET | 契約書PDF（`?date=YYYY-MM-DD` で契約日指定可） |
| `/api/contracts/export` | GET | 契約一覧CSVエクスポート（BOM付きUTF-8） |
| `/api/customers/import` | POST | 顧客CSVインポート（列名自動マッピング） |
| `/api/reports/export` | GET | 会計レポートCSVエクスポート |

---

## データベーステーブル

### ENUM 型

| 名前 | 値 |
|------|-----|
| `staff_role` | owner, staff, viewer |
| `service_type` | home_school, event |
| `contract_period` | yearly, half_year, monthly |
| `piano_type` | upright, grand, digital |
| `piano_status` | rented, available, maintenance, disposed |
| `contract_status` | active, suspended, terminated |
| `contract_origin` | manual, web |
| `event_status` | estimate, confirmed, completed, cancelled |
| `invoice_status` | draft, issued, paid, cancelled |
| `payment_method` | bank_transfer, **direct_debit**, cash, card, other |
| `document_type` | estimate, contract, invoice, receipt |
| `spot_fee_section` | initial, monthly |
| `spot_fee_entry_type` | master, custom |
| `customer_status` | active, suspended, terminated |
| `plan_type` | home, school |
| `application_status` | submitted, reviewing, approved, rejected, converted |

### テーブル一覧

| テーブル | 説明 | 主要カラム |
|---------|------|-----------|
| `staff` | 管理者 | auth_user_id, name, email, role, is_active |
| `system_settings` | システム設定（1レコード） | company_name, bank_info, tax_rate, invoice_due_days, email_subject_template, email_body_template |
| `customers` | 顧客 | name, name_kana, company_name, email, phone, postal_code, address, status, memo |
| `pianos` | ピアノ在庫 | maker, model, serial_number, piano_type, is_mute, is_white, status, storage_location |
| `rental_plans` | 料金プラン（6行固定） | plan_type, period, name, monthly_fee, is_active / UNIQUE(plan_type, period) |
| `rental_options` | 月額オプション | name, monthly_fee, description, is_active |
| `spot_fee_types` | スポット費用マスタ | name, unit_price, unit, description, is_active |
| `contracts` | ご家庭/教室用 契約 | customer_id, application_id, piano_id, plan_id, option_ids[], contract_period, status, origin, start_date, end_date, billing_day, **payment_method**, **accessories[]**, **custom_options[]** |
| `event_contracts` | イベント案件 | customer_id, piano_id, piano_type, event_name, venue, delivery_date, pickup_date, status, cancellation_date |
| `contract_spot_fees` | スポット費用明細 | contract_id, contract_type, section(initial/monthly), label, amount(税抜), quantity, is_recurring |
| `invoices` | 請求書/見積書 | invoice_number(INV-/EST-YYYYMM-NNN), contract_id(nullable), event_contract_id, customer_id, billing_month, subtotal, tax_amount, total_amount, status, pdf_url |
| `invoice_items` | 請求書明細 | invoice_id, label, unit_price(税抜), quantity, amount, sort_order |
| `payments` | 入金記録 | invoice_id, customer_id, payment_date, amount(税込), payment_method |
| `documents` | 帳票履歴 | document_type, document_number, pdf_url, sent_at, sent_to |
| `applications` | Web申込 | applicant_name/email/phone/address, plan_type, contract_period, piano_type, option_ids[], installation_*, status, customer_id, contract_id |

---

## ビジネスロジック

### 注文フロー（通常）

1. 注文が入る
2. **見積書発行**（`/admin/estimates/new` または契約詳細から）→ メール or 印刷して手渡し
   - 同じ顧客でオプション違いの複数見積書を作成可能
3. 顧客承諾 → 見積書を「請求書に変換」
4. **契約書 + 初回請求書**（運送料+オプション+初月料金）発行 → メール or 印刷
5. 納品
6. 支払方法により分岐:
   - **(1) 銀行振込**: 翌月以降、月次請求書を発行 → メール or 郵送
   - **(2) 口座振替**: 振替開始までは銀行振込で対応。開始後は自動引落
   - **(3) カード**: 今後 Stripe 連携で対応予定

### 支払方法

| 値 | ラベル | 領収書代替文言（契約書PDF） |
|-----|-------|------------------------|
| `bank_transfer` | 銀行振込 | 振込証明書（受領書）をもって領収書に代えさせていただきます。 |
| `direct_debit` | 口座振替 | 記帳された預金通帳（引き落としの記録）をもって領収書に代えさせていただきます。 |
| `cash` | 現金 | （なし） |
| `card` | クレジットカード | カード会社の明細書をもって領収書に代えさせていただきます。 |
| `other` | その他 | （なし） |

### 契約期間と中途解約料

| 契約期間 | 最低期間 | 中途解約料 |
|---------|---------|-----------|
| 単月契約 | なし | なし |
| 半年契約 | 6ヶ月 | 残月数 × 月額合計（税込） |
| 1年契約 | 12ヶ月 | 残月数 × 月額合計（税込） |

### 支払期限と請求書発行日

- **支払期限** = レンタル開始日の日 - 1（毎月固定。例: 開始日28日 → 毎月27日）
- **請求書発行日** = 支払期限 - `invoice_due_days`（システム設定で変更可能、デフォルト14日）

### 運送費

| 種別 | デフォルト金額（税込） |
|------|-------------------|
| 片道 | ¥48,400 |
| 往復（目安） | ¥96,800 |

- 契約登録時に「往復 / 搬入のみ」を選択。金額は都度入力
- 搬入のみの場合、搬出参考金額を記録（`contract_spot_fees` に `quantity=0, memo='pickup_pending'`）
- 解約時に搬出費用の請求状況を表示し、未請求なら搬出請求書を同時作成可能

### 契約の付属品

契約登録時にチェックボックスで選択 + カスタム追加可能:
- ピアノ椅子（デフォルトON）
- インシュレーター（デフォルトON）
- 敷板
- ヘッドホン
- その他（自由入力で追加）

契約書PDFの「付属品」欄に反映。

### カスタム月額オプション

マスタに登録されたオプション以外にも、契約ごとに名前+月額を自由入力で追加可能。
契約書PDF・見積書PDF の月額費用テーブルに表示。

### 契約抹消（完全削除）

契約詳細の「契約を抹消」ボタンから実行。2つのモード:
- **完全抹消**: 契約 + 関連する請求書・入金記録・スポット費用を全て削除
- **一部保持**: 請求書・入金記録・スポット費用を個別に残すか選択可能

### 請求書番号体系

| 帳票 | プレフィックス | 例 | 備考 |
|------|-------------|-----|------|
| 見積書 | EST | EST-202604-001 | 独立作成可能（`contract_id = NULL`） |
| 請求書 | INV | INV-202604-001 | 月次 or 初回 |
| 契約書 | CNT | CNT-202604-XXXX | 契約PDFから生成 |
| 領収書 | RCP | — | 請求書データから `?type=receipt` で生成 |

### 見積書フロー

1. **独立作成**（`/admin/estimates/new`）: 顧客+プラン+オプション+初期費用を自由選択 → EST番号で作成
2. **契約ベース作成**（契約詳細から）: 合算/初期費用のみ/初月分のみの3択
3. **見積→請求書に変換**: EST番号 → INV番号に変更
4. **見積→契約を作成**: 見積書詳細から `/admin/contracts/new` にリンク

### 申込→契約変換フロー

1. Web申込フォーム送信 → `applications` テーブルに `submitted` で保存
2. 管理者が審査 → `reviewing` → `approved`
3. 「契約に変換」→ ピアノ割当・開始日・運送費入力
4. 顧客自動作成（既存メール一致時は紐付け）
5. 契約作成（`origin: 'web'`）
6. 申込ステータス → `converted`

### イベントキャンセルポリシー

| 搬入日までの日数 | キャンセル料率 |
|----------------|-------------|
| 8日以上前 | 無料 |
| 7〜3日前 | 50% |
| 2日前以内 | 100% |

---

## PDF テンプレート

### 請求書/見積書/領収書（InvoicePDF.tsx）

- `documentType: 'invoice' | 'estimate' | 'receipt'` で切り替え
- ネイビー（#1e3a5f）ヘッダー帯 + ロゴ
- 2カラム（宛先 / 発行者）
- 明細テーブル + 合計ボックス
- 備考・振込先（請求書のみ）
- 領収書代替文言（請求書のみ・銀行振込前提）

### 契約書（ContractPDF.tsx）

- テンプレート `【契約書】テンプレート_L-flat.pdf` 準拠
- ヘッダー帯 + 「ピアノレンタル契約書 / LEASING PIANO AGREEMENT」
- 契約番号バー（CNT-YYYYMM-XXXX / 契約日指定可能）
- 借主・貸主 2カラム（印欄付き）
- レンタル商品・設置情報（付属品・プラン種別・契約形態チェックボックス）
- 料金明細（初期費用 + 搬出参考金額 + 月額費用 + カスタムオプション）
- お支払い情報（選択した支払方法のみ表示・支払期限はレンタル開始日-1）
- 契約条件（6項目 + 支払方法別の領収書代替文言）
- ページまたぎ防止（`wrap={false}`）

### 共通

- フォント: NotoSansJP（Regular/Bold）— `/public/fonts/`
- ロゴ: `/public/images/logo.png`（存在時のみ）
- ランタイム: Node.js（Edge 非対応）

---

## メール送信

- プロバイダ: Resend
- 送信元: `L-flat PiANOS <noreply@rental.l-flat-reserve.com>`
- HTML テンプレート（ネイビーヘッダー・請求書テーブル・PDFリンク・カスタムメッセージ）
- 送信成功時に `draft → issued` 自動昇格
- 件名・本文テンプレートはシステム設定で管理可能

---

## Supabase Storage

- バケット: `invoice-pdfs`（public）
- 請求書PDF生成時に自動アップロード（`upsert: true`）
- URL を `invoices.pdf_url` に保存
- 失敗時も PDF 返却は継続（非致命的）

---

## 環境変数

| 変数名 | 説明 |
|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクト URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon キー |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase サービスロールキー |
| `RESEND_API_KEY` | Resend API キー |
| `NEXT_PUBLIC_APP_URL` | アプリURL（メール内リンク用） |

---

## ファイル構成（主要）

```
src/
├── actions/
│   ├── application-actions.ts  # Web申込 CRUD + 契約変換
│   ├── auth-actions.ts         # ログイン/ログアウト
│   ├── contract-actions.ts     # 契約 CRUD + 中途解約料 + スポット費用CRUD + 契約抹消
│   ├── customer-actions.ts     # 顧客 CRUD + 削除
│   ├── email-actions.ts        # メール送信
│   ├── event-actions.ts        # イベント案件 CRUD + キャンセル料計算
│   ├── invoice-actions.ts      # 請求書 CRUD + 一括発行 + 見積書作成（独立/契約ベース） + 見積→請求変換
│   ├── payment-actions.ts      # 入金記録 CRUD
│   ├── piano-actions.ts        # ピアノ CRUD + 削除
│   ├── pricing-actions.ts      # 料金マスタ管理
│   ├── report-actions.ts       # 会計レポート
│   ├── settings-actions.ts     # システム設定
│   └── staff-actions.ts        # スタッフ管理
├── app/
│   ├── apply/                  # 公開申込フォーム（認証不要）
│   ├── admin/
│   │   ├── estimates/new/      # 見積書独立作成
│   │   ├── staff/              # スタッフ管理
│   │   └── ...                 # その他管理画面
│   └── api/                    # API ルート（PDF・CSV等）
├── components/
│   ├── applications/           # 申込関連 UI
│   ├── contracts/              # 契約関連 UI + ContractPDF + TerminateButton + DeleteContractButton + ContractPDFButton + CreateEstimateButton + EditInitialFees
│   ├── customers/              # 顧客関連 UI
│   ├── estimates/              # EstimateForm（独立見積書作成）
│   ├── events/                 # イベント関連 UI
│   ├── invoices/               # 請求書関連 UI + InvoicePDF + ConvertEstimateButton
│   ├── layout/                 # Sidebar
│   ├── payments/               # 入金関連 UI
│   ├── pianos/                 # ピアノ関連 UI
│   ├── pricing/                # 料金マスタ UI
│   ├── settings/               # 設定 UI
│   ├── staff/                  # スタッフ管理 UI
│   └── shared/                 # InitialFeeSection（契約・イベント・見積書共用）+ DeleteButton
├── lib/
│   ├── constants.ts            # 定数・ラベル・ナビ
│   ├── constants-applications.ts
│   ├── resend.ts               # Resend クライアント
│   ├── supabase/               # Supabase クライアント（server/admin）
│   └── utils.ts                # フォーマット関数
├── middleware.ts                # 認証ミドルウェア
└── types/index.ts              # 全型定義
```

---

## 未実装・TODO

| 項目 | 状態 |
|------|------|
| 口座振替管理リスト（振替開始日・差し戻し履歴・ステータス） | 未実装（専用テーブルで管理予定） |
| 請求書バッチ自動生成（月次） | スキップ（Vercel Cron or 手動トリガー想定） |
| Stripe 連携 | スキップ（後日実装） |
| ContractForm の from_estimate プリフィル対応 | 未実装（見積書→契約作成時の自動入力） |
