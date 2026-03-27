'use client'

import { useState } from 'react'

interface Props {
  contractId: string
  defaultDate: string  // contract.created_at を YYYY-MM-DD で
}

export function ContractPDFButton({ contractId, defaultDate }: Props) {
  const [open, setOpen] = useState(false)
  const [contractDate, setContractDate] = useState(defaultDate)

  function handleOpen() {
    window.open(
      `/api/contracts/${contractId}/pdf${contractDate ? `?date=${contractDate}` : ''}`,
      '_blank'
    )
    setOpen(false)
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-2 rounded-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        契約書PDF
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 p-3">
          <label className="block text-xs font-medium text-gray-600 mb-1">契約日</label>
          <input
            type="date"
            value={contractDate}
            onChange={(e) => setContractDate(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-2 py-1.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="flex gap-2">
            <button
              onClick={handleOpen}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-md"
            >
              PDFを開く
            </button>
            <button
              onClick={() => setOpen(false)}
              className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
