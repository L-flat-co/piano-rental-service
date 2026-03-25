'use client'

import { useState } from 'react'
import { sendInvoiceEmail } from '@/actions/email-actions'

interface SendEmailButtonProps {
  invoiceId: string
  defaultTo?: string
  defaultSubject?: string
  defaultMessage?: string
}

export function SendEmailButton({ invoiceId, defaultTo, defaultSubject, defaultMessage }: SendEmailButtonProps) {
  const [open, setOpen] = useState(false)
  const [to, setTo] = useState(defaultTo || '')
  const [subject, setSubject] = useState(defaultSubject || '')
  const [message, setMessage] = useState(defaultMessage || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sent, setSent] = useState(false)

  function handleOpen() {
    setOpen(true)
    setTo(defaultTo || '')
    setSubject(defaultSubject || '')
    setMessage(defaultMessage || '')
    setError(null)
    setSent(false)
  }

  function handleClose() {
    setOpen(false)
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!to) {
      setError('送信先メールアドレスを入力してください')
      return
    }
    setLoading(true)
    setError(null)

    const result = await sendInvoiceEmail(invoiceId, {
      to,
      subject: subject || undefined,
      message: message || undefined,
    })

    setLoading(false)

    if (!result.success) {
      setError(result.error)
    } else {
      setSent(true)
    }
  }

  return (
    <>
      <button
        onClick={handleOpen}
        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-md"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
        メール送信
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
            {/* ヘッダー */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">請求書をメール送信</h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            {sent ? (
              /* 送信完了 */
              <div className="px-6 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-gray-900 mb-1">送信完了</p>
                <p className="text-sm text-gray-500 mb-6">{to} にメールを送信しました</p>
                <button
                  onClick={handleClose}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700"
                >
                  閉じる
                </button>
              </div>
            ) : (
              /* 送信フォーム */
              <form onSubmit={handleSend}>
                <div className="px-6 py-5 space-y-4">
                  {/* 送信先 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      送信先 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="customer@example.com"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    {!defaultTo && (
                      <p className="text-xs text-yellow-600 mt-1">
                        ⚠ 顧客にメールアドレスが登録されていません
                      </p>
                    )}
                  </div>

                  {/* 件名 */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      件名
                      <span className="text-gray-400 font-normal ml-1">（空欄で自動生成）</span>
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="例: 【請求書】2026年3月分 ¥5,500"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* メッセージ */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      追加メッセージ
                      <span className="text-gray-400 font-normal ml-1">（任意）</span>
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={3}
                      placeholder="振込先やお願い事項などを入力（請求書本文に追記されます）"
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
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    {loading ? '送信中…' : '送信する'}
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
