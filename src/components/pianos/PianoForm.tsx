'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { PianoFormData, createPiano, updatePiano } from '@/actions/piano-actions'
import { Piano } from '@/types'

interface PianoFormProps {
  piano?: Piano
}

export function PianoForm({ piano }: PianoFormProps) {
  const router = useRouter()
  const isEdit = !!piano

  const [formData, setFormData] = useState<PianoFormData>({
    maker: piano?.maker || '',
    model: piano?.model || '',
    serial_number: piano?.serial_number || '',
    piano_type: piano?.piano_type || 'upright',
    is_mute: piano?.is_mute ?? false,
    is_white: piano?.is_white ?? false,
    status: piano?.status || 'available',
    storage_location: piano?.storage_location || '',
    purchase_date: piano?.purchase_date || '',
    memo: piano?.memo || '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = isEdit
      ? await updatePiano(piano!.id, formData)
      : await createPiano(formData)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (isEdit) {
      router.push(`/admin/pianos/${piano!.id}`)
    } else {
      router.push('/admin/pianos')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 基本情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メーカー <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="maker"
              value={formData.maker}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="YAMAHA"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              機種名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="model"
              value={formData.model}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="U3H"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              シリアル番号
            </label>
            <input
              type="text"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="1234567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">種別</label>
            <select
              name="piano_type"
              value={formData.piano_type}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="upright">アップライト</option>
              <option value="grand">グランド</option>
              <option value="digital">デジタル</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="available">在庫あり</option>
              <option value="rented">貸出中</option>
              <option value="maintenance">メンテナンス中</option>
              <option value="disposed">廃棄</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">保管場所</label>
            <input
              type="text"
              name="storage_location"
              value={formData.storage_location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="倉庫A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">購入日</label>
            <input
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* チェックボックス */}
        <div className="mt-4 flex gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_mute"
              checked={formData.is_mute}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">消音機能付き</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              name="is_white"
              checked={formData.is_white}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">ホワイトモデル</span>
          </label>
        </div>
      </div>

      {/* メモ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">メモ</h2>
        <textarea
          name="memo"
          value={formData.memo}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="傷や状態のメモなど..."
        />
      </div>

      {/* ボタン */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded-md text-sm"
        >
          {loading ? '保存中...' : isEdit ? '更新する' : '登録する'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
