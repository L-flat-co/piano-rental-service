'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { StringInstrumentFormData, createStringInstrument, updateStringInstrument } from '@/actions/string-instrument-actions'
import { StringInstrument, StringType, StringSize, PianoStatus } from '@/types'
import { STRING_TYPE_LABELS, STRING_SIZE_LABELS, PIANO_STATUS_LABELS, DEFAULT_STRING_ACCESSORIES } from '@/lib/constants'

interface Props {
  instrument?: StringInstrument
}

export function StringInstrumentForm({ instrument }: Props) {
  const router = useRouter()
  const isEdit = !!instrument

  const [formData, setFormData] = useState<StringInstrumentFormData>({
    maker: instrument?.maker || '',
    model: instrument?.model || '',
    serial_number: instrument?.serial_number || '',
    string_type: instrument?.string_type || 'violin',
    size: instrument?.size || '4/4',
    status: instrument?.status || 'available',
    accessories: instrument?.accessories || ['弓', 'ケース'],
    storage_location: instrument?.storage_location || '',
    purchase_date: instrument?.purchase_date || '',
    memo: instrument?.memo || '',
  })
  const [customAccessory, setCustomAccessory] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof StringInstrumentFormData>(key: K, value: StringInstrumentFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function toggleAccessory(item: string) {
    setFormData((prev) => ({
      ...prev,
      accessories: prev.accessories.includes(item)
        ? prev.accessories.filter((a) => a !== item)
        : [...prev.accessories, item],
    }))
  }

  function addCustomAccessory() {
    if (!customAccessory.trim()) return
    if (!formData.accessories.includes(customAccessory.trim())) {
      setFormData((prev) => ({
        ...prev,
        accessories: [...prev.accessories, customAccessory.trim()],
      }))
    }
    setCustomAccessory('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.maker.trim()) { setError('メーカーを入力してください'); return }
    if (!formData.model.trim()) { setError('モデルを入力してください'); return }
    setLoading(true)
    setError(null)

    const result = isEdit
      ? await updateStringInstrument(instrument.id, formData)
      : await createStringInstrument(formData)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(isEdit ? `/admin/strings/${instrument.id}` : `/admin/strings/${result.data.id}`)
  }

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      )}

      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">楽器情報</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>楽器種別 <span className="text-red-500">*</span></label>
            <select value={formData.string_type} onChange={(e) => set('string_type', e.target.value as StringType)} className={inputClass}>
              {(Object.keys(STRING_TYPE_LABELS) as StringType[]).map((k) => (
                <option key={k} value={k}>{STRING_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>サイズ <span className="text-red-500">*</span></label>
            <select value={formData.size} onChange={(e) => set('size', e.target.value as StringSize)} className={inputClass}>
              {(Object.keys(STRING_SIZE_LABELS) as StringSize[]).map((k) => (
                <option key={k} value={k}>{STRING_SIZE_LABELS[k]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>メーカー <span className="text-red-500">*</span></label>
            <input type="text" value={formData.maker} onChange={(e) => set('maker', e.target.value)}
              className={inputClass} placeholder="例: Suzuki" required />
          </div>
          <div>
            <label className={labelClass}>モデル <span className="text-red-500">*</span></label>
            <input type="text" value={formData.model} onChange={(e) => set('model', e.target.value)}
              className={inputClass} placeholder="例: No.300" required />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>シリアル番号</label>
            <input type="text" value={formData.serial_number} onChange={(e) => set('serial_number', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>ステータス</label>
            <select value={formData.status} onChange={(e) => set('status', e.target.value as PianoStatus)} className={inputClass}>
              {(Object.keys(PIANO_STATUS_LABELS) as PianoStatus[]).map((k) => (
                <option key={k} value={k}>{PIANO_STATUS_LABELS[k]}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>保管場所</label>
            <input type="text" value={formData.storage_location} onChange={(e) => set('storage_location', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>購入日</label>
            <input type="date" value={formData.purchase_date} onChange={(e) => set('purchase_date', e.target.value)}
              className={inputClass} />
          </div>
        </div>
      </div>

      {/* 付属品 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">付属品</h2>
        <div className="space-y-2 mb-3">
          {DEFAULT_STRING_ACCESSORIES.map((item) => (
            <label key={item} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={formData.accessories.includes(item)}
                onChange={() => toggleAccessory(item)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
              <span className="text-sm text-gray-900">{item}</span>
            </label>
          ))}
          {formData.accessories
            .filter((a) => !DEFAULT_STRING_ACCESSORIES.includes(a as typeof DEFAULT_STRING_ACCESSORIES[number]))
            .map((a) => (
              <label key={a} className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked onChange={() => toggleAccessory(a)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
                <span className="text-sm text-gray-900">{a}</span>
              </label>
            ))}
        </div>
        <div className="flex items-center gap-2">
          <input type="text" value={customAccessory} onChange={(e) => setCustomAccessory(e.target.value)}
            placeholder="その他の付属品を追加" className={`${inputClass} flex-1`}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomAccessory() } }} />
          <button type="button" onClick={addCustomAccessory}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md">追加</button>
        </div>
      </div>

      {/* メモ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">メモ</h2>
        <textarea value={formData.memo} onChange={(e) => set('memo', e.target.value)} rows={3}
          className={inputClass + ' resize-none'} placeholder="社内メモを入力..." />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50">
          {loading ? '保存中…' : isEdit ? '変更を保存' : '楽器を登録'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">キャンセル</button>
      </div>
    </form>
  )
}
