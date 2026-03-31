'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { convertEstimateToInvoice } from '@/actions/invoice-actions'

interface Props {
  invoiceId: string
}

export function ConvertEstimateButton({ invoiceId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConvert() {
    if (!confirm('この見積書を請求書に変換しますか？番号が EST → INV に変わります。')) return
    setLoading(true)
    setError(null)
    const result = await convertEstimateToInvoice(invoiceId)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.refresh()
  }

  return (
    <div>
      <button
        onClick={handleConvert}
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-bold py-2.5 rounded-md"
      >
        {loading ? '変換中…' : '請求書に変換する'}
      </button>
      <p className="text-xs text-gray-400 mt-1.5 text-center">
        番号が EST → INV に変わり、発行日が今日に更新されます
      </p>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
