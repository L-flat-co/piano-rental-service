import Link from 'next/link'
import { getDirectDebits } from '@/actions/direct-debit-actions'
import { getCustomers } from '@/actions/customer-actions'
import { DIRECT_DEBIT_STATUS_LABELS, DIRECT_DEBIT_STATUS_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { DirectDebitStatus, ServiceType } from '@/types'
import { AddDirectDebitForm } from '@/components/shared/AddDirectDebitForm'

export default async function DirectDebitsPage({
  searchParams,
}: {
  searchParams: { status?: string; type?: string }
}) {
  const statusFilter = searchParams.status as DirectDebitStatus | undefined
  const typeFilter = searchParams.type as ServiceType | undefined

  const [allDebits, customers] = await Promise.all([
    getDirectDebits(typeFilter),
    getCustomers(),
  ])
  let debits = allDebits

  if (statusFilter) {
    debits = debits.filter((d) => d.status === statusFilter)
  }

  const statusCounts = {
    pending: debits.filter((d) => d.status === 'pending').length,
    active: debits.filter((d) => d.status === 'active').length,
    rejected: debits.filter((d) => d.status === 'rejected').length,
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">口座振替管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            {debits.length}件 / 申請中 {statusCounts.pending}件 / 実行中 {statusCounts.active}件
            {statusCounts.rejected > 0 && <span className="text-red-600 font-medium"> / 差し戻し {statusCounts.rejected}件</span>}
          </p>
        </div>
        <AddDirectDebitForm customers={customers} />
      </div>

      {/* ステータスフィルタ */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {([undefined, 'pending', 'active', 'rejected', 'cancelled'] as (DirectDebitStatus | undefined)[]).map((s) => {
          const label = s ? DIRECT_DEBIT_STATUS_LABELS[s] : 'すべて'
          const href = s ? `/admin/direct-debits?status=${s}` : '/admin/direct-debits'
          return (
            <Link key={s ?? 'all'} href={href}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                statusFilter === s ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}>
              {label}
            </Link>
          )
        })}
        <span className="text-gray-300 mx-1">|</span>
        {([undefined, 'home_school', 'event'] as (ServiceType | undefined)[]).map((t) => {
          const label = t === 'home_school' ? 'ピアノ' : t === 'event' ? 'イベント' : '全タイプ'
          const href = t ? `/admin/direct-debits?type=${t}` : '/admin/direct-debits'
          return (
            <Link key={t ?? 'all'} href={href}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                typeFilter === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}>
              {label}
            </Link>
          )
        })}
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {debits.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">口座振替データがありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-5 py-3 font-medium text-gray-600">顧客</th>
                <th className="px-4 py-3 font-medium text-gray-600">種別</th>
                <th className="px-4 py-3 font-medium text-gray-600">引落先銀行</th>
                <th className="px-4 py-3 font-medium text-gray-600">初回引落日</th>
                <th className="px-4 py-3 font-medium text-gray-600">最終引落日</th>
                <th className="px-4 py-3 font-medium text-gray-600">引落回数</th>
                <th className="px-4 py-3 font-medium text-gray-600">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {debits.map((d) => {
                const customer = (Array.isArray(d.customer) ? d.customer[0] : d.customer) as { id: string; name: string } | null
                return (
                  <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {d.contract_type === 'home_school' ? 'ピアノ' : 'イベント'}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{d.bank_name || '—'}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.initial_debit_date ? formatDate(d.initial_debit_date) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {d.last_debit_date ? formatDate(d.last_debit_date) : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{d.debit_count || '—'}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${DIRECT_DEBIT_STATUS_COLORS[d.status]}`}>
                        {DIRECT_DEBIT_STATUS_LABELS[d.status]}
                      </span>
                      {d.status === 'rejected' && d.rejection_memo && (
                        <p className="text-xs text-red-500 mt-0.5">{d.rejection_memo}</p>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
