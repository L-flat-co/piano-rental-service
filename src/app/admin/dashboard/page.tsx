import { createClient } from '@/lib/supabase/server'
import { formatCurrency } from '@/lib/utils'

async function getDashboardStats() {
  const supabase = await createClient()

  const [
    { count: activeContracts },
    { count: unpaidInvoices },
    { count: activeEvents },
  ] = await Promise.all([
    supabase.from('contracts').select('*', { count: 'exact', head: true }).eq('status', 'active'),
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
    unpaidInvoices: unpaidInvoices ?? 0,
    activeEvents: activeEvents ?? 0,
    monthlyTotal,
  }
}

export default async function DashboardPage() {
  let stats = { activeContracts: 0, unpaidInvoices: 0, activeEvents: 0, monthlyTotal: 0 }

  try {
    stats = await getDashboardStats()
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
    },
    {
      label: '今月の請求総額',
      value: formatCurrency(stats.monthlyTotal),
      description: '請求書発行済み合計',
      color: 'bg-green-50 border-green-200',
      textColor: 'text-green-700',
    },
    {
      label: '未入金',
      value: `${stats.unpaidInvoices}件`,
      description: '入金待ちの請求書',
      color: 'bg-yellow-50 border-yellow-200',
      textColor: 'text-yellow-700',
    },
    {
      label: '進行中イベント',
      value: `${stats.activeEvents}件`,
      description: '見積中・確定済み案件',
      color: 'bg-purple-50 border-purple-200',
      textColor: 'text-purple-700',
    },
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ダッシュボード</h1>
        <p className="text-sm text-gray-500 mt-1">ピアノレンタル管理システム 概況</p>
      </div>

      {/* KPIカード */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {kpiCards.map((card) => (
          <div
            key={card.label}
            className={`rounded-lg border p-5 ${card.color}`}
          >
            <div className="text-sm font-medium text-gray-600 mb-1">{card.label}</div>
            <div className={`text-3xl font-bold ${card.textColor}`}>{card.value}</div>
            <div className="text-xs text-gray-500 mt-1">{card.description}</div>
          </div>
        ))}
      </div>

      {/* クイックアクション */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <h2 className="text-base font-semibold text-gray-800 mb-4">クイックアクション</h2>
        <div className="flex flex-wrap gap-3">
          <a
            href="/admin/customers/new"
            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
          >
            + 顧客を追加
          </a>
          <a
            href="/admin/contracts/new"
            className="px-4 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 transition-colors"
          >
            + 契約を登録
          </a>
          <a
            href="/admin/events/new"
            className="px-4 py-2 bg-purple-600 text-white text-sm rounded-md hover:bg-purple-700 transition-colors"
          >
            + イベント案件を作成
          </a>
          <a
            href="/admin/invoices"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200 transition-colors"
          >
            請求書を確認
          </a>
        </div>
      </div>

      {/* お知らせ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-800 mb-3">システム情報</h2>
        <p className="text-sm text-gray-500">
          ピアノレンタル管理システムへようこそ。
          顧客・契約・帳票管理をこちらの画面で一元管理できます。
        </p>
      </div>
    </div>
  )
}
