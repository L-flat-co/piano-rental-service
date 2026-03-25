import Link from 'next/link'
import { getContracts } from '@/actions/contract-actions'
import { CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS, CONTRACT_PERIOD_LABELS } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ContractStatus } from '@/types'

export default async function ContractsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const query = searchParams.q || ''
  const statusFilter = searchParams.status as ContractStatus | undefined
  let contracts = await getContracts(query)

  if (statusFilter) {
    contracts = contracts.filter((c) => c.status === statusFilter)
  }

  const activeCount = contracts.filter((c) => c.status === 'active').length

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ご家庭/教室用 契約</h1>
          <p className="text-sm text-gray-500 mt-1">
            {contracts.length}件表示 / 契約中 {activeCount}件
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/api/contracts/export"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSVエクスポート
          </a>
          <Link
            href="/admin/contracts/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            + 契約を登録
          </Link>
        </div>
      </div>

      {/* 検索・フィルタ */}
      <form className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="顧客名・ピアノ機種で検索..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          name="status"
          defaultValue={statusFilter || ''}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">すべてのステータス</option>
          <option value="active">契約中</option>
          <option value="suspended">一時停止</option>
          <option value="terminated">解約済み</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md"
        >
          絞り込む
        </button>
      </form>

      {/* テーブル */}
      {contracts.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {query ? `"${query}" の検索結果はありません` : '契約が登録されていません'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">顧客</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ピアノ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">プラン / 期間</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">月額</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">開始日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">請求日</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {contracts.map((contract) => (
                <tr key={contract.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/contracts/${contract.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {contract.customer?.name || '—'}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {contract.piano
                      ? `${contract.piano.maker} ${contract.piano.model}`
                      : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    <div>{contract.plan?.name || '—'}</div>
                    <div className="text-xs text-gray-400">
                      {CONTRACT_PERIOD_LABELS[contract.contract_period]}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-900 font-medium">
                    {contract.plan ? formatCurrency(contract.plan.monthly_fee) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(contract.start_date)}</td>
                  <td className="px-4 py-3 text-gray-600">毎月{contract.billing_day}日</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[contract.status]}`}
                    >
                      {CONTRACT_STATUS_LABELS[contract.status]}
                    </span>
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
