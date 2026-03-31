'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEstimate } from '@/actions/invoice-actions'

interface Props {
  contractId: string
}

export function CreateEstimateButton({ contractId }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCreate() {
    setLoading(true)
    setError(null)
    const result = await createEstimate(contractId)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push(`/admin/invoices/${result.data.id}`)
  }

  return (
    <div>
      <button
        onClick={handleCreate}
        disabled={loading}
        className="flex items-center gap-1.5 bg-white border border-blue-300 hover:bg-blue-50 text-blue-700 text-sm font-medium px-3 py-2 rounded-md disabled:opacity-50"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {loading ? '作成中…' : '見積書を作成'}
      </button>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
    </div>
  )
}
