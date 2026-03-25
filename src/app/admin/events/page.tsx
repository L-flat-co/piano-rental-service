import Link from 'next/link'
import { getEventContracts } from '@/actions/event-actions'
import { EVENT_STATUS_LABELS, EVENT_STATUS_COLORS, PIANO_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { EventStatus } from '@/types'

export default async function EventsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const query = searchParams.q || ''
  const statusFilter = searchParams.status as EventStatus | undefined
  let events = await getEventContracts(query)

  if (statusFilter) {
    events = events.filter((e) => e.status === statusFilter)
  }

  const statusCounts = {
    estimate: events.filter((e) => e.status === 'estimate').length,
    confirmed: events.filter((e) => e.status === 'confirmed').length,
    completed: events.filter((e) => e.status === 'completed').length,
    cancelled: events.filter((e) => e.status === 'cancelled').length,
  }

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">イベント案件</h1>
          <p className="text-sm text-gray-500 mt-1">{events.length} 件表示</p>
        </div>
        <Link
          href="/admin/events/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + 案件を登録
        </Link>
      </div>

      {/* ステータスフィルタータブ */}
      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {([undefined, 'estimate', 'confirmed', 'completed', 'cancelled'] as (EventStatus | undefined)[]).map(
          (s) => {
            const label = s ? EVENT_STATUS_LABELS[s] : 'すべて'
            const count = s ? statusCounts[s] : events.length
            const href = s
              ? `/admin/events${query ? `?q=${query}&` : '?'}status=${s}`
              : `/admin/events${query ? `?q=${query}` : ''}`
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
                <span className={`ml-1 ${isActive ? 'text-blue-100' : 'text-gray-400'}`}>
                  {count}
                </span>
              </Link>
            )
          }
        )}
      </div>

      {/* 検索 */}
      <form className="mb-4">
        <div className="relative max-w-xs">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="案件名・顧客名・会場で検索"
            className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <svg
            className="absolute left-2.5 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </form>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {events.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">
            案件が見つかりません
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-5 py-3 font-medium text-gray-600">案件名</th>
                <th className="px-4 py-3 font-medium text-gray-600">顧客</th>
                <th className="px-4 py-3 font-medium text-gray-600">会場</th>
                <th className="px-4 py-3 font-medium text-gray-600">ピアノ</th>
                <th className="px-4 py-3 font-medium text-gray-600">搬入日</th>
                <th className="px-4 py-3 font-medium text-gray-600">搬出日</th>
                <th className="px-4 py-3 font-medium text-gray-600">ステータス</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {events.map((ev) => (
                <tr
                  key={ev.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-5 py-3 font-medium text-gray-900">{ev.event_name}</td>
                  <td className="px-4 py-3 text-gray-700">
                    {ev.customer?.name || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{ev.venue || '—'}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {ev.piano
                      ? `${ev.piano.maker} ${ev.piano.model}`
                      : PIANO_TYPE_LABELS[ev.piano_type]}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {ev.delivery_date ? formatDate(ev.delivery_date) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {ev.pickup_date ? formatDate(ev.pickup_date) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${EVENT_STATUS_COLORS[ev.status]}`}
                    >
                      {EVENT_STATUS_LABELS[ev.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/events/${ev.id}`}
                      className="text-blue-600 hover:underline text-xs"
                    >
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
