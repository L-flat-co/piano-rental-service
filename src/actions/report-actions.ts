'use server'

import { createClient } from '@/lib/supabase/server'

export interface MonthlyRevenue {
  month: string        // "2026-01"
  invoiced: number     // 請求額合計（税込）
  paid: number         // 入金額合計（税込）
  outstanding: number  // 未回収額
}

export interface ReportSummary {
  totalRevenue: number         // 累計請求額（税込）
  totalPaid: number            // 累計入金額
  totalOutstanding: number     // 未回収残高
  activeContracts: number
  activeEvents: number
  monthlyBreakdown: MonthlyRevenue[]
}

export async function getReportSummary(year: number): Promise<ReportSummary> {
  const supabase = await createClient()

  // 請求書を年で取得
  const yearStart = `${year}-01`
  const yearEnd = `${year}-12`

  const { data: invoices } = await supabase
    .from('invoices')
    .select('billing_month, total_amount, status')
    .gte('billing_month', yearStart)
    .lte('billing_month', yearEnd)
    .in('status', ['issued', 'paid'])

  // 入金データを年で取得
  const { data: payments } = await supabase
    .from('payments')
    .select('payment_date, amount')
    .gte('payment_date', `${year}-01-01`)
    .lte('payment_date', `${year}-12-31`)

  // アクティブ契約/イベント数
  const { count: activeContracts } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')

  const { count: activeEvents } = await supabase
    .from('event_contracts')
    .select('id', { count: 'exact', head: true })
    .in('status', ['estimate', 'confirmed'])

  // 月別集計
  const monthMap: Record<string, { invoiced: number; paid: number }> = {}
  for (let m = 1; m <= 12; m++) {
    const key = `${year}-${String(m).padStart(2, '0')}`
    monthMap[key] = { invoiced: 0, paid: 0 }
  }

  for (const inv of invoices || []) {
    const key = inv.billing_month
    if (key && monthMap[key]) {
      monthMap[key].invoiced += inv.total_amount
    }
  }

  for (const pay of payments || []) {
    const key = pay.payment_date?.slice(0, 7)
    if (key && monthMap[key]) {
      monthMap[key].paid += pay.amount
    }
  }

  const monthlyBreakdown: MonthlyRevenue[] = Object.entries(monthMap).map(
    ([month, { invoiced, paid }]) => ({
      month,
      invoiced,
      paid,
      outstanding: invoiced - paid,
    })
  )

  const totalRevenue = monthlyBreakdown.reduce((s, m) => s + m.invoiced, 0)
  const totalPaid = monthlyBreakdown.reduce((s, m) => s + m.paid, 0)

  return {
    totalRevenue,
    totalPaid,
    totalOutstanding: totalRevenue - totalPaid,
    activeContracts: activeContracts || 0,
    activeEvents: activeEvents || 0,
    monthlyBreakdown,
  }
}
