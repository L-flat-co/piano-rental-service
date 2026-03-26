'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { updateStaff, resetStaffPassword } from '@/actions/staff-actions'
import { Staff, StaffRole } from '@/types'
import { STAFF_ROLE_LABELS } from '@/lib/constants'

interface Props {
  staff: Staff
  isCurrentUser: boolean
}

export function StaffRow({ staff, isCurrentUser }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [resetMsg, setResetMsg] = useState<string | null>(null)

  async function handleRoleChange(role: StaffRole) {
    setLoading(true)
    await updateStaff(staff.id, { role })
    router.refresh()
    setLoading(false)
  }

  async function handleToggleActive() {
    setLoading(true)
    await updateStaff(staff.id, { is_active: !staff.is_active })
    router.refresh()
    setLoading(false)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) { setResetMsg('6文字以上にしてください'); return }
    setLoading(true)
    const result = await resetStaffPassword(staff.id, newPassword)
    setLoading(false)
    if (result.success) {
      setResetMsg('パスワードを変更しました')
      setNewPassword('')
      setTimeout(() => { setResetOpen(false); setResetMsg(null) }, 1500)
    } else {
      setResetMsg(result.error)
    }
  }

  return (
    <>
      <tr className="border-b border-gray-100 hover:bg-gray-50">
        <td className="px-5 py-3">
          <p className="font-medium text-gray-900">
            {staff.name}
            {isCurrentUser && <span className="ml-1.5 text-xs text-blue-600">（自分）</span>}
          </p>
        </td>
        <td className="px-4 py-3 text-gray-600 text-sm">{staff.email}</td>
        <td className="px-4 py-3">
          {isCurrentUser || staff.role === 'owner' ? (
            <span className="text-sm text-gray-900">{STAFF_ROLE_LABELS[staff.role]}</span>
          ) : (
            <select
              value={staff.role}
              onChange={(e) => handleRoleChange(e.target.value as StaffRole)}
              disabled={loading}
              className="border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              {(['staff', 'viewer'] as StaffRole[]).map((r) => (
                <option key={r} value={r}>{STAFF_ROLE_LABELS[r]}</option>
              ))}
            </select>
          )}
        </td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
            staff.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
          }`}>
            {staff.is_active ? '有効' : '無効'}
          </span>
        </td>
        <td className="px-4 py-3">
          {!isCurrentUser && staff.role !== 'owner' && (
            <div className="flex items-center gap-2">
              <button onClick={handleToggleActive} disabled={loading}
                className="text-xs text-gray-500 hover:text-gray-700">
                {staff.is_active ? '無効にする' : '有効にする'}
              </button>
              <button onClick={() => { setResetOpen(true); setResetMsg(null); setNewPassword('') }}
                className="text-xs text-blue-600 hover:text-blue-800">
                PW変更
              </button>
            </div>
          )}
        </td>
      </tr>

      {/* パスワードリセットモーダル */}
      {resetOpen && (
        <tr>
          <td colSpan={5} className="px-5 py-3 bg-blue-50">
            <form onSubmit={handleResetPassword} className="flex items-center gap-3">
              <span className="text-xs text-gray-600">{staff.name} の新しいパスワード:</span>
              <input type="text" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                placeholder="6文字以上" className="border border-gray-300 rounded px-2 py-1 text-xs w-32 focus:outline-none focus:ring-1 focus:ring-blue-400" />
              <button type="submit" disabled={loading}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50">
                変更
              </button>
              <button type="button" onClick={() => setResetOpen(false)} className="text-xs text-gray-500">キャンセル</button>
              {resetMsg && <span className="text-xs text-green-600">{resetMsg}</span>}
            </form>
          </td>
        </tr>
      )}
    </>
  )
}
