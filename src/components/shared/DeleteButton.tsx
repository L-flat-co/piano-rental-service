'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface DeleteButtonProps {
  /** Server Action（id を受け取って ActionResult を返す） */
  onDelete: () => Promise<{ success: boolean; error?: string }>
  /** 削除後のリダイレクト先 */
  redirectTo: string
  /** 確認ダイアログのメッセージ */
  confirmMessage?: string
  /** ボタンラベル */
  label?: string
}

export function DeleteButton({
  onDelete,
  redirectTo,
  confirmMessage = 'この操作は取り消せません。本当に削除しますか？',
  label = '削除',
}: DeleteButtonProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleDelete() {
    if (!confirm(confirmMessage)) return
    setLoading(true)
    setError(null)

    const result = await onDelete()
    if (!result.success) {
      setError(result.error || '削除に失敗しました')
      setLoading(false)
      return
    }

    router.push(redirectTo)
  }

  return (
    <div>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="w-full bg-white border border-red-300 hover:bg-red-50 text-red-600 text-sm font-medium py-2 rounded-md disabled:opacity-50"
      >
        {loading ? '削除中...' : label}
      </button>
      {error && (
        <p className="text-xs text-red-600 mt-2">{error}</p>
      )}
    </div>
  )
}
