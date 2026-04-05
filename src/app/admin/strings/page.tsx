import Link from 'next/link'
import { getStringInstruments } from '@/actions/string-instrument-actions'
import { STRING_TYPE_LABELS, STRING_SIZE_LABELS, PIANO_STATUS_LABELS, PIANO_STATUS_COLORS } from '@/lib/constants'
import { StringType, PianoStatus } from '@/types'

export default async function StringInstrumentsPage({
  searchParams,
}: {
  searchParams: { q?: string; type?: string; status?: string }
}) {
  const query = searchParams.q || ''
  const typeFilter = searchParams.type as StringType | undefined
  const statusFilter = searchParams.status as PianoStatus | undefined

  const instruments = await getStringInstruments(query, typeFilter, statusFilter)

  const statusCounts = {
    available: instruments.filter((i) => i.status === 'available').length,
    rented: instruments.filter((i) => i.status === 'rented').length,
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">弦楽器管理</h1>
          <p className="text-sm text-gray-500 mt-1">
            {instruments.length}件 / 在庫 {statusCounts.available}件 / 貸出中 {statusCounts.rented}件
          </p>
        </div>
        <Link href="/admin/strings/new"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-md">
          + 楽器を登録
        </Link>
      </div>

      {/* フィルター */}
      <div className="flex items-center gap-3 mb-4">
        <form className="flex items-center gap-2">
          <input type="text" name="q" defaultValue={query} placeholder="メーカー・モデルで検索"
            className="border border-gray-300 rounded-md pl-3 pr-3 py-2 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          <select name="type" defaultValue={typeFilter || ''}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">全種別</option>
            {(Object.keys(STRING_TYPE_LABELS) as StringType[]).map((k) => (
              <option key={k} value={k}>{STRING_TYPE_LABELS[k]}</option>
            ))}
          </select>
          <select name="status" defaultValue={statusFilter || ''}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">全ステータス</option>
            {(Object.keys(PIANO_STATUS_LABELS) as PianoStatus[]).map((k) => (
              <option key={k} value={k}>{PIANO_STATUS_LABELS[k]}</option>
            ))}
          </select>
          <button type="submit" className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-md">絞り込む</button>
        </form>
      </div>

      {/* テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {instruments.length === 0 ? (
          <div className="px-6 py-16 text-center text-gray-400 text-sm">楽器が見つかりません</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-left">
                <th className="px-5 py-3 font-medium text-gray-600">メーカー / モデル</th>
                <th className="px-4 py-3 font-medium text-gray-600">種別</th>
                <th className="px-4 py-3 font-medium text-gray-600">サイズ</th>
                <th className="px-4 py-3 font-medium text-gray-600">付属品</th>
                <th className="px-4 py-3 font-medium text-gray-600">ステータス</th>
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {instruments.map((inst) => (
                <tr key={inst.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-gray-900">{inst.maker} {inst.model}</p>
                    {inst.serial_number && (
                      <p className="text-xs text-gray-400 font-mono">S/N: {inst.serial_number}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-700">{STRING_TYPE_LABELS[inst.string_type]}</td>
                  <td className="px-4 py-3 text-gray-700">{inst.size}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{inst.accessories.join('・') || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${PIANO_STATUS_COLORS[inst.status]}`}>
                      {PIANO_STATUS_LABELS[inst.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/admin/strings/${inst.id}`} className="text-blue-600 hover:underline text-xs">詳細</Link>
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
