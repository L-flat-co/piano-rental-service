'use client'

import { useState } from 'react'
import Link from 'next/link'
import { formatCurrency, formatDate } from '@/lib/utils'
import { INVOICE_STATUS_LABELS, INVOICE_STATUS_COLORS } from '@/lib/constants'

interface InvoiceRow {
  id: string
  invoice_number: string
  total_amount: number
  status: string
  created_at: string
  notes: string | null
}

interface Props {
  invoices: InvoiceRow[]
  perPage?: number
}

export function InvoiceListPaginated({ invoices, perPage = 12 }: Props) {
  const [page, setPage] = useState(0)
  const totalPages = Math.ceil(invoices.length / perPage)
  const displayed = invoices.slice(page * perPage, (page + 1) * perPage)

  if (invoices.length === 0) {
    return <p className="text-sm text-gray-400 text-center py-4">請求書はありません</p>
  }

  return (
    <div>
      <div className="space-y-2">
        {displayed.map((inv) => (
          <Link key={inv.id} href={`/admin/invoices/${inv.id}`}
            className="block border border-gray-100 rounded-lg px-4 py-3 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-mono text-blue-600">{inv.invoice_number}</p>
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${INVOICE_STATUS_COLORS[inv.status as keyof typeof INVOICE_STATUS_COLORS] || ''}`}>
                  {INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS] || inv.status}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900">{formatCurrency(inv.total_amount)}</p>
                <p className="text-xs text-gray-400">{formatDate(inv.created_at)}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* ページネーション */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
          <button
            onClick={() => setPage((p) => Math.max(0, p - 1))}
            disabled={page === 0}
            className="text-xs text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed px-2 py-1"
          >
            ← 前へ
          </button>
          <span className="text-xs text-gray-400">
            {page + 1} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="text-xs text-gray-500 hover:text-gray-700 disabled:text-gray-300 disabled:cursor-not-allowed px-2 py-1"
          >
            次へ →
          </button>
        </div>
      )}
    </div>
  )
}
