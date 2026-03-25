// ============================================================
// 申込ステータス
// ============================================================

export const APPLICATION_STATUS_LABELS = {
  submitted: '新規申込',
  reviewing: '審査中',
  approved: '承認済み',
  rejected: '却下',
  converted: '契約済み',
} as const

export const APPLICATION_STATUS_COLORS = {
  submitted: 'bg-blue-100 text-blue-800',
  reviewing: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  converted: 'bg-gray-100 text-gray-600',
} as const
