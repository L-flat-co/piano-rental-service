import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getStringContract, terminateStringContract, deleteStringContract } from '@/actions/string-contract-actions'
import { STRING_TYPE_LABELS, STRING_SIZE_LABELS, STRING_RENTAL_TYPE_LABELS, CONTRACT_STATUS_LABELS, CONTRACT_STATUS_COLORS } from '@/lib/constants'
import { Customer, StringInstrument, StringRentalPlan } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { DeleteButton } from '@/components/shared/DeleteButton'
import { SizeUpDialog } from '@/components/strings/SizeUpDialog'
import { getStringInstruments } from '@/actions/string-instrument-actions'

export default async function StringContractDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [contract, allInstruments] = await Promise.all([
    getStringContract(params.id),
    getStringInstruments(),
  ])

  if (!contract) notFound()

  const customer = (Array.isArray(contract.customer) ? contract.customer[0] : contract.customer) as Customer | null
  const instrument = (Array.isArray(contract.instrument) ? contract.instrument[0] : contract.instrument) as StringInstrument | null
  const plan = (Array.isArray(contract.plan) ? contract.plan[0] : contract.plan) as StringRentalPlan | null

  // サイズアップ候補: 同じ種別で在庫ありの楽器（より大きいサイズ）
  const availableForSizeUp = allInstruments.filter(
    (i) => i.status === 'available' && i.string_type === instrument?.string_type && i.id !== instrument?.id
  )

  return (
    <div className="p-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">{customer?.name} 様の契約</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[contract.status]}`}>
              {CONTRACT_STATUS_LABELS[contract.status]}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              contract.rental_type === 'subscription' ? 'bg-purple-100 text-purple-700' : 'bg-orange-100 text-orange-700'
            }`}>
              {STRING_RENTAL_TYPE_LABELS[contract.rental_type]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {contract.status === 'active' && (
            <Link href={`/admin/string-contracts/${contract.id}/edit`}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-2 rounded-md">
              編集
            </Link>
          )}
          <DeleteButton
            onDelete={async () => {
              'use server'
              return deleteStringContract(contract.id)
            }}
            redirectTo="/admin/string-contracts"
            confirmMessage="この契約を削除しますか？"
            label="削除"
          />
          <Link href="/admin/string-contracts" className="text-gray-500 hover:text-gray-700 text-xs px-2 py-2">
            ← 一覧
          </Link>
        </div>
      </div>

      {/* 顧客・楽器 横並び */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-3">
          <p className="text-xs text-gray-500 mb-0.5">顧客</p>
          {customer ? (
            <>
              <Link href={`/admin/customers/${customer.id}`}
                className="text-sm font-semibold text-blue-600 hover:underline">{customer.name}</Link>
              <p className="text-xs text-gray-500">
                {[customer.phone, customer.email].filter(Boolean).join(' / ')}
              </p>
            </>
          ) : <p className="text-sm text-gray-400">—</p>}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-3">
          <p className="text-xs text-gray-500 mb-0.5">楽器</p>
          {instrument ? (
            <>
              <Link href={`/admin/strings/${instrument.id}`}
                className="text-sm font-semibold text-blue-600 hover:underline">
                {STRING_TYPE_LABELS[instrument.string_type]} {instrument.size} — {instrument.maker} {instrument.model}
              </Link>
              {instrument.serial_number && (
                <p className="text-xs text-gray-400 font-mono">S/N: {instrument.serial_number}</p>
              )}
            </>
          ) : <p className="text-sm text-gray-400">—</p>}
        </div>
      </div>

      <div className="space-y-6">
        {/* 契約内容 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">契約内容</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-gray-500">プラン</dt>
              <dd className="mt-1 text-sm text-gray-900">{plan?.name || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">
                {contract.rental_type === 'subscription' ? '月額（税込）' : '料金（税込）'}
              </dt>
              <dd className="mt-1 text-sm font-bold text-gray-900">{formatCurrency(contract.monthly_fee)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">開始日</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(contract.start_date)}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">終了日</dt>
              <dd className="mt-1 text-sm text-gray-900">{contract.end_date ? formatDate(contract.end_date) : '—'}</dd>
            </div>
            {contract.rental_type === 'subscription' && contract.billing_day && (
              <div>
                <dt className="text-xs font-medium text-gray-500">請求日</dt>
                <dd className="mt-1 text-sm text-gray-900">毎月{contract.billing_day}日</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500">支払方法</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {{ bank_transfer: '銀行振込', direct_debit: '口座振替', cash: '現金', card: 'カード', cod: '代引', other: 'その他' }[contract.payment_method || 'bank_transfer']}
              </dd>
            </div>
          </dl>
        </div>

        {/* サイズアップ */}
        {contract.status === 'active' && contract.rental_type === 'subscription' && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">サイズアップ</h2>
              {availableForSizeUp.length > 0 && (
                <SizeUpDialog
                  contractId={contract.id}
                  currentInstrument={instrument!}
                  availableInstruments={availableForSizeUp}
                />
              )}
            </div>
            {contract.size_ups && contract.size_ups.length > 0 ? (
              <div className="space-y-3">
                {contract.size_ups.map((su) => {
                  const oldInst = Array.isArray(su.old_instrument) ? su.old_instrument[0] : su.old_instrument
                  const newInst = Array.isArray(su.new_instrument) ? su.new_instrument[0] : su.new_instrument
                  return (
                    <div key={su.id} className="flex items-center gap-3 text-sm border-b border-gray-100 pb-3">
                      <span className="text-xs text-gray-400 w-20">{formatDate(su.changed_at)}</span>
                      <span className="text-gray-600">
                        {su.old_size} ({oldInst?.maker} {oldInst?.model})
                      </span>
                      <span className="text-gray-400">→</span>
                      <span className="text-gray-900 font-medium">
                        {su.new_size} ({newInst?.maker} {newInst?.model})
                      </span>
                      {su.memo && <span className="text-xs text-gray-400">({su.memo})</span>}
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-gray-400">サイズアップ履歴はありません</p>
            )}
          </div>
        )}

        {/* メモ */}
        {contract.memo && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">メモ</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.memo}</p>
          </div>
        )}

        {/* 解約 */}
        {contract.status === 'active' && (
          <div className="bg-white rounded-lg border border-red-200 p-4">
            <DeleteButton
              onDelete={async () => {
                'use server'
                return terminateStringContract(contract.id, new Date().toISOString().slice(0, 10))
              }}
              redirectTo={`/admin/string-contracts/${contract.id}`}
              confirmMessage="この契約を解約しますか？楽器は在庫に戻ります。"
              label="解約する"
            />
          </div>
        )}
      </div>
    </div>
  )
}
