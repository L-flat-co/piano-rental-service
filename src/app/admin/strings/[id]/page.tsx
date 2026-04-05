import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getStringInstrument, deleteStringInstrument } from '@/actions/string-instrument-actions'
import { STRING_TYPE_LABELS, STRING_SIZE_LABELS, PIANO_STATUS_LABELS, PIANO_STATUS_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import { DeleteButton } from '@/components/shared/DeleteButton'

export default async function StringInstrumentDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const instrument = await getStringInstrument(params.id)
  if (!instrument) notFound()

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-gray-900">
              {instrument.maker} {instrument.model}
            </h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PIANO_STATUS_COLORS[instrument.status]}`}>
              {PIANO_STATUS_LABELS[instrument.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {STRING_TYPE_LABELS[instrument.string_type]} / {instrument.size}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/strings/${instrument.id}/edit`}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md">
            編集
          </Link>
          <Link href="/admin/strings" className="text-gray-500 hover:text-gray-700 text-sm px-3 py-2">
            ← 一覧
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">楽器情報</h2>
          <dl className="grid grid-cols-2 gap-4">
            <div>
              <dt className="text-xs font-medium text-gray-500">種別</dt>
              <dd className="mt-1 text-sm text-gray-900">{STRING_TYPE_LABELS[instrument.string_type]}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">サイズ</dt>
              <dd className="mt-1 text-sm text-gray-900">{STRING_SIZE_LABELS[instrument.size]}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">メーカー</dt>
              <dd className="mt-1 text-sm text-gray-900">{instrument.maker}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">モデル</dt>
              <dd className="mt-1 text-sm text-gray-900">{instrument.model}</dd>
            </div>
            {instrument.serial_number && (
              <div>
                <dt className="text-xs font-medium text-gray-500">シリアル番号</dt>
                <dd className="mt-1 text-sm text-gray-900 font-mono">{instrument.serial_number}</dd>
              </div>
            )}
            <div>
              <dt className="text-xs font-medium text-gray-500">保管場所</dt>
              <dd className="mt-1 text-sm text-gray-900">{instrument.storage_location || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">購入日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {instrument.purchase_date ? formatDate(instrument.purchase_date) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500">登録日</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(instrument.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* 付属品 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-3">付属品</h2>
          {instrument.accessories.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {instrument.accessories.map((a) => (
                <span key={a} className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                  {a}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-400">なし</p>
          )}
        </div>

        {/* メモ */}
        {instrument.memo && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">メモ</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{instrument.memo}</p>
          </div>
        )}

        {/* 削除 */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <DeleteButton
            onDelete={async () => {
              'use server'
              return deleteStringInstrument(instrument.id)
            }}
            redirectTo="/admin/strings"
            confirmMessage={`${instrument.maker} ${instrument.model} (${instrument.size}) を削除しますか？`}
            label="この楽器を削除"
          />
        </div>
      </div>
    </div>
  )
}
