import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getContract } from '@/actions/contract-actions'
import { createClient } from '@/lib/supabase/server'
import {
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  CONTRACT_PERIOD_LABELS,
  PIANO_TYPE_LABELS,
} from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { TerminateButton } from '@/components/contracts/TerminateButton'
import type { PickupFeeStatus } from '@/components/contracts/TerminateButton'
import { ContractSpotFee } from '@/types'

export default async function ContractDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const contract = await getContract(params.id)

  if (!contract) {
    notFound()
  }

  // スポット費用を取得
  const { data: spotFeesData } = await supabase
    .from('contract_spot_fees')
    .select('*')
    .eq('contract_id', params.id)
    .order('section')
    .order('created_at')
  const spotFees = (spotFeesData as ContractSpotFee[]) || []
  const initialFees = spotFees.filter((f) => f.section === 'initial')
  const monthlySpotFees = spotFees.filter((f) => f.section === 'monthly')

  const monthlyTotal =
    (contract.plan?.monthly_fee || 0) +
    (contract.options?.reduce((sum, o) => sum + o.monthly_fee, 0) || 0)

  // 搬出費用の状況を判定
  const hasRoundTrip = initialFees.some((f) => f.label.includes('往復'))
  const hasDeliveryOnly = initialFees.some((f) => f.label.includes('搬入'))
  const pickupPending = initialFees.find((f) => f.memo === 'pickup_pending')

  let pickupFeeStatus: PickupFeeStatus = { type: 'none' }
  if (hasRoundTrip) {
    pickupFeeStatus = { type: 'round_trip' }
  } else if (hasDeliveryOnly) {
    // 搬出の請求書があるかチェック
    const { data: pickupInvoiceItems } = await supabase
      .from('invoice_items')
      .select('id, invoice:invoices!inner(contract_id)')
      .ilike('label', '%搬出%')
    const hasPickupInvoice = (pickupInvoiceItems || []).some(
      (item: { invoice: unknown }) => {
        const inv = Array.isArray(item.invoice) ? item.invoice[0] : item.invoice
        return inv && (inv as { contract_id: string }).contract_id === params.id
      }
    )
    if (hasPickupInvoice) {
      pickupFeeStatus = { type: 'invoiced' }
    } else {
      pickupFeeStatus = { type: 'pending', estimate: pickupPending?.amount || 0 }
    }
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {contract.customer?.name} さんの契約
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[contract.status]}`}
            >
              {CONTRACT_STATUS_LABELS[contract.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {contract.piano?.maker} {contract.piano?.model} /{' '}
            {CONTRACT_PERIOD_LABELS[contract.contract_period]}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/api/contracts/${contract.id}/pdf`}
            target="_blank"
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-2 rounded-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            契約書PDF
          </a>
          {contract.status === 'active' && (
            <>
              <Link
                href={`/admin/contracts/${contract.id}/edit`}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md"
              >
                編集
              </Link>
              <TerminateButton
                contractId={contract.id}
                customerId={contract.customer_id}
                pickupFeeStatus={pickupFeeStatus}
              />
            </>
          )}
          <Link
            href="/admin/contracts"
            className="text-gray-500 hover:text-gray-700 text-sm px-3 py-2"
          >
            ← 一覧に戻る
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 契約内容 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">契約内容</h2>
            <dl className="space-y-3">
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">プラン</dt>
                <dd className="font-medium text-gray-900">{contract.plan?.name || '—'}</dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-gray-500">月額（プラン）</dt>
                <dd className="text-gray-900">
                  {contract.plan ? formatCurrency(contract.plan.monthly_fee) : '—'}
                </dd>
              </div>
              {contract.options && contract.options.length > 0 && (
                <>
                  {contract.options.map((opt) => (
                    <div key={opt.id} className="flex justify-between text-sm">
                      <dt className="text-gray-500 pl-4">+ {opt.name}</dt>
                      <dd className="text-gray-900">+{formatCurrency(opt.monthly_fee)}</dd>
                    </div>
                  ))}
                </>
              )}
              <div className="flex justify-between text-sm pt-2 border-t border-gray-100">
                <dt className="font-medium text-gray-700">月額合計（税込）</dt>
                <dd className="font-bold text-gray-900 text-base">{formatCurrency(monthlyTotal)}</dd>
              </div>
            </dl>
          </div>

          {/* 契約期間・請求 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">期間・請求</h2>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  契約期間
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {CONTRACT_PERIOD_LABELS[contract.contract_period]}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  請求日
                </dt>
                <dd className="mt-1 text-sm text-gray-900">毎月{contract.billing_day}日</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  開始日
                </dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(contract.start_date)}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                  終了日
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {contract.end_date ? formatDate(contract.end_date) : '—'}
                </dd>
              </div>
            </dl>
          </div>

          {/* メモ */}
          {contract.memo && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">メモ</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{contract.memo}</p>
            </div>
          )}

          {/* 初期費用 */}
          {initialFees.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">初期費用</h2>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-2 font-medium text-gray-600 text-xs">品目</th>
                    <th className="text-right pb-2 font-medium text-gray-600 text-xs w-24">単価（税抜）</th>
                    <th className="text-center pb-2 font-medium text-gray-600 text-xs w-12">数量</th>
                    <th className="text-right pb-2 font-medium text-gray-600 text-xs w-24">金額（税込）</th>
                  </tr>
                </thead>
                <tbody>
                  {initialFees.map((f) => (
                    <tr key={f.id} className="border-b border-gray-100">
                      <td className="py-2 text-gray-900">{f.label}</td>
                      <td className="py-2 text-right text-gray-600">{formatCurrency(f.amount)}</td>
                      <td className="py-2 text-center text-gray-600">{f.quantity}</td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {formatCurrency(Math.round(f.amount * f.quantity * 1.1))}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={3} className="pt-2 text-right text-sm font-medium text-gray-600">合計（税込）</td>
                    <td className="pt-2 text-right font-bold text-gray-900">
                      {formatCurrency(initialFees.reduce((s, f) => s + Math.round(f.amount * f.quantity * 1.1), 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}

          {/* 月額スポット費用 */}
          {monthlySpotFees.length > 0 && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">月額スポット費用</h2>
              <div className="space-y-2">
                {monthlySpotFees.map((f) => (
                  <div key={f.id} className="flex justify-between text-sm">
                    <span className="text-gray-700">{f.label}</span>
                    <span className="text-gray-900 font-medium">
                      {formatCurrency(Math.round(f.amount * f.quantity * 1.1))}/月
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* サイドバー：顧客・ピアノ情報 */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">顧客</h3>
            {contract.customer ? (
              <div className="space-y-1">
                <Link
                  href={`/admin/customers/${contract.customer.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {contract.customer.name}
                </Link>
                {contract.customer.phone && (
                  <p className="text-xs text-gray-500">{contract.customer.phone}</p>
                )}
                {contract.customer.email && (
                  <p className="text-xs text-gray-500">{contract.customer.email}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">ピアノ</h3>
            {contract.piano ? (
              <div className="space-y-1">
                <Link
                  href={`/admin/pianos/${contract.piano.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {contract.piano.maker} {contract.piano.model}
                </Link>
                <p className="text-xs text-gray-500">
                  {PIANO_TYPE_LABELS[contract.piano.piano_type]}
                  {contract.piano.is_mute ? ' ・ 消音' : ''}
                </p>
                {contract.piano.serial_number && (
                  <p className="text-xs text-gray-400 font-mono">
                    S/N: {contract.piano.serial_number}
                  </p>
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
