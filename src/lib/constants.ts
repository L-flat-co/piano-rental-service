// ============================================================
// サービス種別
// ============================================================

export const SERVICE_TYPE_LABELS = {
  home_school: 'ご家庭/教室用',
  event: 'イベント用',
} as const

// ============================================================
// 契約期間
// ============================================================

export const CONTRACT_PERIOD_LABELS = {
  yearly: '1年契約',
  half_year: '半年契約',
  monthly: '単月契約',
} as const

// ============================================================
// ピアノ種別
// ============================================================

export const PIANO_TYPE_LABELS = {
  upright: 'アップライト',
  grand: 'グランド',
  digital: 'デジタル',
} as const

export const PIANO_STATUS_LABELS = {
  rented: '貸出中',
  available: '在庫あり',
  maintenance: 'メンテナンス中',
  disposed: '廃棄',
} as const

export const PIANO_STATUS_COLORS = {
  rented: 'bg-blue-100 text-blue-800',
  available: 'bg-green-100 text-green-800',
  maintenance: 'bg-yellow-100 text-yellow-800',
  disposed: 'bg-gray-100 text-gray-600',
} as const

// ============================================================
// 契約ステータス
// ============================================================

export const CONTRACT_STATUS_LABELS = {
  active: '契約中',
  suspended: '一時停止',
  terminated: '解約済み',
} as const

export const CONTRACT_STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-gray-100 text-gray-600',
} as const

// ============================================================
// イベント案件ステータス
// ============================================================

export const EVENT_STATUS_LABELS = {
  estimate: '見積中',
  confirmed: '確定',
  completed: '完了',
  cancelled: 'キャンセル',
} as const

export const EVENT_STATUS_COLORS = {
  estimate: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-gray-100 text-gray-600',
} as const

// ============================================================
// 請求書ステータス
// ============================================================

export const INVOICE_STATUS_LABELS = {
  draft: '下書き',
  issued: '発行済み',
  paid: '入金確認済み',
  cancelled: 'キャンセル',
} as const

export const INVOICE_STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-600',
  issued: 'bg-blue-100 text-blue-800',
  paid: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
} as const

// ============================================================
// スタッフロール
// ============================================================

export const STAFF_ROLE_LABELS = {
  owner: 'オーナー',
  staff: 'スタッフ',
  viewer: '閲覧のみ',
} as const

// ============================================================
// 顧客ステータス
// ============================================================

export const CUSTOMER_STATUS_LABELS = {
  active: '有効',
  suspended: '休止',
  terminated: '解約済み',
} as const

// ============================================================
// 帳票番号プレフィックス
// ============================================================

export const DOCUMENT_PREFIX = {
  estimate: 'EST',
  contract: 'CNT',
  invoice: 'INV',
  receipt: 'RCP',
} as const

// ============================================================
// 消費税率
// ============================================================

export const DEFAULT_TAX_RATE = 0.1

// ============================================================
// 管理画面ナビゲーション
// ============================================================

export const ADMIN_NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'ダッシュボード', icon: 'dashboard' },
  { href: '/admin/customers', label: '顧客管理', icon: 'customers' },
  { href: '/admin/pianos', label: 'ピアノ管理', icon: 'pianos' },
  { href: '/admin/contracts', label: 'ご家庭/教室用 契約', icon: 'contracts' },
  { href: '/admin/events', label: 'イベント案件', icon: 'events' },
  { href: '/admin/invoices', label: '帳票発行', icon: 'invoices' },
  { href: '/admin/payments', label: '入金管理', icon: 'payments' },
  { href: '/admin/reports', label: '会計レポート', icon: 'reports' },
  { href: '/admin/settings', label: 'システム設定', icon: 'settings' },
] as const

// ============================================================
// キャンセルポリシー（イベント用）
// ============================================================

export const EVENT_CANCEL_POLICY = {
  FREE_DAYS: 8,       // 8日前まで無料
  HALF_DAYS: 7,       // 7日前〜 50%
  FULL_DAYS: 3,       // 3日前〜 100%
} as const

// ============================================================
// 運送費デフォルト値
// ============================================================

export const TRANSPORT_FEE_DEFAULTS = {
  ROUND_TRIP: 48400,  // 往復基本（税込）
  ONE_WAY: 19250,     // 片道（税込）
} as const
