'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { inviteStaff } from '@/actions/staff-actions'
import { StaffRole } from '@/types'
import { STAFF_ROLE_LABELS } from '@/lib/constants'

export function InviteStaffForm() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<StaffRole>('staff')

  function handleOpen() {
    setOpen(true)
    setName('')
    setEmail('')
    setPassword('')
    setRole('staff')
    setError(null)
    setSuccess(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim() || !email.trim() || !password) {
      setError('全ての項目を入力してください')
      return
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上にしてください')
      return
    }
    setLoading(true)
    setError(null)

    const result = await inviteStaff({ name: name.trim(), email: email.trim(), password, role })
    setLoading(false)

    if (!result.success) {
      setError(result.error)
      return
    }

    setSuccess(true)
    router.refresh()
  }

  const inputClass =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <>
      <button onClick={handleOpen}
        className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">
        + スタッフを追加
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm mx-4">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">スタッフを追加</h2>
            </div>

            {success ? (
              <div className="px-6 py-8 text-center">
                <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-base font-semibold text-gray-900 mb-1">追加完了</p>
                <p className="text-sm text-gray-500 mb-4">{email} にログイン情報を伝えてください</p>
                <button onClick={() => setOpen(false)}
                  className="px-6 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700">
                  閉じる
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
                )}

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    名前 <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="山田 太郎" className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    メールアドレス <span className="text-red-500">*</span>
                  </label>
                  <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                    placeholder="staff@example.com" className={inputClass} />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    初期パスワード <span className="text-red-500">*</span>
                  </label>
                  <input type="text" required value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="6文字以上" className={inputClass} />
                  <p className="text-xs text-gray-400 mt-1">本人にパスワードを伝えてください</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">ロール</label>
                  <select value={role} onChange={(e) => setRole(e.target.value as StaffRole)} className={inputClass}>
                    {(['staff', 'viewer'] as StaffRole[]).map((r) => (
                      <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-3 pt-2">
                  <button type="submit" disabled={loading}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-medium py-2 rounded-md">
                    {loading ? '追加中…' : '追加する'}
                  </button>
                  <button type="button" onClick={() => setOpen(false)}
                    className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2 rounded-md">
                    キャンセル
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
