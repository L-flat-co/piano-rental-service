import Link from 'next/link'
import { getStringContracts } from '@/actions/string-contract-actions'
import { STRING_TYPE_LABELS, STRING_RENTAL_TYPE_LABELS, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ContractStatus, StringRentalType } from '@/types'

export default async function StringContractsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; type?: string }
}) {
  const query = searchParams.q || ''
  const statusFilter = searchParams.status as ContractStatus | undefined
  const rentalTypeFilter = searchParams.type as StringRentalType | undefined

  let contracts = await getStringContracts(query)

  if (statusFilter) contracts = contracts.filter((c) => c.status === statusFilter)
  if (rentalTypeFilter) contracts = contracts.filter((c) => c.rental_type === rentalTypeFilter)

  const activeCount = contracts.filter((c) => c.status === 'active').length

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">弦楽器契約</h1>
          <p className="text-sm text-gray-500 mt-1">
            {contracts.length}件 / レンタル中 {activeCount}件
          </p>
        </div>
        <Link href="/admin/string-contracts/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">
          + 契約を登録
        </Link>
      </div>

      {/* フィルター */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {([undefined, 'active', 'terminated'] as (ContractStatus | undefined)[]).map((s) => {
          const label = s ? CONTRACT_STATUS_LABELS[s] : 'すべて'
          const href = `/admin/string-contracts${s ? `?status=${s}` : ''}`
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
        {([undefined, 'subscription', 'spot'] as (StringRentalType | undefined)[]).map((t) => {
          const label = t ? STRING_RENTAL_TYPE_LABELS[t] : '全タイプ'
          const href = `/admin/string-contracts${t ? `?type=${t}` : ''}`
          return (
            <Link key={t ?? 'all'} href={href}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                rentalTypeFilter === t ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
              }`}>
              {label}
            </Link>
          )
        })}
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {contracts.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">契約がありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-5 py-3 font-medium text-gray-600">顧客</th>
                <th className="px-4 py-3 font-medium text-gray-600">楽器</th>
                <th className="px-4 py-3 font-medium text-gray-600">タイプ</th>
                <th className="px-4 py-3 font-medium text-gray-600">月額/料金</th>
                <th className="px-4 py-3 font-medium text-gray-600">開始日</th>
                <th className="px-4 py-3 font-medium text-gray-600">ステータス</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((c) => {
                const customer = (Array.isArray(c.customer) ? c.customer[0] : c.customer) as { name: string } | null
                const instrument = (Array.isArray(c.instrument) ? c.instrument[0] : c.instrument) as { string_type: 'violin' | 'viola' | 'cello'; size: string; maker: string } | null
                return (
                  <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-5 py-3 font-medium text-gray-900">{customer?.name || '—'}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {instrument ? (
                        <>
                          {STRING_TYPE_LABELS[instrument.string_type]} {instrument.size}
                          <span className="text-xs text-gray-400 ml-1">{instrument.maker}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        c.rental_type === 'subscription' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
                      }`}>
                        {STRING_RENTAL_TYPE_LABELS[c.rental_type]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 font-medium">
                      {formatCurrency(c.monthly_fee)}
                      {c.rental_type === 'subscription' ? '/月' : ''}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(c.start_date)}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[c.status]}`}>
                        {CONTRACT_STATUS_LABELS[c.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/string-contracts/${c.id}`} className="text-blue-600 hover:underline text-xs">詳細</Link>
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
