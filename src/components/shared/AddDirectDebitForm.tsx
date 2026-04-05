'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDirectDebit } from '@/actions/direct-debit-actions'
import { Customer, ServiceType } from '@/types'
import { CustomerSearchSelect } from '@/components/shared/CustomerSearchSelect'

interface Props {
  customers: Customer[]
}

export function AddDirectDebitForm({ customers }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [customerId, setCustomerId] = useState('')
  const [contractId, setContractId] = useState('')
  const [contractType, setContractType] = useState<ServiceType>('home_school')
  const [initialDebitDate, setInitialDebitDate] = useState('')
  const [bankName, setBankName] = useState('')
  const [memo, setMemo] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { setError('顧客を選択してください'); return }
    if (!contractId) { setError('契約IDを入力してください'); return }
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
    setCustomerId('')
    setContractId('')
    setBankName('')
    setMemo('')
    router.refresh()
  }

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <>
      <button onClick={() => { setOpen(true); setError(null) }}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">
        + 振替を登録
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">口座振替を登録</h2>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">顧客 <span className="text-red-500">*</span></label>
                <CustomerSearchSelect customers={customers} value={customerId} onChange={setCustomerId} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">種別</label>
                  <select value={contractType} onChange={(e) => setContractType(e.target.value as ServiceType)} className={inputClass}>
                    <option value="home_school">ピアノ</option>
                    <option value="event">弦楽器</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">契約ID <span className="text-red-500">*</span></label>
                  <input type="text" value={contractId} onChange={(e) => setContractId(e.target.value)}
                    placeholder="UUID" className={inputClass} required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">初回引落予定日</label>
                <input type="date" value={initialDebitDate} onChange={(e) => setInitialDebitDate(e.target.value)} className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">引落先銀行名</label>
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)}
                  placeholder="例: 三井住友銀行 中野支店" className={inputClass} />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">メモ</label>
                <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)} className={inputClass} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md">
                  {loading ? '登録中…' : '登録する'}
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
