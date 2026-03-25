import Link from 'next/link'
import { getPianos } from '@/actions/piano-actions'
import { PIANO_TYPE_LABELS, PIANO_STATUS_LABELS, PIANO_STATUS_COLORS } from '@/lib/constants'
import { PianoStatus } from '@/types'

export default async function PianosPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string }
}) {
  const query = searchParams.q || ''
  const pianos = await getPianos(query)

  // ステータスフィルタ（クライアントサイドではなくURLパラメータで管理）
  const statusFilter = searchParams.status as PianoStatus | undefined
  const filtered = statusFilter
    ? pianos.filter((p) => p.status === statusFilter)
    : pianos

  // 稼働率サマリー
  const total = pianos.length
  const rented = pianos.filter((p) => p.status === 'rented').length
  const available = pianos.filter((p) => p.status === 'available').length
  const maintenance = pianos.filter((p) => p.status === 'maintenance').length

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ピアノ管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            全{total}台 / 貸出中{rented}台 / 在庫{available}台 / メンテ{maintenance}台
          </p>
        </div>
        <Link
          href="/admin/pianos/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md"
        >
          + ピアノを追加
        </Link>
      </div>

      {/* 検索・フィルタ */}
      <form className="flex flex-wrap gap-3 mb-4">
        <input
          type="text"
          name="q"
          defaultValue={query}
          placeholder="メーカー・機種・シリアルで検索..."
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
        />
        <select
          name="status"
          defaultValue={statusFilter || ''}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">すべてのステータス</option>
          <option value="available">在庫あり</option>
          <option value="rented">貸出中</option>
          <option value="maintenance">メンテナンス中</option>
          <option value="disposed">廃棄</option>
        </select>
        <button
          type="submit"
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm rounded-md"
        >
          絞り込む
        </button>
      </form>

      {/* テーブル */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400 text-sm">
          {query ? `"${query}" の検索結果はありません` : 'ピアノが登録されていません'}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left px-4 py-3 font-medium text-gray-600">メーカー / 機種</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">シリアル</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">種別</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">オプション</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">保管場所</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((piano) => (
                <tr key={piano.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/pianos/${piano.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {piano.maker} {piano.model}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600 font-mono text-xs">
                    {piano.serial_number || '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {PIANO_TYPE_LABELS[piano.piano_type]}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {piano.is_mute && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-purple-100 text-purple-700">
                          消音
                        </span>
                      )}
                      {piano.is_white && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-600 border">
                          白
                        </span>
                      )}
                      {!piano.is_mute && !piano.is_white && (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{piano.storage_location || '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PIANO_STATUS_COLORS[piano.status]}`}
                    >
                      {PIANO_STATUS_LABELS[piano.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
