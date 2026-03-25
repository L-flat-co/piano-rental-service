'use client'

import { useState } from 'react'
import { bulkGenerateInvoices } from '@/actions/invoice-actions'

function getCurrentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getTodayStr(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function getDefaultDueDate(): string {
  const now = new Date()
  // 翌月末日
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 2, 0)
  return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}-${String(nextMonth.getDate()).padStart(2, '0')}`
}

export function BulkGenerateButton() {
  const [open, setOpen] = useState(false)
  const [billingMonth, setBillingMonth] = useState(getCurrentMonth)
  const [issueDate, setIssueDate] = useState(getTodayStr)
  const [dueDate, setDueDate] = useState(getDefaultDueDate)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{
    generated: number
    skipped: number
    errors: Array<{ contract_id: string; customer_name: string; reason: string }>
  } | null>(null)
  const [error, setError] = useState<string | null>(null)

  function handleOpen() {
    setOpen(true)
    setResult(null)
    setError(null)
  }

  function handleClose() {
    setOpen(false)
    setResult(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    const res = await bulkGenerateInvoices({
      billing_month: billingMonth,
      issue_date: issueDate,
      due_date: dueDate || undefined,
      notes: notes || undefined,
    })

    setLoading(false)

    if (!res.success) {
      setError(res.error)
    } else {
      setResult(res.data)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium px-4 py-2 rounded-md"
      >
        一括発行
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">当月分まとめて発行</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {result ? (
              /* 完了表示 */
              <div className="px-6 py-5 space-y-4">
                <div className={`rounded-lg border p-4 ${result.generated > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
                  <p className={`text-sm font-semibold mb-1 ${result.generated > 0 ? 'text-green-800' : 'text-yellow-800'}`}>
                    一括発行完了
                  </p>
                  <div className="text-sm space-y-0.5">
                    <p className="text-green-700">✓ {result.generated}件 生成しました（下書き）</p>
                    {result.skipped > 0 && (
                      <p className="text-yellow-700">— {result.skipped}件 スキップ（既に作成済み）</p>
                    )}
                    {result.errors.length > 0 && (
                      <p className="text-red-600">✗ {result.errors.length}件 エラー</p>
                    )}
                  </div>
                </div>

                {result.errors.length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <p className="text-xs font-semibold text-red-700 mb-1">エラー詳細</p>
                    <ul className="space-y-0.5">
                      {result.errors.map((e) => (
                        <li key={e.contract_id} className="text-xs text-red-600">
                          {e.customer_name}: {e.reason}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                  >
                    閉じる
                  </button>
                </div>
              </div>
            ) : (
              /* 入力フォーム */
              <form onSubmit={handleSubmit}>
                <div className="px-6 py-5 space-y-4">
                  <p className="text-xs text-gray-500 leading-relaxed">
                    アクティブな全契約に対して、指定した請求月の請求書を一括で<strong>下書き</strong>として生成します。<br />
                    既に同月の請求書が存在する契約はスキップされます。
                  </p>

                  {/* 請求月 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      請求月 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="month"
                      required
                      value={billingMonth}
                      onChange={(e) => setBillingMonth(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 発行日 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      発行日 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 支払期限 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      支払期限
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* 備考 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      備考（全請求書共通）
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={2}
                      placeholder="振込先などの共通メモがあれば入力"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>

                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      {error}
                    </div>
                  )}
                </div>

                {/* フッター */}
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? '生成中…' : '一括発行（下書き）'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
