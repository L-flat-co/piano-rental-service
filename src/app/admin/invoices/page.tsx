import Link from 'next/link'
import { getInvoices } from '@/actions/invoice-actions'
import { getSettings } from '@/actions/settings-actions'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'
import { formatDate, formatCurrency, formatYearMonth } from '@/lib/utils'
import { InvoiceStatus } from '@/types'
import { BulkGenerateButton } from '@/components/invoices/BulkGenerateButton'

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const query = searchParams.q || ''
  const statusFilter = searchParams.status as InvoiceStatus | undefined
  const [allInvoices, settings] = await Promise.all([getInvoices(query), getSettings()])
  let invoices = allInvoices

  if (statusFilter) {
    invoices = invoices.filter((inv) => inv.status === statusFilter)
  }

  const totalAmount = invoices
    .filter((inv) => inv.status !== 'cancelled')
    .reduce((sum, inv) => sum + inv.total_amount, 0)

  const unpaidCount = invoices.filter((inv) => inv.status === 'issued').length

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">帳票発行</h1>
          <p className="text-sm text-gray-500 mt-1">
            {invoices.length}件 / 未入金 {unpaidCount}件 / 合計{' '}
            {formatCurrency(totalAmount)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BulkGenerateButton invoiceDueDays={settings?.invoice_due_days ?? 30} />
          <Link
            href="/admin/invoices/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            + 請求書を作成
          </Link>
        </div>
      </div>

      {/* 検索・フィルタ */}
      <form className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="請求書番号・顧客名・年月で検索..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-72"
        />
        <select
          name="status"
          defaultValue={statusFilter || ''}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">すべてのステータス</option>
          <option value="draft">下書き</option>
          <option value="issued">発行済み</option>
          <option value="paid">入金確認済み</option>
          <option value="cancelled">キャンセル</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md"
        >
          絞り込む
        </button>
      </form>

      {/* テーブル */}
      {invoices.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {query ? `"${query}" の検索結果はありません` : '請求書が登録されていません'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">請求書番号</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">顧客</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">対象月</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">発行日</th>
                <th className="text-right px-4 py-3 font-medium text-gray-600">金額（税込）</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((invoice) => (
                <tr key={invoice.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/invoices/${invoice.id}`}
                      className="font-mono text-blue-600 hover:underline text-xs"
                    >
                      {invoice.invoice_number}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {invoice.customer?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {invoice.billing_month ? formatYearMonth(invoice.billing_month) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(invoice.issue_date)}</td>
                  <td className="px-4 py-3 text-right font-medium text-gray-900">
                    {formatCurrency(invoice.total_amount)}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${INVOICE_STATUS_COLORS[invoice.status]}`}
                    >
                      {INVOICE_STATUS_LABELS[invoice.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={`/api/invoices/${invoice.id}/pdf`}
                      target="_blank"
                      className="text-xs text-gray-500 hover:text-blue-600 underline"
                    >
                      PDF
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
