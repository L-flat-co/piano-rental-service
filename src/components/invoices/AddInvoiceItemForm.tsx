'use client'

import { useState } from 'react'
import { addCustomInvoiceItem, removeInvoiceItem } from '@/actions/invoice-actions'
import { InvoiceItem } from '@/types'

interface Props {
  invoiceId: string
  items: InvoiceItem[]
}

function fmt(n: number) {
  return `¥${n.toLocaleString('ja-JP')}`
}

export function AddInvoiceItemForm({ invoiceId, items }: Props) {
  const [open, setOpen] = useState(false)
  const [label, setLabel] = useState('')
  const [unitPrice, setUnitPrice] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleAdd() {
    if (!label.trim()) {
      setError('品目名を入力してください')
      return
    }
    const price = parseInt(unitPrice, 10)
    if (isNaN(price) || price < 0) {
      setError('単価は0以上の整数を入力してください')
      return
    }
    const qty = parseInt(quantity, 10)
    if (isNaN(qty) || qty < 1) {
      setError('数量は1以上を入力してください')
      return
    }
    setSaving(true)
    const result = await addCustomInvoiceItem(invoiceId, {
      label: label.trim(),
      unit_price: price,
      quantity: qty,
    })
    setSaving(false)
    if (!result.success) {
      setError(result.error)
    } else {
      setLabel('')
      setUnitPrice('')
      setQuantity('1')
      setError(null)
      setOpen(false)
    }
  }

  async function handleDelete(itemId: string) {
    if (!confirm('この品目を削除しますか？')) return
    setDeletingId(itemId)
    await removeInvoiceItem(invoiceId, itemId)
    setDeletingId(null)
  }

  const previewAmount =
    !isNaN(parseInt(unitPrice)) && !isNaN(parseInt(quantity))
      ? parseInt(unitPrice) * parseInt(quantity)
      : null

  return (
    <div className="border-t border-gray-100">
      {/* 既存明細（削除ボタン付き）*/}
      {items.map((item) => (
        <div
          key={item.id}
          className="flex items-center gap-2 px-6 py-2 border-b border-gray-50 hover:bg-gray-50 group"
        >
          <span className="flex-1 text-sm text-gray-700">{item.label}</span>
          <span className="text-sm text-gray-500 w-28 text-right">{fmt(item.unit_price)}</span>
          <span className="text-sm text-gray-500 w-8 text-center">{item.quantity}</span>
          <span className="text-sm text-gray-800 w-24 text-right">{fmt(item.amount)}</span>
          <button
            onClick={() => handleDelete(item.id)}
            disabled={deletingId === item.id}
            className="ml-2 w-6 h-6 flex items-center justify-center rounded text-gray-300 hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
            title="削除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      ))}

      {/* 追加フォーム */}
      {open ? (
        <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
          <div className="text-xs font-medium text-blue-700 mb-3">カスタム品目を追加</div>
          {error && (
            <div className="mb-2 text-xs text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex gap-3 items-start">
            <div className="flex-1">
              <label className="text-xs text-gray-500 mb-1 block">品目名</label>
              <input
                type="text"
                placeholder="例：出張調律費"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="w-32">
              <label className="text-xs text-gray-500 mb-1 block">単価（税抜）</label>
              <input
                type="number"
                placeholder="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div className="w-20">
              <label className="text-xs text-gray-500 mb-1 block">数量</label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            {previewAmount !== null && (
              <div className="w-24 pt-6 text-sm font-medium text-gray-700 text-right">
                {fmt(previewAmount)}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleAdd}
              disabled={saving}
              className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '追加中…' : '追加'}
            </button>
            <button
              onClick={() => { setOpen(false); setError(null) }}
              className="px-4 py-1.5 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <div className="px-6 py-3">
          <button
            onClick={() => setOpen(true)}
            className="flex items-center gap-1.5 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-3 py-1.5 rounded transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            カスタム品目を追加
          </button>
        </div>
      )}
    </div>
  )
}
