'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoiceStatus } from '@/actions/invoice-actions'
import { InvoiceStatus } from '@/types'

interface InvoiceStatusButtonsProps {
  invoiceId: string
  currentStatus: InvoiceStatus
}

export function InvoiceStatusButtons({
  invoiceId,
  currentStatus,
}: InvoiceStatusButtonsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(status: InvoiceStatus) {
    setLoading(true)
    await updateInvoiceStatus(invoiceId, status)
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="space-y-2">
      {currentStatus === 'draft' && (
        <button
          onClick={() => handleStatusChange('issued')}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white text-sm font-medium py-2 rounded-md"
        >
          発行済みにする
        </button>
      )}
      {currentStatus === 'issued' && (
        <button
          onClick={() => handleStatusChange('paid')}
          disabled={loading}
          className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white text-sm font-medium py-2 rounded-md"
        >
          入金確認済みにする
        </button>
      )}
      {currentStatus !== 'cancelled' && currentStatus !== 'paid' && (
        <button
          onClick={() => handleStatusChange('cancelled')}
          disabled={loading}
          className="w-full bg-white border border-red-300 hover:bg-red-50 text-red-600 text-sm font-medium py-2 rounded-md"
        >
          キャンセルにする
        </button>
      )}
      {currentStatus === 'issued' && (
        <button
          onClick={() => handleStatusChange('draft')}
          disabled={loading}
          className="w-full bg-white border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium py-2 rounded-md"
        >
          下書きに戻す
        </button>
      )}
    </div>
  )
}
