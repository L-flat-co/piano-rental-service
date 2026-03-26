import { getStaffList } from '@/actions/staff-actions'
import { getCurrentStaff } from '@/actions/auth-actions'
import { InviteStaffForm } from '@/components/staff/InviteStaffForm'
import { StaffRow } from '@/components/staff/StaffRow'

export default async function StaffPage() {
  const [staffList, currentStaff] = await Promise.all([
    getStaffList(),
    getCurrentStaff(),
  ])

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">スタッフ管理</h1>
          <p className="text-sm text-gray-500 mt-1">{staffList.length}名</p>
        </div>
        <InviteStaffForm />
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200 text-left">
              <th className="px-5 py-3 font-medium text-gray-600">名前</th>
              <th className="px-4 py-3 font-medium text-gray-600">メール</th>
              <th className="px-4 py-3 font-medium text-gray-600">ロール</th>
              <th className="px-4 py-3 font-medium text-gray-600">状態</th>
              <th className="px-4 py-3 font-medium text-gray-600 w-32">操作</th>
            </tr>
          </thead>
          <tbody>
            {staffList.map((s) => (
              <StaffRow
                key={s.id}
                staff={s}
                isCurrentUser={s.id === currentStaff?.id}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
