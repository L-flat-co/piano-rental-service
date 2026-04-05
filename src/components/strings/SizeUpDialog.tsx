'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { sizeUpStringContract } from '@/actions/string-contract-actions'
import { StringInstrument } from '@/types'
import { STRING_TYPE_LABELS } from '@/lib/constants'

interface Props {
  contractId: string
  currentInstrument: StringInstrument
  availableInstruments: StringInstrument[]
}

export function SizeUpDialog({ contractId, currentInstrument, availableInstruments }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [newInstrumentId, setNewInstrumentId] = useState('')
  const [changedAt, setChangedAt] = useState(new Date().toISOString().slice(0, 10))
  const [memo, setMemo] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSizeUp() {
    if (!newInstrumentId) { setError('新しい楽器を選択してください'); return }
    setLoading(true)
    setError(null)

    const result = await sizeUpStringContract(contractId, newInstrumentId, changedAt, memo)
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
        className="text-xs text-blue-600 hover:text-blue-800 font-medium border border-blue-300 px-3 py-1.5 rounded-md hover:bg-blue-50">
        サイズアップ
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-1">サイズアップ</h2>
            <p className="text-xs text-gray-500 mb-4">
              現在: {STRING_TYPE_LABELS[currentInstrument.string_type]} {currentInstrument.size} — {currentInstrument.maker} {currentInstrument.model}
            </p>

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">新しい楽器 <span className="text-red-500">*</span></label>
                <select value={newInstrumentId} onChange={(e) => setNewInstrumentId(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- 選択 --</option>
                  {availableInstruments.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.size} — {i.maker} {i.model}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">変更日</label>
                <input type="date" value={changedAt} onChange={(e) => setChangedAt(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">メモ</label>
                <input type="text" value={memo} onChange={(e) => setMemo(e.target.value)}
                  placeholder="理由など（任意）"
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={handleSizeUp} disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md">
                {loading ? '処理中…' : 'サイズアップ実行'}
              </button>
              <button onClick={() => setOpen(false)}
                className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-md">
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
