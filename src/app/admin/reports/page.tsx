import Link from 'next/link'
import { getReportSummary } from '@/actions/report-actions'
import { formatCurrency } from '@/lib/utils'

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { year?: string }
}) {
  const currentYear = new Date().getFullYear()
  const year = parseInt(searchParams.year || '') || currentYear
  const report = await getReportSummary(year)

  // グラフ用の最大値
  const maxAmount = Math.max(
    ...report.monthlyBreakdown.map((m) => Math.max(m.invoiced, m.paid)),
    1
  )

  return (
    <div className="p-6">
      {/* ヘッダー */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">会計レポート</h1>
          <p className="text-sm text-gray-500 mt-1">{year}年の売上・入金状況</p>
        </div>
        {/* 年選択 + エクスポート */}
        <div className="flex items-center gap-2">
          <a
            href={`/api/reports/export?year=${year}`}
            className="flex items-center gap-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium px-3 py-1.5 rounded-md"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            CSV
          </a>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/admin/reports?year=${year - 1}`}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
          >
            ← {year - 1}
          </Link>
          <span className="text-lg font-bold text-gray-900 px-3">{year}年</span>
          <Link
            href={`/admin/reports?year=${year + 1}`}
            className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-600 hover:bg-gray-50"
          >
            {year + 1} →
          </Link>
        </div>
      </div>

      {/* KPI */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">年間請求額</p>
          <p className="text-xl font-bold text-gray-900">{formatCurrency(report.totalRevenue)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">年間入金額</p>
          <p className="text-xl font-bold text-green-600">{formatCurrency(report.totalPaid)}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">未回収残高</p>
          <p className={`text-xl font-bold ${report.totalOutstanding > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
            {formatCurrency(report.totalOutstanding)}
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">アクティブ契約</p>
          <p className="text-xl font-bold text-blue-600">{report.activeContracts}件</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <p className="text-xs font-medium text-gray-500 mb-1">進行中イベント</p>
          <p className="text-xl font-bold text-purple-600">{report.activeEvents}件</p>
        </div>
      </div>

      {/* 月次グラフ（CSSバーチャート） */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">月次推移</h2>
        <div className="flex items-center gap-4 mb-4 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-blue-400"></span> 請求額
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded bg-green-400"></span> 入金額
          </span>
        </div>
        <div className="flex items-end gap-2 h-48">
          {report.monthlyBreakdown.map((m) => {
            const invoicedH = maxAmount > 0 ? (m.invoiced / maxAmount) * 100 : 0
            const paidH = maxAmount > 0 ? (m.paid / maxAmount) * 100 : 0
            const monthLabel = m.month.split('-')[1]
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex gap-0.5 items-end h-40">
                  <div
                    className="flex-1 bg-blue-400 rounded-t transition-all"
                    style={{ height: `${invoicedH}%`, minHeight: invoicedH > 0 ? '4px' : '0' }}
                    title={`請求: ${formatCurrency(m.invoiced)}`}
                  />
                  <div
                    className="flex-1 bg-green-400 rounded-t transition-all"
                    style={{ height: `${paidH}%`, minHeight: paidH > 0 ? '4px' : '0' }}
                    title={`入金: ${formatCurrency(m.paid)}`}
                  />
                </div>
                <span className="text-xs text-gray-500">{monthLabel}月</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* 月次テーブル */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-5 py-3 text-left font-medium text-gray-600">月</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">請求額（税込）</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">入金額</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">未回収</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">回収率</th>
            </tr>
          </thead>
          <tbody>
            {report.monthlyBreakdown.map((m) => {
              const rate = m.invoiced > 0 ? Math.round((m.paid / m.invoiced) * 100) : 0
              const monthNum = parseInt(m.month.split('-')[1])
              return (
                <tr key={m.month} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-5 py-3 font-medium text-gray-900">{monthNum}月</td>
                  <td className="px-4 py-3 text-right text-gray-900">
                    {m.invoiced > 0 ? formatCurrency(m.invoiced) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-green-600">
                    {m.paid > 0 ? formatCurrency(m.paid) : '—'}
                  </td>
                  <td className={`px-4 py-3 text-right ${m.outstanding > 0 ? 'text-amber-600 font-medium' : 'text-gray-400'}`}>
                    {m.outstanding > 0 ? formatCurrency(m.outstanding) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.invoiced > 0 ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                        ${rate >= 100 ? 'bg-green-100 text-green-800' :
                          rate > 0 ? 'bg-amber-100 text-amber-800' :
                          'bg-gray-100 text-gray-600'}`}>
                        {rate}%
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 border-t border-gray-200 font-bold">
              <td className="px-5 py-3 text-gray-900">合計</td>
              <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(report.totalRevenue)}</td>
              <td className="px-4 py-3 text-right text-green-600">{formatCurrency(report.totalPaid)}</td>
              <td className={`px-4 py-3 text-right ${report.totalOutstanding > 0 ? 'text-amber-600' : 'text-gray-900'}`}>
                {formatCurrency(report.totalOutstanding)}
              </td>
              <td className="px-4 py-3 text-right">
                {report.totalRevenue > 0 ? (
                  <span className="text-sm">
                    {Math.round((report.totalPaid / report.totalRevenue) * 100)}%
                  </span>
                ) : '—'}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
