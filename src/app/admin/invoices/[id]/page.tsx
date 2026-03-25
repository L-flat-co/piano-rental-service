import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getInvoice } from '@/actions/invoice-actions'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'
import { formatDate, formatCurrency, formatYearMonth } from '@/lib/utils'
import { InvoiceStatusButtons } from '@/components/invoices/InvoiceStatusButtons'
import { AddInvoiceItemForm } from '@/components/invoices/AddInvoiceItemForm'
import { SendEmailButton } from '@/components/invoices/SendEmailButton'
import { RecordPaymentButton } from '@/components/payments/RecordPaymentButton'
import { getSettings } from '@/actions/settings-actions'

export default async function InvoiceDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [invoice, settings] = await Promise.all([
    getInvoice(params.id),
    getSettings(),
  ])

  if (!invoice) {
    notFound()
  }

  const isDraft = invoice.status === 'draft'

  return (
    <div className="p-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900 font-mono">
              {invoice.invoice_number}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${INVOICE_STATUS_COLORS[invoice.status]}`}
            >
              {INVOICE_STATUS_LABELS[invoice.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {invoice.customer?.name}
            {invoice.billing_month ? ` / ${formatYearMonth(invoice.billing_month)}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {invoice.pdf_url && (
            <a
              href={invoice.pdf_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-white border border-emerald-300 hover:bg-emerald-50 text-emerald-700 text-sm font-medium px-3 py-2 rounded-md"
              title="Supabase Storage に保存済みのPDF"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
              </svg>
              保存済みPDF
            </a>
          )}
          <a
            href={`/api/invoices/${invoice.id}/pdf?type=estimate`}
            target="_blank"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md"
          >
            見積書PDF
          </a>
          <a
            href={`/api/invoices/${invoice.id}/pdf`}
            target="_blank"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md"
          >
            請求書PDF
          </a>
          {invoice.status === 'paid' && (
            <a
              href={`/api/invoices/${invoice.id}/pdf?type=receipt`}
              target="_blank"
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md"
            >
              領収書PDF
            </a>
          )}
          <Link
            href="/admin/invoices"
            className="text-gray-500 hover:text-gray-700 text-sm px-3 py-2"
          >
            ← 一覧に戻る
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 請求情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">請求情報</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  発行日
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(invoice.issue_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  支払い期限
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {invoice.due_date ? formatDate(invoice.due_date) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  対象月
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {invoice.billing_month ? formatYearMonth(invoice.billing_month) : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* 明細 */}
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900">明細</h2>
              {isDraft && (
                <span className="text-xs text-gray-400">
                  行にカーソルを合わせると削除ボタンが表示されます
                </span>
              )}
            </div>

            {isDraft ? (
              /* draft: 削除ボタン付き + カスタム品目追加フォーム */
              <>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <th className="text-left px-6 py-3 font-medium text-gray-600">品目</th>
                      <th className="text-right px-4 py-3 font-medium text-gray-600 w-32">単価（税抜）</th>
                      <th className="text-center px-4 py-3 font-medium text-gray-600 w-16">数量</th>
                      <th className="text-right px-6 py-3 font-medium text-gray-600 w-28">金額（税抜）</th>
                      <th className="w-8"></th>
                    </tr>
                  </thead>
                </table>
                <AddInvoiceItemForm invoiceId={invoice.id} items={invoice.items || []} />
              </>
            ) : (
              /* 発行済み以降: 通常表示 */
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-6 py-3 font-medium text-gray-600">品目</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">単価（税抜）</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">数量</th>
                    <th className="text-right px-6 py-3 font-medium text-gray-600">金額（税抜）</th>
                  </tr>
                </thead>
                <tbody>
                  {(invoice.items || []).map((item) => (
                    <tr key={item.id} className="border-b border-gray-100">
                      <td className="px-6 py-3 text-gray-900">{item.label}</td>
                      <td className="px-4 py-3 text-right text-gray-600">
                        {formatCurrency(item.unit_price)}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-600">{item.quantity}</td>
                      <td className="px-6 py-3 text-right text-gray-900">
                        {formatCurrency(item.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {/* 合計 */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">小計（税抜）</span>
                <span className="text-gray-900">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">消費税（10%）</span>
                <span className="text-gray-900">{formatCurrency(invoice.tax_amount)}</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200">
                <span className="text-gray-900">合計（税込）</span>
                <span className="text-gray-900">{formatCurrency(invoice.total_amount)}</span>
              </div>
            </div>
          </div>

          {/* 備考 */}
          {invoice.notes && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">備考</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* サイドバー */}
        <div className="space-y-4">
          {/* ステータス操作 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">ステータス変更</h3>
            <InvoiceStatusButtons invoiceId={invoice.id} currentStatus={invoice.status} />
          </div>

          {/* 入金記録 */}
          {invoice.status === 'issued' && invoice.customer_id && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">入金を記録</h3>
              <RecordPaymentButton
                invoiceId={invoice.id}
                customerId={invoice.customer_id}
                totalAmount={invoice.total_amount}
              />
            </div>
          )}

          {/* メール送信 */}
          {invoice.status !== 'cancelled' && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">メール送信</h3>
              <SendEmailButton
                invoiceId={invoice.id}
                defaultTo={invoice.customer?.email ?? undefined}
                defaultSubject={settings?.email_subject_template ?? undefined}
                defaultMessage={settings?.email_body_template ?? undefined}
              />
              {!invoice.customer?.email && (
                <p className="text-xs text-gray-400 mt-2">
                  顧客にメールアドレスが未登録です
                </p>
              )}
            </div>
          )}

          {/* 顧客情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">顧客</h3>
            {invoice.customer ? (
              <div className="space-y-1">
                <Link
                  href={`/admin/customers/${invoice.customer.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {invoice.customer.name}
                </Link>
                {invoice.customer.email && (
                  <p className="text-xs text-gray-500">{invoice.customer.email}</p>
                )}
                {invoice.customer.phone && (
                  <p className="text-xs text-gray-500">{invoice.customer.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
