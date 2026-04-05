'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDirectDebit } from '@/actions/direct-debit-actions'
import { ServiceType } from '@/types'

interface Props {
  contractId: string
  contractType: ServiceType
  customerId: string
  customerName: string
}

export function RegisterDirectDebitButton({ contractId, contractType, customerId, customerName }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [initialDebitDate, setInitialDebitDate] = useState('')
  const [bankName, setBankName] = useState('')
  const [memo, setMemo] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = await createDirectDebit({
      contract_id: contractId,
      contract_type: contractType,
      customer_id: customerId,
      initial_debit_date: initialDebitDate,
      bank_name: bankName,
      memo,
    })

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <button onClick={() => { setOpen(true); setError(null) }}
        className="w-full bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 text-sm font-medium py-2 rounded-md">
        口座振替を申請
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">口座振替を申請</h2>
            <p className="text-xs text-gray-500 mb-4">顧客: {customerName}</p>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">初回引落予定日</label>
                <input type="date" value={initialDebitDate} onChange={(e) => setInitialDebitDate(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">引落先銀行名</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                  placeholder="例: 三井住友銀行 中野支店"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">メモ</label>
                <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)}
                  placeholder="備考（任意）"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md">
                  {loading ? '申請中…' : '申請する'}
                </button>
                <button type="button" onClick={() => setOpen(false)}
                  className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-md">
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
