import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCustomer, deleteCustomer } from '@/actions/customer-actions'
import { CUSTOMER_STATUS_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { CustomerStatus } from '@/types'
import { DeleteButton } from '@/components/shared/DeleteButton'

const STATUS_COLORS: Record<CustomerStatus, string> = {
  active: 'bg-green-100 text-green-800',
  suspended: 'bg-yellow-100 text-yellow-800',
  terminated: 'bg-gray-100 text-gray-600',
}

export default async function CustomerDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const customer = await getCustomer(params.id)

  if (!customer) {
    notFound()
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{customer.name}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[customer.status]}`}
            >
              {CUSTOMER_STATUS_LABELS[customer.status]}
            </span>
          </div>
          {customer.name_kana && (
            <p className="text-sm text-gray-500 mt-0.5">{customer.name_kana}</p>
          )}
          {customer.company_name && (
            <p className="text-sm text-gray-500">{customer.company_name}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/customers/${customer.id}/edit`}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md"
          >
            編集
          </Link>
          <Link
            href="/admin/customers"
            className="text-gray-500 hover:text-gray-700 text-sm px-3 py-2"
          >
            ← 一覧に戻る
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* 基本情報 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">基本情報</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                メールアドレス
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.email || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                電話番号
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.phone || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                郵便番号
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.postal_code || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">住所</dt>
              <dd className="mt-1 text-sm text-gray-900">{customer.address || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">登録日</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(customer.created_at)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                最終更新
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(customer.updated_at)}</dd>
            </div>
          </dl>
        </div>

        {/* メモ */}
        {customer.memo && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">メモ</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.memo}</p>
          </div>
        )}

        {/* 契約履歴（契約管理実装後に充実させる） */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">契約履歴</h2>
          <p className="text-sm text-gray-400 text-center py-6">契約データはありません</p>
        </div>

        {/* 帳票履歴（帳票発行実装後に充実させる） */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">帳票履歴</h2>
          <p className="text-sm text-gray-400 text-center py-6">帳票データはありません</p>
        </div>

        {/* 削除 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <DeleteButton
            onDelete={async () => {
              'use server'
              return deleteCustomer(customer.id)
            }}
            redirectTo="/admin/customers"
            confirmMessage={`${customer.name} を削除しますか？この操作は取り消せません。`}
            label="この顧客を削除"
          />
        </div>
      </div>
    </div>
  )
}
