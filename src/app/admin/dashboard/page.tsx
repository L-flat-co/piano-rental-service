import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'
import { INVOICE_STATUS_LABELS, CONTRACT_STATUS_LABELS } from '@/lib/constants'
import { getNewApplicationCount } from '@/actions/application-actions'

// ============================================================
// データ取得
// ============================================================

async function getDashboardStats() {
  const supabase = await createClient()

  const [
    { count: activeContracts },
    { count: draftInvoices },
    { count: unpaidInvoices },
    { count: activeEvents },
  ] = await Promise.all([
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
    supabase.from('invoices').select('*', { count: 'exact', head: true }).eq('status', 'issued'),
    supabase.from('event_contracts').select('*', { count: 'exact', head: true })
      .in('status', ['estimate', 'confirmed']),
  ])

  // 今月の請求総額
  const now = new Date()
  const billingMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  const { data: monthlyInvoices } = await supabase
    .from('invoices')
    .select('total_amount')
    .eq('billing_month', billingMonth)
    .neq('status', 'cancelled')

  const monthlyTotal = monthlyInvoices?.reduce((sum, inv) => sum + inv.total_amount, 0) ?? 0

  return {
    activeContracts: activeContracts ?? 0,
    draftInvoices: draftInvoices ?? 0,
    unpaidInvoices: unpaidInvoices ?? 0,
    activeEvents: activeEvents ?? 0,
    monthlyTotal,
  }
}

async function getUnsentInvoices() {
  const supabase = await createClient()
  const { data } = await supabase
    .from('invoices')
    .select('id, invoice_number, issue_date, total_amount, customer:customers(name)')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(5)
  return data || []
}

async function getRecentActivity() {
  const supabase = await createClient()

  const since = new Date()
  since.setDate(since.getDate() - 30)
  const sinceISO = since.toISOString()

  const [invoicesRes, contractsRes] = await Promise.all([
    supabase
      .from('invoices')
      .select('id, invoice_number, status, total_amount, created_at, customer:customers(name)')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('contracts')
      .select('id, status, start_date, created_at, customer:customers(name), piano:pianos(maker, model)')
      .gte('created_at', sinceISO)
      .order('created_at', { ascending: false })
      .limit(8),
  ])

  type ActivityItem = {
    type: 'invoice' | 'contract'
    id: string
    label: string
    sub: string
    badge: string
    badgeColor: string
    href: string
    createdAt: string
  }

  const items: ActivityItem[] = []

  for (const inv of invoicesRes.data || []) {
    const customer = (Array.isArray(inv.customer) ? inv.customer[0] : inv.customer) as { name: string } | null
    items.push({
      type: 'invoice',
      id: inv.id,
      label: `請求書 ${inv.invoice_number}`,
      sub: customer?.name ?? '—',
      badge: INVOICE_STATUS_LABELS[inv.status as keyof typeof INVOICE_STATUS_LABELS] ?? inv.status,
      badgeColor: inv.status === 'paid'
        ? 'bg-green-100 text-green-700'
        : inv.status === 'issued'
        ? 'bg-blue-100 text-blue-700'
        : inv.status === 'cancelled'
        ? 'bg-red-100 text-red-700'
        : 'bg-gray-100 text-gray-600',
      href: `/admin/invoices/${inv.id}`,
      createdAt: inv.created_at,
    })
  }

  for (const con of contractsRes.data || []) {
    const customer = (Array.isArray(con.customer) ? con.customer[0] : con.customer) as { name: string } | null
    const piano = (Array.isArray(con.piano) ? con.piano[0] : con.piano) as { maker: string; model: string } | null
    items.push({
      type: 'contract',
      id: con.id,
      label: `契約 ${piano ? `${piano.maker} ${piano.model}` : '—'}`,
      sub: customer?.name ?? '—',
      badge: CONTRACT_STATUS_LABELS[con.status as keyof typeof CONTRACT_STATUS_LABELS] ?? con.status,
      badgeColor: con.status === 'active'
        ? 'bg-green-100 text-green-700'
        : con.status === 'terminated'
        ? 'bg-gray-100 text-gray-600'
        : 'bg-yellow-100 text-yellow-700',
      href: `/admin/contracts/${con.id}`,
      createdAt: con.created_at,
    })
  }

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  return items.slice(0, 10)
}

// ============================================================
// UI
// ============================================================

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'たった今'
  if (minutes < 60) return `${minutes}分前`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}時間前`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}日前`
  return `${Math.floor(days / 30)}ヶ月前`
}

export default async function DashboardPage() {
  let stats = { activeContracts: 0, draftInvoices: 0, unpaidInvoices: 0, activeEvents: 0, monthlyTotal: 0 }
  let unsentInvoices: Awaited<ReturnType<typeof getUnsentInvoices>> = []
  let activity: Awaited<ReturnType<typeof getRecentActivity>> = []
  let newApplications = 0

  try {
    ;[stats, unsentInvoices, activity, newApplications] = await Promise.all([
      getDashboardStats(),
      getUnsentInvoices(),
      getRecentActivity(),
      getNewApplicationCount(),
    ])
  } catch {
    // DB未設定の場合はゼロ表示
  }

  const kpiCards = [
    {
      label: 'アクティブ契約',
      value: `${stats.activeContracts}件`,
      description: 'ご家庭/教室用 契約中',
      color: 'bg-blue-50 border-blue-200',
      textColor: 'text-blue-700',
      href: '/admin/contracts',
    },
    {
      label: '今月の請求総額',
      value: formatCurrency(stats.monthlyTotal),
      description: '請求書発行済み合計',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
      href: '/admin/invoices',
    },
    {
      label: '未入金',
      value: `${stats.unpaidInvoices}件`,
      description: '入金待ちの請求書',
      color: stats.unpaidInvoices > 0 ? 'bg-yellow-50 border-yellow-300' : 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-700',
      href: '/admin/invoices',
    },
    {
      label: '進行中イベント',
      value: `${stats.activeEvents}件`,
      description: '見積中・確定済み案件',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
      href: '/admin/events',
    },
  ]

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">ピアノレンタル管理システム 概況</p>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-lg border p-5 transition-shadow hover:shadow-md ${card.color}`}
          >
            <div className="text-sm font-medium text-gray-600 mb-1">{card.label}</div>
            <div className={`text-3xl font-bold ${card.textColor}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.description}</div>
          </Link>
        ))}
      </div>

      {/* アラート：新規Web申込 */}
      {newApplications > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-300 rounded-lg p-4 flex items-center gap-3">
          <div className="text-blue-500 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div className="flex-1 text-sm font-semibold text-blue-800">
            新規Web申込が {newApplications}件 あります
          </div>
          <Link href="/admin/applications?status=submitted"
            className="text-xs font-medium text-blue-700 hover:underline whitespace-nowrap">
            確認する →
          </Link>
        </div>
      )}

      {/* アラート：未送付請求書 */}
      {stats.draftInvoices > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-300 rounded-lg p-4 flex items-start gap-3">
          <div className="text-amber-500 mt-0.5 shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-amber-800">
              未送付の請求書が {stats.draftInvoices}件 あります
            </div>
            <div className="text-xs text-amber-700 mt-0.5">
              下書き状態の請求書を確認し、発行処理をしてください。
            </div>
            {unsentInvoices.length > 0 && (
              <ul className="mt-2 space-y-1">
                {unsentInvoices.map((inv) => {
                  const customer = (Array.isArray(inv.customer) ? inv.customer[0] : inv.customer) as { name: string } | null
                  return (
                    <li key={inv.id}>
                      <Link
                        href={`/admin/invoices/${inv.id}`}
                        className="text-xs text-amber-900 underline hover:text-amber-700"
                      >
                        {inv.invoice_number} — {customer?.name ?? '—'} ({formatCurrency(inv.total_amount)})
                      </Link>
                    </li>
                  )
                })}
                {stats.draftInvoices > 5 && (
                  <li className="text-xs text-amber-700">他 {stats.draftInvoices - 5}件…</li>
                )}
              </ul>
            )}
          </div>
          <Link
            href="/admin/invoices"
            className="shrink-0 text-xs px-3 py-1.5 bg-amber-200 text-amber-900 rounded hover:bg-amber-300"
          >
            一覧を見る
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* アクティビティタイムライン */}
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-800">直近のアクティビティ</h2>
            <p className="text-xs text-gray-400 mt-0.5">過去30日間の契約・請求書の作成・変更</p>
          </div>
          <div className="divide-y divide-gray-50">
            {activity.length === 0 ? (
              <div className="px-5 py-8 text-center text-sm text-gray-400">
                アクティビティがありません
              </div>
            ) : (
              activity.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.href}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  {/* アイコン */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                    item.type === 'invoice' ? 'bg-blue-100' : 'bg-green-100'
                  }`}>
                    {item.type === 'invoice' ? (
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    )}
                  </div>
                  {/* 内容 */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-800 truncate">{item.label}</div>
                    <div className="text-xs text-gray-500">{item.sub}</div>
                  </div>
                  {/* バッジ */}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                  {/* 時刻 */}
                  <span className="text-xs text-gray-400 shrink-0 w-16 text-right">
                    {timeAgo(item.createdAt)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* クイックアクション */}
        <div className="flex flex-col gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <h2 className="text-base font-semibold text-gray-800 mb-4">クイックアクション</h2>
            <div className="flex flex-col gap-2">
              <Link
                href="/admin/customers/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                顧客を追加
              </Link>
              <Link
                href="/admin/contracts/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                契約を登録
              </Link>
              <Link
                href="/admin/invoices/new"
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                請求書を発行
              </Link>
              <Link
                href="/admin/invoices"
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                請求書一覧
              </Link>
            </div>
          </div>

          {/* 未入金サマリー */}
          {stats.unpaidInvoices > 0 && (
            <div className="bg-white rounded-lg border border-yellow-200 p-5">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold text-yellow-800">入金待ち</span>
              </div>
              <p className="text-xs text-yellow-700 mb-3">
                発行済みで未入金の請求書が <strong>{stats.unpaidInvoices}件</strong> あります。
              </p>
              <Link
                href="/admin/invoices"
                className="text-xs px-3 py-1.5 bg-yellow-100 text-yellow-900 rounded hover:bg-yellow-200"
              >
                確認する →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
