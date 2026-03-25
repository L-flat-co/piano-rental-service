import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const year = parseInt(request.nextUrl.searchParams.get('year') || '') || new Date().getFullYear()
  const yearStart = `${year}-01-01`
  const yearEnd = `${year}-12-31`

  // 請求書（issued/paid）を取得
  const { data: invoices } = await supabase
    .from('invoices')
    .select('invoice_number, billing_month, issue_date, due_date, subtotal, tax_amount, total_amount, status, customer:customers(name)')
    .gte('issue_date', yearStart)
    .lte('issue_date', yearEnd)
    .in('status', ['issued', 'paid', 'cancelled'])
    .order('issue_date')

  // 入金データ
  const { data: payments } = await supabase
    .from('payments')
    .select('payment_date, amount, payment_method, notes, invoice:invoices(invoice_number), customer:customers(name)')
    .gte('payment_date', yearStart)
    .lte('payment_date', yearEnd)
    .order('payment_date')

  // BOM + ヘッダー
  const BOM = '\uFEFF'

  // --- 請求一覧シート ---
  const invoiceHeaders = [
    '請求書番号', '対象月', '発行日', '支払期限',
    '顧客名', '小計（税抜）', '消費税', '合計（税込）', 'ステータス',
  ]
  const invoiceRows = (invoices || []).map((inv) => {
    const customer = Array.isArray(inv.customer) ? inv.customer[0] : inv.customer
    return [
      inv.invoice_number,
      inv.billing_month || '',
      inv.issue_date,
      inv.due_date || '',
      customer?.name || '',
      inv.subtotal,
      inv.tax_amount,
      inv.total_amount,
      inv.status === 'paid' ? '入金済み' : inv.status === 'issued' ? '発行済み' : 'キャンセル',
    ].join(',')
  })

  // --- 入金一覧シート ---
  const paymentHeaders = [
    '入金日', '入金額', '入金方法', '請求書番号', '顧客名', 'メモ',
  ]
  const methodLabels: Record<string, string> = {
    bank_transfer: '銀行振込',
    cash: '現金',
    card: 'カード',
    other: 'その他',
  }
  const paymentRows = (payments || []).map((pay) => {
    const invoice = Array.isArray(pay.invoice) ? pay.invoice[0] : pay.invoice
    const customer = Array.isArray(pay.customer) ? pay.customer[0] : pay.customer
    return [
      pay.payment_date,
      pay.amount,
      methodLabels[pay.payment_method] || pay.payment_method,
      invoice?.invoice_number || '',
      customer?.name || '',
      `"${(pay.notes || '').replace(/"/g, '""')}"`,
    ].join(',')
  })

  // 2セクションを1ファイルに結合
  const csv = [
    `[請求一覧 ${year}年]`,
    invoiceHeaders.join(','),
    ...invoiceRows,
    '',
    `[入金一覧 ${year}年]`,
    paymentHeaders.join(','),
    ...paymentRows,
  ].join('\n')

  const filename = `accounting_${year}.csv`

  return new NextResponse(BOM + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
