import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPiano } from '@/actions/piano-actions'
import { PIANO_TYPE_LABELS, PIANO_STATUS_LABELS, PIANO_STATUS_COLORS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

export default async function PianoDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const piano = await getPiano(params.id)

  if (!piano) {
    notFound()
  }

  return (
    <div className="p-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">
              {piano.maker} {piano.model}
            </h1>
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${PIANO_STATUS_COLORS[piano.status]}`}
            >
              {PIANO_STATUS_LABELS[piano.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {PIANO_TYPE_LABELS[piano.piano_type]}
            {piano.is_mute && ' ・ 消音機能付き'}
            {piano.is_white && ' ・ ホワイトモデル'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/pianos/${piano.id}/edit`}
            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-4 py-2 rounded-md"
          >
            編集
          </Link>
          <Link
            href="/admin/pianos"
            className="text-gray-500 hover:text-gray-700 text-sm px-3 py-2"
          >
            ← 一覧に戻る
          </Link>
        </div>
      </div>

      <div className="space-y-6">
        {/* 詳細情報 */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">詳細情報</h2>
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                シリアル番号
              </dt>
              <dd className="mt-1 text-sm text-gray-900 font-mono">
                {piano.serial_number || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">種別</dt>
              <dd className="mt-1 text-sm text-gray-900">{PIANO_TYPE_LABELS[piano.piano_type]}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                オプション
              </dt>
              <dd className="mt-1 text-sm text-gray-900">
                {[piano.is_mute && '消音機能付き', piano.is_white && 'ホワイトモデル']
                  .filter(Boolean)
                  .join('・') || '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                保管場所
              </dt>
              <dd className="mt-1 text-sm text-gray-900">{piano.storage_location || '—'}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">購入日</dt>
              <dd className="mt-1 text-sm text-gray-900">
                {piano.purchase_date ? formatDate(piano.purchase_date) : '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-gray-500 uppercase tracking-wide">登録日</dt>
              <dd className="mt-1 text-sm text-gray-900">{formatDate(piano.created_at)}</dd>
            </div>
          </dl>
        </div>

        {/* メモ */}
        {piano.memo && (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-3">メモ</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{piano.memo}</p>
          </div>
        )}

        {/* 貸出履歴（契約管理実装後に充実させる） */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">貸出履歴</h2>
          <p className="text-sm text-gray-400 text-center py-6">貸出データはありません</p>
        </div>
      </div>
    </div>
  )
}
