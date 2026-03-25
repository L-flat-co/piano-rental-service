import Link from 'next/link'
import { getPayments, getUnpaidInvoices } from '@/actions/payment-actions'
import { INVOICE_STATUS_COLORS, INVOICE_STATUS_LABELS } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'

const PAYMENT_METHOD_LABELS = {
  bank_transfer: '銀行振込',
  cash: '現金',
  card: 'カード',
  other: 'その他',
} as const

export default async function PaymentsPage() {
  const [payments, unpaidInvoices] = await Promise.all([
    getPayments(),
    getUnpaidInvoices(),
  ])

  const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalUnpaid = unpaidInvoices.reduce(
    (sum: number, inv: { total_amount: number }) => sum + inv.total_amount,
    0
  )

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">入金管理</h1>
        <p className="text-sm text-gray-500 mt-1">
          入金記録 {payments.length}件 / 未入金 {unpaidInvoices.length}件
        </p>
      </div>

      {/* サマリー KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">入金記録総額</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(totalPaid)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">未入金合計</p>
          <p className="text-xl font-bold text-amber-600">{formatCurrency(totalUnpaid)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">未入金件数</p>
          <p className="text-xl font-bold text-amber-600">{unpaidInvoices.length}件</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">入金済み件数</p>
          <p className="text-xl font-bold text-green-600">{payments.length}件</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* 入金記録一覧 */}
        <div className="lg:col-span-3">
          <h2 className="text-base font-semibold text-gray-900 mb-3">入金記録</h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {payments.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">
                入金記録がありません
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-4 py-3 text-left font-medium text-gray-600">入金日</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">顧客</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">請求書</th>
                    <th className="px-4 py-3 text-right font-medium text-gray-600">入金額</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-600">方法</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => {
                    const invoice = Array.isArray(p.invoice) ? p.invoice[0] : p.invoice
                    const customer = Array.isArray(p.customer) ? p.customer[0] : p.customer
                    return (
                      <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-900">{formatDate(p.payment_date)}</td>
                        <td className="px-4 py-3 text-gray-700">{customer?.name || '—'}</td>
                        <td className="px-4 py-3">
                          {invoice ? (
                            <Link
                              href={`/admin/invoices/${invoice.id}`}
                              className="text-blue-600 hover:underline text-xs font-mono"
                            >
                              {invoice.invoice_number}
                            </Link>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(p.amount)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {PAYMENT_METHOD_LABELS[p.payment_method] || p.payment_method}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* 未入金請求書 */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-3">
            未入金請求書
            {unpaidInvoices.length > 0 && (
              <span className="ml-2 text-xs font-medium text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                {unpaidInvoices.length}
              </span>
            )}
          </h2>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {unpaidInvoices.length === 0 ? (
              <div className="px-6 py-12 text-center text-gray-400 text-sm">
                未入金の請求書はありません
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {(unpaidInvoices as Array<{
                  id: string
                  invoice_number: string
                  total_amount: number
                  due_date: string | null
                  status: string
                  customer: { id: string; name: string } | null
                }>).map((inv) => {
                  const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer
                  const isOverdue = inv.due_date && new Date(inv.due_date) < new Date()
                  return (
                    <div key={inv.id} className="px-4 py-3 hover:bg-gray-50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <Link
                            href={`/admin/invoices/${inv.id}`}
                            className="text-blue-600 hover:underline text-xs font-mono"
                          >
                            {inv.invoice_number}
                          </Link>
                          <p className="text-sm text-gray-900 truncate">{customer?.name}</p>
                          {inv.due_date && (
                            <p className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : 'text-gray-400'}`}>
                              期限: {formatDate(inv.due_date)}
                              {isOverdue && ' ⚠️ 超過'}
                            </p>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(inv.total_amount)}
                          </p>
                          <span className={`text-xs ${INVOICE_STATUS_COLORS[inv.status as keyof typeof INVOICE_STATUS_COLORS]} px-1.5 py-0.5 rounded-full`}>
                            {INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS]}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
