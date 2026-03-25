// ============================================================
// 列挙型
// ============================================================

export type StaffRole = 'owner' | 'staff' | 'viewer'
export type ServiceType = 'home_school' | 'event'
export type ContractPeriod = 'yearly' | 'half_year' | 'monthly'
export type PianoType = 'upright' | 'grand' | 'digital'
export type PianoStatus = 'rented' | 'available' | 'maintenance' | 'disposed'
export type ContractStatus = 'active' | 'suspended' | 'terminated'
export type ContractOrigin = 'manual' | 'web'
export type EventStatus = 'estimate' | 'confirmed' | 'completed' | 'cancelled'
export type InvoiceStatus = 'draft' | 'issued' | 'paid' | 'cancelled'
export type PaymentMethod = 'bank_transfer' | 'cash' | 'card' | 'other'
export type DocumentType = 'estimate' | 'contract' | 'invoice' | 'receipt'
export type SpotFeeSection = 'initial' | 'monthly'
export type SpotFeeType = 'master' | 'custom'
export type CustomerStatus = 'active' | 'suspended' | 'terminated'
export type ApplicationStatus = 'submitted' | 'reviewing' | 'approved' | 'rejected' | 'converted'

// ============================================================
// スタッフ
// ============================================================

export interface Staff {
  id: string
  auth_user_id: string
  name: string
  email: string
  role: StaffRole
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// 顧客
// ============================================================

export interface Customer {
  id: string
  name: string
  name_kana: string | null
  company_name: string | null
  email: string | null
  phone: string | null
  postal_code: string | null
  address: string | null
  status: CustomerStatus
  memo: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// ピアノ
// ============================================================

export interface Piano {
  id: string
  maker: string
  model: string
  serial_number: string | null
  piano_type: PianoType
  is_mute: boolean           // 消音機能付き
  is_white: boolean          // ホワイトモデル
  status: PianoStatus
  storage_location: string | null
  purchase_date: string | null
  memo: string | null
  created_at: string
  updated_at: string
}

// ============================================================
// 料金プランマスタ
// ============================================================

export interface RentalPlan {
  id: string
  plan_type: 'home' | 'school'  // ご家庭用 / 教室用
  period: ContractPeriod
  name: string
  monthly_fee: number           // 月額（税込）
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// 月額オプションマスタ
// ============================================================

export interface RentalOption {
  id: string
  name: string
  monthly_fee: number           // 月額（税込）
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// スポット費用マスタ
// ============================================================

export interface SpotFeeTypeMaster {
  id: string
  name: string
  unit_price: number            // 単価（税込）
  unit: string | null           // 例: "回", "時間"
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================
// ご家庭/教室用 契約
// ============================================================

export interface Contract {
  id: string
  service_type: 'home_school'
  customer_id: string
  application_id: string | null // 将来: applicationsテーブル
  piano_id: string
  plan_id: string
  contract_period: ContractPeriod
  option_ids: string[]          // 選択中の月額オプションID配列
  status: ContractStatus
  origin: ContractOrigin
  start_date: string
  end_date: string | null
  billing_day: number           // 1〜28
  memo: string | null
  created_at: string
  updated_at: string

  // JOIN
  customer?: Customer
  piano?: Piano
  plan?: RentalPlan
  options?: RentalOption[]
}

// ============================================================
// イベント用 案件
// ============================================================

export interface EventContract {
  id: string
  customer_id: string
  piano_id: string | null
  piano_type: PianoType
  event_name: string
  venue: string | null
  delivery_date: string | null
  pickup_date: string | null
  status: EventStatus
  cancellation_date: string | null
  memo: string | null
  created_at: string
  updated_at: string

  // JOIN
  customer?: Customer
  piano?: Piano
}

// ============================================================
// スポット費用明細
// ============================================================

export interface ContractSpotFee {
  id: string
  contract_id: string
  contract_type: ServiceType
  fee_type_id: string | null
  fee_type: SpotFeeType
  section: SpotFeeSection
  label: string
  amount: number                // 金額（税抜）
  quantity: number
  is_recurring: boolean
  occurred_at: string | null
  memo: string | null
  created_at: string

  // JOIN
  fee_type_master?: SpotFeeTypeMaster
}

// ============================================================
// 請求書
// ============================================================

export interface Invoice {
  id: string
  invoice_number: string        // 例: INV-202501-001
  contract_id: string | null
  event_contract_id: string | null
  customer_id: string
  billing_month: string | null  // 例: "2025-01"（ご家庭用）
  issue_date: string
  due_date: string | null
  subtotal: number              // 小計（税抜）
  tax_amount: number            // 消費税額
  total_amount: number          // 合計（税込）
  status: InvoiceStatus
  notes: string | null
  pdf_url: string | null        // Supabase Storage の公開 URL
  created_at: string
  updated_at: string

  // JOIN
  customer?: Customer
  items?: InvoiceItem[]
}

// ============================================================
// 請求書明細
// ============================================================

export interface InvoiceItem {
  id: string
  invoice_id: string
  label: string
  description: string | null
  unit_price: number            // 単価（税抜）
  quantity: number
  amount: number                // 金額（税抜）= unit_price × quantity
  sort_order: number
  created_at: string
}

// ============================================================
// 入金記録
// ============================================================

export interface Payment {
  id: string
  invoice_id: string
  customer_id: string
  payment_date: string
  amount: number                // 入金額（税込）
  payment_method: PaymentMethod
  notes: string | null
  created_at: string

  // JOIN
  invoice?: Invoice
  customer?: Customer
}

// ============================================================
// 帳票履歴
// ============================================================

export interface Document {
  id: string
  document_type: DocumentType
  document_number: string
  contract_id: string | null
  event_contract_id: string | null
  customer_id: string
  pdf_url: string | null
  sent_at: string | null
  sent_to: string | null
  created_at: string

  // JOIN
  customer?: Customer
}

// ============================================================
// システム設定
// ============================================================

export interface SystemSettings {
  id: string
  company_name: string
  postal_code: string | null
  address: string | null
  phone: string | null
  email: string | null
  website: string | null
  bank_info: string | null      // 振込先情報（自由テキスト）
  tax_rate: number              // 消費税率（例: 0.10）
  invoice_due_days: number      // 支払い期限（日数）
  logo_url: string | null
  email_subject_template: string | null  // メール件名テンプレート
  email_body_template: string | null     // メール本文テンプレート（追加メッセージ部分）
  created_at: string
  updated_at: string
}

// ============================================================
// Web申込
// ============================================================

export interface Application {
  id: string
  applicant_name: string
  applicant_kana: string | null
  applicant_email: string
  applicant_phone: string | null
  applicant_postal_code: string | null
  applicant_address: string | null
  company_name: string | null
  plan_type: 'home' | 'school'
  contract_period: ContractPeriod
  piano_type: PianoType
  preferred_start_date: string | null
  option_ids: string[]
  installation_address: string | null
  installation_floor: string | null
  installation_elevator: boolean
  status: ApplicationStatus
  admin_memo: string | null
  customer_id: string | null
  contract_id: string | null
  created_at: string
  updated_at: string

  // JOIN
  customer?: Customer
  contract?: Contract
}

// ============================================================
// Server Action 共通戻り値
// ============================================================

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
