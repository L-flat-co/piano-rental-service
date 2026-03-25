import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getEventContract } from '@/actions/event-actions'
import {
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
  PIANO_TYPE_LABELS,
} from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { EventStatusButtons } from '@/components/events/EventStatusButtons'

export default async function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const event = await getEventContract(params.id)

  if (!event) {
    notFound()
  }

  const isActive = event.status === 'estimate' || event.status === 'confirmed'

  return (
    <div className="p-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{event.event_name}</h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${EVENT_STATUS_COLORS[event.status]}`}
            >
              {EVENT_STATUS_LABELS[event.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {event.customer?.name}
            {event.venue ? ` / ${event.venue}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isActive && (
            <Link
              href={`/admin/events/${event.id}/edit`}
              className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md"
            >
              編集
            </Link>
          )}
          <Link
            href="/admin/events"
            className="text-gray-500 hover:text-gray-700 text-sm px-3 py-2"
          >
            ← 一覧に戻る
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* メインコンテンツ */}
        <div className="lg:col-span-2 space-y-6">
          {/* 案件情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">案件情報</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">会場</dt>
                <dd className="mt-1 text-sm text-gray-900">{event.venue || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">ピアノ種別</dt>
                <dd className="mt-1 text-sm text-gray-900">{PIANO_TYPE_LABELS[event.piano_type]}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">搬入日</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {event.delivery_date ? formatDate(event.delivery_date) : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">搬出日</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {event.pickup_date ? formatDate(event.pickup_date) : '—'}
                </dd>
              </div>
              {event.cancellation_date && (
                <div>
                  <dt className="text-xs font-medium text-red-500 uppercase tracking-wide">キャンセル日</dt>
                  <dd className="mt-1 text-sm text-red-600">{formatDate(event.cancellation_date)}</dd>
                </div>
              )}
              <div className="col-span-2">
                <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">登録日</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDate(event.created_at)}</dd>
              </div>
            </dl>
          </div>

          {/* ピアノ割当 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">ピアノ割当</h2>
            {event.piano ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {event.piano.maker} {event.piano.model}
                  </p>
                  {event.piano.serial_number && (
                    <p className="text-xs text-gray-500">S/N: {event.piano.serial_number}</p>
                  )}
                </div>
                <Link
                  href={`/admin/pianos/${event.piano.id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  詳細
                </Link>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <p className="text-sm text-gray-400">未割当（{PIANO_TYPE_LABELS[event.piano_type]}）</p>
                {isActive && (
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    割当する
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* メモ */}
          {event.memo && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-3">メモ</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{event.memo}</p>
            </div>
          )}
        </div>

        {/* サイドバー */}
        <div className="space-y-4">
          {/* ステータス */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">ステータス変更</h3>
            <EventStatusButtons
              eventId={event.id}
              currentStatus={event.status}
              deliveryDate={event.delivery_date ?? null}
            />
          </div>

          {/* 顧客情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">顧客</h3>
            {event.customer ? (
              <div className="space-y-1">
                <Link
                  href={`/admin/customers/${event.customer.id}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {event.customer.name}
                </Link>
                {event.customer.company_name && (
                  <p className="text-xs text-gray-500">{event.customer.company_name}</p>
                )}
                {event.customer.email && (
                  <p className="text-xs text-gray-500">{event.customer.email}</p>
                )}
                {event.customer.phone && (
                  <p className="text-xs text-gray-500">{event.customer.phone}</p>
                )}
              </div>
            ) : (
              <p className="text-sm text-gray-400">—</p>
            )}
          </div>

          {/* 請求書 */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">帳票</h3>
            <Link
              href={`/admin/invoices/new?event_contract_id=${event.id}&customer_id=${event.customer_id}`}
              className="block w-full text-center bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-xs font-medium px-3 py-2 rounded-md"
            >
              + 請求書を作成
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
