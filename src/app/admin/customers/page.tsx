import Link from 'next/link'
import { getCustomers } from '@/actions/customer-actions'
import { CUSTOMER_STATUS_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { CustomerStatus } from '@/types'

const STATUS_COLORS: Record<CustomerStatus, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-gray-100 text-gray-600',
}

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string }
}) {
  const query = searchParams.q || ''
  const categoryFilter = searchParams.category || ''

  let customers = await getCustomers(query)

  if (categoryFilter) {
    customers = customers.filter((c) =>
      c.product_categories?.includes(categoryFilter)
    )
  }

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">顧客管理</h1>
          <p className="text-sm text-gray-500 mt-1">{customers.length}件</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/admin/customers/import"
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md flex items-center gap-1.5"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            CSVインポート
          </Link>
          <Link
            href="/admin/customers/new"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
          >
            + 顧客を追加
          </Link>
        </div>
      </div>

      {/* カテゴリフィルタ */}
      <div className="flex items-center gap-1 mb-4">
        {([
          { value: '', label: 'すべて' },
          { value: 'piano', label: 'ピアノ' },
          { value: 'strings', label: '弦楽器' },
        ]).map((cat) => (
          <Link
            key={cat.value}
            href={`/admin/customers${cat.value ? `?category=${cat.value}` : ''}${query ? `${cat.value ? '&' : '?'}q=${query}` : ''}`}
            className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
              categoryFilter === cat.value
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
            }`}
          >
            {cat.label}
          </Link>
        ))}
      </div>

      {/* 検索 */}
      <form className="mb-4">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="名前・フリガナ・メール・電話で検索..."
          className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </form>

      {/* テーブル */}
      {customers.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {query ? `"${query}" の検索結果はありません` : '顧客が登録されていません'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">名前</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">フリガナ</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">電話</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">メール</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">登録日</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/customers/${customer.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {customer.name}
                    </Link>
                    {customer.company_name && (
                      <div className="text-xs text-gray-400">{customer.company_name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{customer.name_kana || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{customer.phone || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">{customer.email || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[customer.status]}`}
                    >
                      {CUSTOMER_STATUS_LABELS[customer.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(customer.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
