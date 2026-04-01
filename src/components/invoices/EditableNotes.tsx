'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateInvoiceNotes } from '@/actions/invoice-actions'

interface Props {
  invoiceId: string
  currentNotes: string | null
}

export function EditableNotes({ invoiceId, currentNotes }: Props) {
  const router = useRouter()
  const [editing, setEditing] = useState(false)
  const [notes, setNotes] = useState(currentNotes || '')
  const [pending, startTransition] = useTransition()

  function save() {
    startTransition(async () => {
      await updateInvoiceNotes(invoiceId, notes)
      setEditing(false)
      router.refresh()
    })
  }

  function cancel() {
    setNotes(currentNotes || '')
    setEditing(false)
  }

  if (!editing) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">備考</h2>
          <button
            onClick={() => setEditing(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            {currentNotes ? '編集' : '+ 備考を追加'}
          </button>
        </div>
        {currentNotes ? (
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{currentNotes}</p>
        ) : (
          <p className="text-sm text-gray-400">備考はありません</p>
        )}
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-blue-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-3">備考</h2>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={3}
        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none mb-3"
        placeholder="PDFの備考欄に表示されます"
      />
      <div className="flex gap-2">
        <button onClick={save} disabled={pending}
          className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded disabled:opacity-50">
          {pending ? '保存中…' : '保存'}
        </button>
        <button onClick={cancel}
          className="px-4 py-1.5 text-xs text-gray-500 hover:text-gray-700">
          キャンセル
        </button>
      </div>
    </div>
  )
}
