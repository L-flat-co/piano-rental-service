'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEstimate } from '@/actions/invoice-actions'
import type { EstimateType } from '@/actions/invoice-actions'

interface Props {
  contractId: string
}

const ESTIMATE_OPTIONS: { value: EstimateType; label: string; description: string }[] = [
  { value: 'combined', label: '初期費用＋初月分（合算）', description: '運送費・調律料等の初期費用と初月のレンタル料をまとめた見積書' },
  { value: 'initial_only', label: '初期費用のみ', description: '運送費・調律料等の初期費用のみの見積書' },
  { value: 'monthly_only', label: '初月分のみ', description: '初月のレンタル料・オプション料のみの見積書' },
]

export function CreateEstimateButton({ contractId }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<EstimateType>('combined')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setLoading(true)
    setError(null)
    const result = await createEstimate(contractId, selected)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }
    setOpen(false)
    router.push(`/admin/invoices/${result.data.id}`)
  }

  return (
    <>
      <button
        onClick={() => { setOpen(true); setError(null) }}
        className="flex items-center gap-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 text-sm font-medium px-3 py-2 rounded-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        見積書を作成
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">見積書を作成</h2>
            <p className="text-xs text-gray-500 mb-4">含める内容を選択してください</p>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 mb-4">{error}</div>
            )}

            <div className="space-y-2 mb-5">
              {ESTIMATE_OPTIONS.map((opt) => (
                <label
                  key={opt.value}
                  className={`block border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                    selected === opt.value
                      ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-500/20'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="estimateType"
                      value={opt.value}
                      checked={selected === opt.value}
                      onChange={() => setSelected(opt.value)}
                      className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{opt.label}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{opt.description}</p>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCreate}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md"
              >
                {loading ? '作成中…' : '作成する'}
              </button>
              <button
                onClick={() => setOpen(false)}
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
