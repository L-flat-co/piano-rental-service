import Link from 'next/link'
import { getApplications } from '@/actions/application-actions'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/lib/constants-applications'
import { CONTRACT_PERIOD_LABELS, PIANO_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { ApplicationStatus } from '@/types'

export default async function ApplicationsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const query = searchParams.q || ''
  const statusFilter = searchParams.status as ApplicationStatus | undefined
  let applications = await getApplications(query)

  if (statusFilter) {
    applications = applications.filter((a) => a.status === statusFilter)
  }

  const submittedCount = applications.filter((a) => a.status === 'submitted').length

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Web申込</h1>
          <p className="text-sm text-gray-500 mt-1">
            {applications.length}件表示
            {submittedCount > 0 && (
              <span className="ml-2 text-blue-600 font-medium">（新規 {submittedCount}件）</span>
            )}
          </p>
        </div>
      </div>

      {/* ステータスタブ */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {([undefined, 'submitted', 'reviewing', 'approved', 'converted', 'rejected'] as (ApplicationStatus | undefined)[]).map(
          (s) => {
            const label = s ? APPLICATION_STATUS_LABELS[s] : 'すべて'
            const href = s
              ? `/admin/applications${query ? `?q=${query}&` : '?'}status=${s}`
              : `/admin/applications${query ? `?q=${query}` : ''}`
            const isActive = statusFilter === s

            return (
              <Link
                key={s ?? 'all'}
                href={href}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                  isActive
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                }`}
              >
                {label}
              </Link>
            )
          }
        )}
      </div>

      {/* 検索 */}
      <form className="mb-4">
        <div className="relative max-w-xs">
          <input type="text" name="q" defaultValue={query}
            placeholder="氏名・メール・法人名で検索"
            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <svg className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </form>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {applications.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">申込がありません</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-5 py-3 font-medium text-gray-600">申込者</th>
                <th className="px-4 py-3 font-medium text-gray-600">メール</th>
                <th className="px-4 py-3 font-medium text-gray-600">プラン</th>
                <th className="px-4 py-3 font-medium text-gray-600">ピアノ</th>
                <th className="px-4 py-3 font-medium text-gray-600">申込日</th>
                <th className="px-4 py-3 font-medium text-gray-600">ステータス</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {applications.map((app) => (
                <tr key={app.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{app.applicant_name}</p>
                    {app.company_name && (
                      <p className="text-xs text-gray-500">{app.company_name}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{app.applicant_email}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {app.plan_type === 'home' ? '家庭' : '教室'} / {CONTRACT_PERIOD_LABELS[app.contract_period]}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{PIANO_TYPE_LABELS[app.piano_type]}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{formatDate(app.created_at)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${APPLICATION_STATUS_COLORS[app.status]}`}>
                      {APPLICATION_STATUS_LABELS[app.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/applications/${app.id}`} className="text-blue-600 hover:underline text-xs">
                      詳細
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
