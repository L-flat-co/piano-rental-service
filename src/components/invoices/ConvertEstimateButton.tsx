'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { convertEstimateToInvoice } from '@/actions/invoice-actions'

interface Props {
  invoiceId: string
  hasContract: boolean  // contract_id が紐づいているか
}

export function ConvertEstimateButton({ invoiceId, hasContract }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [updateContract, setUpdateContract] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConvert() {
    setLoading(true)
    setError(null)
    const result = await convertEstimateToInvoice(invoiceId, hasContract && updateContract)
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
      <button
        onClick={() => { setOpen(true); setError(null) }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-md"
      >
        請求書に変換する
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-2">見積書を請求書に変換</h2>
            <p className="text-sm text-gray-500 mb-4">
              番号が EST → INV に変わり、発行日が本日に更新されます。
            </p>

            {hasContract && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                <label className="flex items-start gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateContract}
                    onChange={(e) => setUpdateContract(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      この見積の内容で契約を更新する
                    </p>
                    <p className="text-xs text-blue-600 mt-0.5">
                      プラン・オプション・初期費用が見積書の内容に合わせて更新されます
                    </p>
                  </div>
                </label>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 mb-3">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConvert}
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md"
              >
                {loading ? '変換中…' : '変換する'}
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
