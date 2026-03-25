'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { terminateContract, calculateEarlyTerminationFee } from '@/actions/contract-actions'
import type { EarlyTerminationFeeResult } from '@/actions/contract-actions'

/** 搬出費用の状況 */
export type PickupFeeStatus =
  | { type: 'round_trip' }           // 往復運送 → 搬出込み
  | { type: 'invoiced' }             // 搬入のみ → 搬出請求済み
  | { type: 'pending'; estimate: number }  // 搬入のみ → 搬出未請求（参考金額あり）
  | { type: 'none' }                 // 運送費なし

interface TerminateButtonProps {
  contractId: string
  customerId: string
  pickupFeeStatus: PickupFeeStatus
}

function formatCurrency(n: number) {
  return n.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })
}

export function TerminateButton({ contractId, customerId, pickupFeeStatus }: TerminateButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feeInfo, setFeeInfo] = useState<EarlyTerminationFeeResult | null>(null)
  const [calcPending, startCalcTransition] = useTransition()

  // 搬出請求書を同時に作成するかどうか
  const [createPickupInvoice, setCreatePickupInvoice] = useState(pickupFeeStatus.type === 'pending')
  const [pickupFeeAmount, setPickupFeeAmount] = useState(
    pickupFeeStatus.type === 'pending' ? pickupFeeStatus.estimate : 0
  )

  // 解約日が変わるたびに中途解約料を計算
  useEffect(() => {
    if (endDate.length !== 10) {
      setFeeInfo(null)
      return
    }
    startCalcTransition(async () => {
      const result = await calculateEarlyTerminationFee(contractId, endDate)
      if (result.success) {
        setFeeInfo(result.data)
      } else {
        setFeeInfo(null)
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endDate, contractId])

  async function handleTerminate() {
    if (!endDate) {
      setError('解約日を入力してください')
      return
    }
    setLoading(true)
    setError(null)

    const result = await terminateContract(contractId, endDate, {
      createPickupInvoice: createPickupInvoice && pickupFeeStatus.type === 'pending',
      pickupFeeAmount,
      customerId,
    })
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
  }

  function handleOpen() {
    setOpen(true)
    setEndDate('')
    setFeeInfo(null)
    setError(null)
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-white border border-red-300 hover:bg-red-50 text-red-600 text-sm font-medium px-4 py-2 rounded-md"
      >
        解約処理
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">解約処理</h2>
            <p className="text-sm text-gray-500 mb-4">
              解約日を入力してください。ピアノのステータスは「在庫あり」に戻ります。
            </p>

            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                解約日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            {/* 中途解約料プレビュー */}
            {endDate.length === 10 && (
              <div className="mb-4">
                {calcPending ? (
                  <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-400">
                    計算中…
                  </div>
                ) : feeInfo ? (
                  feeInfo.hasFee ? (
                    <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 space-y-1">
                      <p className="text-xs font-semibold text-amber-800">中途解約料が発生します</p>
                      <div className="text-xs text-amber-700 space-y-0.5">
                        <p>
                          最低契約満了日：
                          <span className="font-medium">
                            {feeInfo.minEndDate?.replace(/-/g, '/')}
                          </span>
                        </p>
                        <p>
                          残り期間：約
                          <span className="font-medium"> {feeInfo.remainingMonths} ヶ月</span>
                        </p>
                        <p>
                          月額合計：
                          <span className="font-medium">{formatCurrency(feeInfo.monthlyTotal)}</span>
                        </p>
                      </div>
                      <p className="text-sm font-bold text-amber-900 pt-1 border-t border-amber-200">
                        中途解約料：{formatCurrency(feeInfo.feeAmount)}
                        <span className="text-xs font-normal ml-1">（税込）</span>
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
                      ✓ 最低契約期間を満了しているため、中途解約料は発生しません
                    </div>
                  )
                ) : null}
              </div>
            )}

            {/* 搬出費用の状況 */}
            <div className="mb-4 rounded-md border px-4 py-3 space-y-2
              ${pickupFeeStatus.type === 'round_trip' || pickupFeeStatus.type === 'invoiced'
                ? 'bg-gray-50 border-gray-200'
                : 'bg-blue-50 border-blue-200'}">
              <p className="text-xs font-semibold text-gray-700">搬出費用</p>

              {pickupFeeStatus.type === 'round_trip' && (
                <p className="text-xs text-green-700">✓ 往復運送のため搬出費込み</p>
              )}
              {pickupFeeStatus.type === 'invoiced' && (
                <p className="text-xs text-green-700">✓ 搬出費用は請求済み</p>
              )}
              {pickupFeeStatus.type === 'none' && (
                <p className="text-xs text-gray-500">運送費の記録がありません</p>
              )}

              {pickupFeeStatus.type === 'pending' && (
                <div className="space-y-2">
                  <p className="text-xs text-blue-700">⚠ 搬出費用が未請求です</p>

                  <label className="flex items-start gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createPickupInvoice}
                      onChange={(e) => setCreatePickupInvoice(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span className="text-xs text-gray-700">
                      解約と同時に搬出費用の請求書を作成する
                    </span>
                  </label>

                  {createPickupInvoice && (
                    <div className="flex items-center gap-2 pl-6">
                      <label className="text-xs text-gray-600">搬出費用（税抜）</label>
                      <div className="relative">
                        <span className="absolute left-2 top-1.5 text-xs text-gray-400">¥</span>
                        <input
                          type="number"
                          min={0}
                          value={pickupFeeAmount || ''}
                          onChange={(e) => setPickupFeeAmount(parseInt(e.target.value) || 0)}
                          className="w-28 border border-gray-300 rounded px-2 py-1 text-xs text-right pl-5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      </div>
                      {pickupFeeAmount > 0 && (
                        <span className="text-xs text-gray-400">
                          税込 {formatCurrency(Math.round(pickupFeeAmount * 1.1))}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleTerminate}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-sm font-medium py-2 rounded-md"
              >
                {loading ? '処理中...' : '解約する'}
              </button>
              <button
                onClick={() => { setOpen(false); setError(null) }}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-md"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
