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
import { EditInitialFees } from '@/components/contracts/EditInitialFees'
import { ContractPDFButton } from '@/components/contracts/ContractPDFButton'
import { DeleteContractButton } from '@/components/contracts/DeleteContractButton'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'
import { getSpotFeeTypes } from '@/actions/pricing-actions'
import { InvoiceListPaginated } from '@/components/contracts/InvoiceListPaginated'
import { ContractSpotFee } from '@/types'

export default async function ContractDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const [contract, spotFeeTypes] = await Promise.all([
    getContract(params.id),
    getSpotFeeTypes(),
  ])

  if (!contract) {
    notFound()
  }

  // confirmed + 開始日到来 → active に自動更新
  if (contract.status === 'confirmed' && contract.start_date) {
    const today = new Date().toISOString().slice(0, 10)
    if (contract.start_date <= today) {
      await supabase
        .from('contracts')
        .update({ status: 'active' })
        .eq('id', params.id)
      contract.status = 'active'
    }
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

  // この契約に紐づく見積書・請求書を取得
  const { data: relatedInvoicesData } = await supabase
    .from('invoices')
    .select('id, invoice_number, total_amount, status, created_at, notes')
    .eq('contract_id', params.id)
    .order('created_at', { ascending: false })
  const relatedInvoices = relatedInvoicesData || []
  const estimates = relatedInvoices.filter((inv) => inv.invoice_number.startsWith('EST-'))
  const invoices = relatedInvoices.filter((inv) => inv.invoice_number.startsWith('INV-'))

  // 関連データ件数（抹消モーダル用）
  const { count: invoiceCount } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', params.id)
  const { count: paymentCount } = await supabase
    .from('payments')
    .select('id', { count: 'exact', head: true })
    .in('invoice_id',
      (await supabase.from('invoices').select('id').eq('contract_id', params.id)).data?.map((i) => i.id) || []
    )
  const relatedCounts = {
    invoices: invoiceCount || 0,
    payments: paymentCount || 0,
    spotFees: spotFees.length,
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {contract.customer?.name} 様の契約
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${CONTRACT_STATUS_COLORS[contract.status]}`}
            >
              {CONTRACT_STATUS_LABELS[contract.status]}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ContractPDFButton
            contractId={contract.id}
            defaultDate={contract.created_at?.slice(0, 10) || ''}
          />
          {contract.status !== 'terminated' && (
            <>
              <Link
                href={`/admin/contracts/${contract.id}/edit`}
                className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-2 rounded-md"
              >
                編集
              </Link>
              {contract.status === 'active' && (
                <TerminateButton
                  contractId={contract.id}
                  customerId={contract.customer_id}
                  pickupFeeStatus={pickupFeeStatus}
                />
              )}
            </>
          )}
          <DeleteContractButton
            contractId={contract.id}
            customerName={contract.customer?.name || ''}
            relatedCounts={relatedCounts}
          />
          <Link
            href="/admin/contracts"
            className="text-gray-500 hover:text-gray-700 text-xs px-2 py-2"
          >
            ← 一覧
          </Link>
        </div>
      </div>

      {/* 顧客・ピアノ 横並び */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">顧客</p>
            {contract.customer ? (
              <>
                <Link href={`/admin/customers/${contract.customer.id}`}
                  className="text-sm font-semibold text-blue-600 hover:underline">
                  {contract.customer.name}
                </Link>
                <p className="text-xs text-gray-500">
                  {[contract.customer.phone, contract.customer.email].filter(Boolean).join(' / ')}
                </p>
              </>
            ) : <p className="text-sm text-gray-400">—</p>}
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-3 flex items-center justify-between">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">ピアノ</p>
            {contract.piano ? (
              <>
                <Link href={`/admin/pianos/${contract.piano.id}`}
                  className="text-sm font-semibold text-blue-600 hover:underline">
                  {contract.piano.maker} {contract.piano.model}
                </Link>
                <p className="text-xs text-gray-500">
                  {PIANO_TYPE_LABELS[contract.piano.piano_type]}
                  {contract.piano.is_mute ? ' ・ 消音' : ''}
                  {contract.piano.serial_number ? ` ・ S/N: ${contract.piano.serial_number}` : ''}
                </p>
              </>
            ) : <p className="text-sm text-gray-400">—</p>}
          </div>
        </div>
      </div>

      <div className="space-y-6">
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
                  支払期限
                </dt>
                <dd className="mt-1 text-sm text-gray-900">
                  毎月{Math.max(Math.min(new Date(contract.start_date).getDate(), 28) - 1, 1)}日
                </dd>
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

          {/* 初期費用（編集可能） */}
          <EditInitialFees
            contractId={contract.id}
            contractType="home_school"
            fees={initialFees}
            spotFeeTypes={spotFeeTypes.filter((s) => s.is_active)}
          />

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

          {/* 見積書作成ボタン（見積0件時のみ・初期費用の直下） */}
          {estimates.length === 0 && (
            <Link
              href={`/admin/contracts/${contract.id}/estimate/new`}
              className="block w-full text-center bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-700 text-sm font-medium py-3 rounded-lg transition-colors"
            >
              + 見積書を作成
            </Link>
          )}

          {/* 見積書 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">見積書</h2>
              {estimates.length > 0 && (
                <Link
                  href={`/admin/contracts/${contract.id}/estimate/new`}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  + 新しい見積書
                </Link>
              )}
            </div>
            {estimates.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">見積書はまだ作成されていません</p>
            ) : (
              <div className="space-y-2">
                {estimates.map((est) => (
                  <Link key={est.id} href={`/admin/invoices/${est.id}`}
                    className="block border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-mono text-blue-600">{est.invoice_number}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{est.notes}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-gray-900">{formatCurrency(est.total_amount)}</p>
                        <p className="text-xs text-gray-400">{formatDate(est.created_at)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* 請求書 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">請求書</h2>
            <InvoiceListPaginated invoices={invoices} perPage={12} />
          </div>
      </div>
    </div>
  )
}
