'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordPayment, PaymentFormData } from '@/actions/payment-actions'
import { PaymentMethod } from '@/types'

interface RecordPaymentButtonProps {
  invoiceId: string
  customerId: string
  totalAmount: number   // 請求書の合計額（税込）を初期値に
}

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: '銀行振込',
  cash: '現金',
  card: 'クレジットカード',
  direct_debit: '口座振替',
  cod: '代引',
  other: 'その他',
}

function formatCurrency(n: number) {
  return n.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })
}

export function RecordPaymentButton({
  invoiceId,
  customerId,
  totalAmount,
}: RecordPaymentButtonProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const today = new Date().toISOString().slice(0, 10)

  const [formData, setFormData] = useState<PaymentFormData>({
    invoice_id: invoiceId,
    customer_id: customerId,
    payment_date: today,
    amount: totalAmount,
    payment_method: 'bank_transfer',
    notes: '',
  })

  function set<K extends keyof PaymentFormData>(key: K, value: PaymentFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.payment_date) { setError('入金日を入力してください'); return }
    if (!formData.amount || formData.amount <= 0) { setError('入金金額を入力してください'); return }
    setLoading(true)
    setError(null)

    const result = await recordPayment(formData)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
    setLoading(false)
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null); setFormData(prev => ({ ...prev, payment_date: today })) }}
        className="w-full bg-green-600 hover:bg-green-700 text-white text-sm font-medium py-2 rounded-md"
      >
        入金を記録する
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">入金を記録</h2>

            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* 入金日 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  入金日 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.payment_date}
                  onChange={(e) => set('payment_date', e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                  required
                />
              </div>

              {/* 入金額 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  入金額（税込） <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-sm text-gray-500">¥</span>
                  <input
                    type="number"
                    min={1}
                    value={formData.amount}
                    onChange={(e) => set('amount', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-300 rounded-md pl-7 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  請求額: {formatCurrency(totalAmount)}
                </p>
              </div>

              {/* 入金方法 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">入金方法</label>
                <select
                  value={formData.payment_method}
                  onChange={(e) => set('payment_method', e.target.value as PaymentMethod)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((k) => (
                    <option key={k} value={k}>{PAYMENT_METHOD_LABELS[k]}</option>
                  ))}
                </select>
              </div>

              {/* メモ */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">メモ</label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => set('notes', e.target.value)}
                  placeholder="振込名義など"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md"
                >
                  {loading ? '記録中…' : '記録する'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-md"
                >
                  キャンセル
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
