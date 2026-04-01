'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { convertToContract, ConvertFormData } from '@/actions/application-actions'
import { Piano, PianoType } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  applicationId: string
  pianoType: PianoType
  availablePianos: Piano[]
}

export function ConvertToContractButton({ applicationId, pianoType, availablePianos }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState<ConvertFormData>({
    piano_id: '',
    start_date: '',
    billing_day: 1,
    transport_fee: 0,
    transport_type: 'round_trip',
    pickup_fee_estimate: 0,
    memo: '',
  })

  function set<K extends keyof ConvertFormData>(key: K, value: ConvertFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // 希望ピアノ種別でフィルタ
  const filteredPianos = availablePianos.filter(
    (p) => p.piano_type === pianoType || availablePianos.length < 3
  )

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.piano_id) { setError('ピアノを選択してください'); return }
    if (!formData.start_date) { setError('開始日を入力してください'); return }

    setLoading(true)
    setError(null)

    const result = await convertToContract(applicationId, formData)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    setOpen(false)
    router.push(`/admin/contracts/${result.data.contractId}`)
  }

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <>
      <button onClick={() => { setOpen(true); setError(null) }}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2.5 rounded-md">
        契約に変換する
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">申込を契約に変換</h2>
              <p className="text-xs text-gray-500 mt-0.5">ピアノ割当と契約条件を設定してください</p>
            </div>

            <form onSubmit={handleConvert} className="px-6 py-5 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
              )}

              {/* ピアノ選択 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  ピアノ <span className="text-red-500">*</span>
                </label>
                <select value={formData.piano_id} onChange={(e) => set('piano_id', e.target.value)}
                  className={inputClass} required>
                  <option value="">-- 選択してください --</option>
                  {filteredPianos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.maker} {p.model} {p.serial_number ? `(${p.serial_number})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 開始日・請求日 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    開始日 <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={formData.start_date} required
                    onChange={(e) => set('start_date', e.target.value)} className={inputClass} />
                </div>
                {formData.start_date && (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">支払期限</label>
                    <p className="text-sm text-gray-600 mt-2">
                      毎月 {(new Date(formData.start_date).getDate() <= 1 ? 28 : Math.min(new Date(formData.start_date).getDate(), 28) - 1)} 日
                    </p>
                    <p className="text-xs text-gray-400">開始日から自動設定</p>
                  </div>
                )}
              </div>

              {/* 運送費 */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">運送費</label>
                <div className="flex items-center gap-4 mb-2">
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="radio" name="transportType" checked={formData.transport_type === 'round_trip'}
                      onChange={() => set('transport_type', 'round_trip')} className="w-3.5 h-3.5" />
                    往復
                  </label>
                  <label className="flex items-center gap-1.5 text-xs cursor-pointer">
                    <input type="radio" name="transportType" checked={formData.transport_type === 'delivery_only'}
                      onChange={() => set('transport_type', 'delivery_only')} className="w-3.5 h-3.5" />
                    搬入のみ
                  </label>
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <span className="absolute left-2 top-2 text-xs text-gray-400">¥</span>
                    <input type="number" min={0} value={formData.transport_fee || ''}
                      onChange={(e) => set('transport_fee', parseInt(e.target.value) || 0)}
                      placeholder="税抜" className={`${inputClass} w-28 pl-5 text-right`} />
                  </div>
                  {formData.transport_fee > 0 && (
                    <span className="text-xs text-gray-400">
                      税込 {formatCurrency(Math.round(formData.transport_fee * 1.1))}
                    </span>
                  )}
                </div>
                {formData.transport_type === 'delivery_only' && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-xs text-gray-400">搬出参考:</span>
                    <div className="relative">
                      <span className="absolute left-2 top-1.5 text-xs text-gray-400">¥</span>
                      <input type="number" min={0} value={formData.pickup_fee_estimate || ''}
                        onChange={(e) => set('pickup_fee_estimate', parseInt(e.target.value) || 0)}
                        className="border border-gray-200 rounded px-2 py-1 text-xs text-right w-24 pl-5 bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-400" />
                    </div>
                  </div>
                )}
              </div>

              {/* メモ */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">メモ</label>
                <input type="text" value={formData.memo}
                  onChange={(e) => set('memo', e.target.value)} className={inputClass}
                  placeholder="備考（任意）" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md">
                  {loading ? '変換中…' : '契約を作成'}
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
