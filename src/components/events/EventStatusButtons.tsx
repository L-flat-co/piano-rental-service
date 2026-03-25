'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateEventStatus, calculateCancellationFee } from '@/actions/event-actions'
import type { CancellationFeeResult } from '@/actions/event-actions'
import { EventStatus } from '@/types'

interface EventStatusButtonsProps {
  eventId: string
  currentStatus: EventStatus
  deliveryDate: string | null
}

function formatCurrency(n: number) {
  return n.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })
}

export function EventStatusButtons({
  eventId,
  currentStatus,
  deliveryDate,
}: EventStatusButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [cancelDate, setCancelDate] = useState(
    new Date().toISOString().slice(0, 10)
  )
  const [feeInfo, setFeeInfo] = useState<CancellationFeeResult | null>(null)
  const [calcPending, startCalcTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  async function handleStatus(status: EventStatus) {
    setLoading(true)
    await updateEventStatus(eventId, status)
    router.refresh()
    setLoading(false)
  }

  // キャンセル日が変わるたびにキャンセル料を計算
  useEffect(() => {
    if (!cancelOpen || cancelDate.length !== 10) { setFeeInfo(null); return }
    startCalcTransition(async () => {
      const result = await calculateCancellationFee(eventId, cancelDate)
      if (result.success) setFeeInfo(result.data)
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cancelDate, cancelOpen, eventId])

  async function handleCancel() {
    setLoading(true)
    setError(null)
    const result = await updateEventStatus(eventId, 'cancelled', cancelDate)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }
    setCancelOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <div className="space-y-2">
        {currentStatus === 'estimate' && (
          <button
            onClick={() => handleStatus('confirmed')}
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md"
          >
            確定にする
          </button>
        )}
        {currentStatus === 'confirmed' && (
          <button
            onClick={() => handleStatus('completed')}
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md"
          >
            完了にする
          </button>
        )}
        {currentStatus === 'confirmed' && (
          <button
            onClick={() => handleStatus('estimate')}
            disabled={loading}
            className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium py-2 rounded-md"
          >
            見積中に戻す
          </button>
        )}
        {(currentStatus === 'estimate' || currentStatus === 'confirmed') && (
          <button
            onClick={() => { setCancelOpen(true); setError(null) }}
            className="w-full bg-white border border-red-300 hover:bg-red-50 text-red-600 text-sm font-medium py-2 rounded-md"
          >
            キャンセル
          </button>
        )}
      </div>

      {/* キャンセルモーダル */}
      {cancelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">案件キャンセル</h2>
            <p className="text-sm text-gray-500 mb-4">
              キャンセル日を入力してください。キャンセルポリシーに基づきキャンセル料を算出します。
            </p>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                キャンセル日 <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={cancelDate}
                onChange={(e) => setCancelDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-400"
              />
            </div>

            {/* キャンセル料プレビュー */}
            {cancelDate.length === 10 && (
              <div className="mb-4">
                {calcPending ? (
                  <div className="rounded-md bg-gray-50 border border-gray-200 px-4 py-3 text-sm text-gray-400">計算中…</div>
                ) : feeInfo ? (
                  <div className={`rounded-md border px-4 py-3 ${feeInfo.hasFee ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200'}`}>
                    {feeInfo.daysUntilEvent !== null && (
                      <p className={`text-xs mb-1 ${feeInfo.hasFee ? 'text-amber-700' : 'text-green-700'}`}>
                        搬入日まで <strong>{feeInfo.daysUntilEvent}日</strong>
                      </p>
                    )}
                    <p className={`text-xs ${feeInfo.hasFee ? 'text-amber-700' : 'text-green-700'}`}>
                      {feeInfo.policyText}
                    </p>
                    {feeInfo.hasFee && (
                      <>
                        <p className="text-xs text-amber-700 mt-1">
                          基準金額: {formatCurrency(feeInfo.baseAmount)} × {feeInfo.feeRate * 100}%
                        </p>
                        <p className="text-sm font-bold text-amber-900 pt-1 border-t border-amber-200 mt-1">
                          キャンセル料: {formatCurrency(feeInfo.feeAmount)}
                        </p>
                      </>
                    )}
                    {!feeInfo.hasFee && (
                      <p className="text-sm font-semibold text-green-700 mt-1">
                        キャンセル料: なし
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md"
              >
                {loading ? '処理中...' : 'キャンセルする'}
              </button>
              <button
                onClick={() => setCancelOpen(false)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-md"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
