import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { resend, FROM_EMAIL } from '@/lib/resend'

export const runtime = 'nodejs'

// ============================================================
// 月次請求書自動生成 + メール送信
// Vercel Cron で毎日実行。今日が発行日に該当する契約の請求書を生成。
// ============================================================

export async function GET(request: NextRequest) {
  // CRON_SECRET による認証
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const today = new Date()
  const todayDay = today.getDate()
  const billingMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const log: string[] = []
  log.push(`[Cron] Monthly billing started: ${today.toISOString()}`)

  try {
    // システム設定を取得
    const { data: settings } = await supabase
      .from('system_settings')
      .select('invoice_due_days, bank_info, company_name')
      .single()
    const invoiceDueDays = settings?.invoice_due_days ?? 14

    // 全アクティブ契約を取得
    const { data: contracts, error: contractError } = await supabase
      .from('contracts')
      .select('*, customer:customers(id, name, email), plan:rental_plans(name, monthly_fee)')
      .eq('status', 'active')

    if (contractError || !contracts) {
      log.push(`[Cron] Error fetching contracts: ${contractError?.message}`)
      return NextResponse.json({ log }, { status: 500 })
    }

    log.push(`[Cron] Active contracts: ${contracts.length}`)

    let generated = 0
    let emailed = 0
    let skipped = 0

    for (const contract of contracts) {
      // 支払期限日 = start_date の日 - 1（最小1）
      const startDay = new Date(contract.start_date).getDate()
      const dueDay = Math.max(Math.min(startDay, 28) - 1, 1)

      // 発行日 = 支払期限日 - invoice_due_days
      // 月をまたぐ場合を考慮
      const dueDateThisMonth = new Date(today.getFullYear(), today.getMonth(), dueDay)
      const issueDateThisMonth = new Date(dueDateThisMonth)
      issueDateThisMonth.setDate(issueDateThisMonth.getDate() - invoiceDueDays)
      const issueDay = issueDateThisMonth.getDate()
      const issueMonth = issueDateThisMonth.getMonth()

      // 今日が発行日でなければスキップ
      if (todayDay !== issueDay || today.getMonth() !== issueMonth) {
        continue
      }

      // 対象月の請求書が既に存在するかチェック（重複防止）
      const targetBillingMonth = `${dueDateThisMonth.getFullYear()}-${String(dueDateThisMonth.getMonth() + 1).padStart(2, '0')}`
      const { count: existingCount } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .eq('contract_id', contract.id)
        .eq('billing_month', targetBillingMonth)
        .like('invoice_number', 'INV-%')

      if (existingCount && existingCount > 0) {
        log.push(`[Cron] Skip ${contract.id}: ${targetBillingMonth} already exists`)
        skipped++
        continue
      }

      // プラン情報
      const plan = Array.isArray(contract.plan) ? contract.plan[0] : contract.plan
      const customer = Array.isArray(contract.customer) ? contract.customer[0] : contract.customer

      if (!plan || !customer) {
        log.push(`[Cron] Skip ${contract.id}: missing plan or customer`)
        skipped++
        continue
      }

      // オプション取得
      let optionsFee = 0
      const optionItems: { name: string; monthly_fee: number }[] = []
      if (contract.option_ids && contract.option_ids.length > 0) {
        const { data: opts } = await supabase
          .from('rental_options')
          .select('name, monthly_fee')
          .in('id', contract.option_ids)
        if (opts) {
          for (const o of opts) {
            optionsFee += o.monthly_fee
            optionItems.push(o)
          }
        }
      }

      // カスタムオプション
      const customOptions = contract.custom_options || []
      const customOptionsFee = customOptions.reduce((s: number, o: { monthly_fee: number }) => s + o.monthly_fee, 0)

      // 月額合計
      const monthlyTotal = plan.monthly_fee + optionsFee + customOptionsFee

      // 明細行構築
      const lineItems: Array<{
        label: string; unit_price: number; quantity: number; amount: number; sort_order: number
      }> = []
      let sortOrder = 1

      // プラン
      const planExTax = Math.round(plan.monthly_fee / 1.1)
      lineItems.push({
        label: plan.name,
        unit_price: planExTax,
        quantity: 1,
        amount: planExTax,
        sort_order: sortOrder++,
      })

      // オプション
      for (const opt of optionItems) {
        const exTax = Math.round(opt.monthly_fee / 1.1)
        lineItems.push({
          label: opt.name,
          unit_price: exTax,
          quantity: 1,
          amount: exTax,
          sort_order: sortOrder++,
        })
      }

      // カスタムオプション
      for (const co of customOptions) {
        const exTax = Math.round(co.monthly_fee / 1.1)
        lineItems.push({
          label: co.name,
          unit_price: exTax,
          quantity: 1,
          amount: exTax,
          sort_order: sortOrder++,
        })
      }

      const subtotal = lineItems.reduce((s, item) => s + item.amount, 0)
      const taxAmount = Math.round(subtotal * 0.1)
      const totalAmount = subtotal + taxAmount

      // 請求書番号生成
      const ym = targetBillingMonth.replace('-', '')
      const prefix = `INV-${ym}-`
      const { count: invCount } = await supabase
        .from('invoices')
        .select('id', { count: 'exact', head: true })
        .like('invoice_number', `${prefix}%`)
      const seq = String((invCount || 0) + 1).padStart(3, '0')
      const invoiceNumber = `${prefix}${seq}`

      // 日付
      const issueDate = today.toISOString().slice(0, 10)
      const dueDateStr = dueDateThisMonth.toISOString().slice(0, 10)

      // 請求書INSERT
      const { data: invoice, error: invError } = await supabase
        .from('invoices')
        .insert({
          invoice_number: invoiceNumber,
          contract_id: contract.id,
          customer_id: customer.id,
          billing_month: targetBillingMonth,
          issue_date: issueDate,
          due_date: dueDateStr,
          subtotal,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          status: 'issued',
          notes: null,
        })
        .select('id')
        .single()

      if (invError || !invoice) {
        log.push(`[Cron] Error creating invoice for ${contract.id}: ${invError?.message}`)
        continue
      }

      // 明細行INSERT
      await supabase
        .from('invoice_items')
        .insert(lineItems.map((item) => ({ ...item, invoice_id: invoice.id })))

      log.push(`[Cron] Generated ${invoiceNumber} for ${customer.name} (${monthlyTotal} inc tax)`)
      generated++

      // メール送信（メールアドレスがある場合）
      if (customer.email && process.env.RESEND_API_KEY) {
        try {
          const formatCurrency = (n: number) =>
            n.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })

          const monthLabel = targetBillingMonth.replace('-', '年') + '月分'

          const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
    <div style="background:#1e3a5f;padding:28px 32px;">
      <p style="color:#fff;font-size:20px;font-weight:700;margin:0;">請求書のご案内</p>
    </div>
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">${customer.name} 様</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
        いつもご利用ありがとうございます。<br>
        ${monthLabel}のご請求書を発行いたしました。
      </p>
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 20px;">
        <tr>
          <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;color:#6b7280;width:40%;">請求書番号</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;font-family:monospace;">${invoiceNumber}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;color:#6b7280;">対象月</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;">${monthLabel}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;color:#6b7280;">お支払期限</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;">${dueDateStr}</td>
        </tr>
        <tr>
          <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;color:#6b7280;">ご請求金額（税込）</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#1e3a5f;font-size:18px;font-weight:700;">${formatCurrency(totalAmount)}</td>
        </tr>
      </table>
      ${settings?.bank_info ? `
      <div style="background:#f8fafc;border-left:4px solid #1e3a5f;padding:12px 16px;margin:16px 0;font-size:13px;color:#374151;white-space:pre-line;">${settings.bank_info}</div>
      ` : ''}
      <p style="color:#6b7280;font-size:13px;margin:20px 0 0;line-height:1.6;">
        ご不明な点がございましたら、お気軽にお問い合わせください。<br>
        引き続きよろしくお願いいたします。
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        このメールはピアノレンタルサービス管理システムより自動送信されています。
      </p>
    </div>
  </div>
</body>
</html>`

          await resend.emails.send({
            from: FROM_EMAIL,
            to: [customer.email],
            subject: `【請求書】${monthLabel} ${formatCurrency(totalAmount)}`,
            html,
          })

          log.push(`[Cron] Email sent to ${customer.email}`)
          emailed++
        } catch (emailErr) {
          log.push(`[Cron] Email failed for ${customer.email}: ${String(emailErr)}`)
        }
      }
    }

    log.push(`[Cron] Done: generated=${generated}, emailed=${emailed}, skipped=${skipped}`)

    return NextResponse.json({
      success: true,
      generated,
      emailed,
      skipped,
      log,
    })
  } catch (err) {
    log.push(`[Cron] Fatal error: ${String(err)}`)
    return NextResponse.json({ error: String(err), log }, { status: 500 })
  }
}
