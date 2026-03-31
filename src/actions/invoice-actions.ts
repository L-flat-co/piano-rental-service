'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Invoice, InvoiceItem, InvoiceStatus, ActionResult } from '@/types'

export interface GenerateInvoiceInput {
  contract_id: string
  billing_month: string  // "2025-01"
  issue_date: string
  due_date: string
  notes: string
}

// ============================================================
// 請求書番号生成
// ============================================================

async function getNextInvoiceNumber(
  supabase: ReturnType<typeof import('@supabase/supabase-js').createClient>,
  billingMonth: string
): Promise<string> {
  const prefix = `INV-${billingMonth.replace('-', '')}-`
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}%`)

  const seq = String((count || 0) + 1).padStart(3, '0')
  return `${prefix}${seq}`
}

// ============================================================
// 一覧・詳細
// ============================================================

export async function getInvoices(query?: string): Promise<Invoice[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('*, customer:customers(id, name)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getInvoices error:', error)
    return []
  }

  let result = (data as Invoice[]) || []

  if (query) {
    const q = query.toLowerCase()
    result = result.filter(
      (inv) =>
        inv.invoice_number.toLowerCase().includes(q) ||
        inv.customer?.name?.toLowerCase().includes(q) ||
        (inv.billing_month || '').includes(q)
    )
  }

  return result
}

export async function getInvoice(id: string): Promise<Invoice | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('*, customer:customers(*), items:invoice_items(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getInvoice error:', error)
    return null
  }

  if (data.items) {
    data.items.sort((a: InvoiceItem, b: InvoiceItem) => a.sort_order - b.sort_order)
  }

  return data as Invoice
}

// ============================================================
// 請求書生成（契約から自動作成）
// ============================================================

export async function generateInvoice(
  input: GenerateInvoiceInput
): Promise<ActionResult<Invoice>> {
  const supabase = await createClient()

  // 契約情報を取得
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*, plan:rental_plans(*)')
    .eq('id', input.contract_id)
    .single()

  if (contractError || !contract) {
    return { success: false, error: '契約が見つかりません' }
  }

  // オプション取得
  let options: Array<{ id: string; name: string; monthly_fee: number }> = []
  if (contract.option_ids && contract.option_ids.length > 0) {
    const { data: opts } = await supabase
      .from('rental_options')
      .select('id, name, monthly_fee')
      .in('id', contract.option_ids)
    options = opts || []
  }

  // スポット費用（当月分の定期 + 発生日が当月の初期費用）取得
  const monthStart = `${input.billing_month}-01`
  const monthEnd = `${input.billing_month}-31`
  const { data: spotFees } = await supabase
    .from('contract_spot_fees')
    .select('*')
    .eq('contract_id', input.contract_id)
    .or(
      `section.eq.monthly,and(section.eq.initial,occurred_at.gte.${monthStart},occurred_at.lte.${monthEnd})`
    )

  // 請求書番号生成
  const invoice_number = await getNextInvoiceNumber(supabase as any, input.billing_month)

  // 明細行を構築
  const lineItems: Array<{
    label: string
    description: string | null
    unit_price: number
    quantity: number
    amount: number
    sort_order: number
  }> = []
  let sortOrder = 1

  // プラン（月額・税込 → 税抜に変換して格納）
  if (contract.plan) {
    const feeExTax = Math.round(contract.plan.monthly_fee / 1.1)
    lineItems.push({
      label: contract.plan.name,
      description: null,
      unit_price: feeExTax,
      quantity: 1,
      amount: feeExTax,
      sort_order: sortOrder++,
    })
  }

  // オプション（税込 → 税抜）
  for (const opt of options) {
    const feeExTax = Math.round(opt.monthly_fee / 1.1)
    lineItems.push({
      label: opt.name,
      description: null,
      unit_price: feeExTax,
      quantity: 1,
      amount: feeExTax,
      sort_order: sortOrder++,
    })
  }

  // スポット費用（amount は税抜で格納）
  for (const spot of spotFees || []) {
    lineItems.push({
      label: spot.label,
      description: null,
      unit_price: spot.amount,
      quantity: spot.quantity,
      amount: spot.amount * spot.quantity,
      sort_order: sortOrder++,
    })
  }

  // 合計計算
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = Math.round(subtotal * 0.1)
  const totalAmount = subtotal + taxAmount

  // 請求書レコード作成
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number,
      contract_id: input.contract_id,
      customer_id: contract.customer_id,
      billing_month: input.billing_month,
      issue_date: input.issue_date,
      due_date: input.due_date || null,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'draft',
      notes: input.notes || null,
    })
    .select()
    .single()

  if (invoiceError) {
    return { success: false, error: invoiceError.message }
  }

  // 明細行を一括 INSERT
  if (lineItems.length > 0) {
    const { error: itemsError } = await supabase
      .from('invoice_items')
      .insert(lineItems.map((item) => ({ ...item, invoice_id: invoice.id })))

    if (itemsError) {
      await supabase.from('invoices').delete().eq('id', invoice.id)
      return { success: false, error: itemsError.message }
    }
  }

  revalidatePath('/admin/invoices')
  return { success: true, data: invoice }
}

// ============================================================
// ステータス更新
// ============================================================

export async function updateInvoiceStatus(
  id: string,
  status: InvoiceStatus
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { error } = await supabase.from('invoices').update({ status }).eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/invoices/${id}`)
  return { success: true, data: undefined }
}

// ============================================================
// カスタム品目追加・削除（手動明細）
// ============================================================

export async function addCustomInvoiceItem(
  invoiceId: string,
  data: { label: string; unit_price: number; quantity: number }
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  // 既存の最大sort_orderを取得
  const { data: items } = await supabase
    .from('invoice_items')
    .select('sort_order')
    .eq('invoice_id', invoiceId)
    .order('sort_order', { ascending: false })
    .limit(1)

  const maxOrder = items?.[0]?.sort_order ?? 0
  const amount = data.unit_price * data.quantity

  // 明細行を追加
  const { error: itemError } = await supabase
    .from('invoice_items')
    .insert({
      invoice_id: invoiceId,
      label: data.label,
      description: null,
      unit_price: data.unit_price,
      quantity: data.quantity,
      amount,
      sort_order: maxOrder + 1,
    })

  if (itemError) {
    return { success: false, error: itemError.message }
  }

  // 合計を再計算して請求書を更新
  const recalcResult = await recalcInvoiceTotals(supabase, invoiceId)
  if (!recalcResult.success) {
    return recalcResult
  }

  revalidatePath(`/admin/invoices/${invoiceId}`)
  return { success: true, data: undefined }
}

export async function removeInvoiceItem(
  invoiceId: string,
  itemId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('invoice_items')
    .delete()
    .eq('id', itemId)
    .eq('invoice_id', invoiceId)

  if (error) {
    return { success: false, error: error.message }
  }

  // 合計を再計算
  const recalcResult = await recalcInvoiceTotals(supabase, invoiceId)
  if (!recalcResult.success) {
    return recalcResult
  }

  revalidatePath(`/admin/invoices/${invoiceId}`)
  return { success: true, data: undefined }
}

async function recalcInvoiceTotals(
  supabase: Awaited<ReturnType<typeof import('@/lib/supabase/server').createClient>>,
  invoiceId: string
): Promise<ActionResult<void>> {
  const { data: items, error: fetchError } = await supabase
    .from('invoice_items')
    .select('amount')
    .eq('invoice_id', invoiceId)

  if (fetchError) {
    return { success: false, error: fetchError.message }
  }

  const subtotal = (items || []).reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = Math.round(subtotal * 0.1)
  const totalAmount = subtotal + taxAmount

  const { error: updateError } = await supabase
    .from('invoices')
    .update({ subtotal, tax_amount: taxAmount, total_amount: totalAmount })
    .eq('id', invoiceId)

  if (updateError) {
    return { success: false, error: updateError.message }
  }

  return { success: true, data: undefined }
}

// ============================================================
// 一括発行（当月分まとめて生成）
// ============================================================

export interface BulkGenerateInput {
  billing_month: string   // "2025-01"
  issue_date?: string     // 省略時は自動計算
  due_date?: string       // 省略時は自動計算
  notes?: string
}

/** start_dateの日付-1 = 支払期限（29〜31日は28日として扱う） */
function calcDueDateFromStartDate(billingMonth: string, startDate: string): string {
  const [y, m] = billingMonth.split('-').map(Number)
  const startDay = new Date(startDate).getDate() || 1
  const safeDay = Math.min(startDay, 28)
  const dueDay = Math.max(safeDay - 1, 1)
  const due = new Date(y, m - 1, dueDay)
  return `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`
}

/** 支払期限からX日前 = 発行日 */
function calcIssueDateFromDue(dueDate: string, dueDays: number): string {
  const d = new Date(dueDate)
  d.setDate(d.getDate() - dueDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface BulkGenerateResult {
  generated: number
  skipped: number
  errors: Array<{ contract_id: string; customer_name: string; reason: string }>
}

export async function bulkGenerateInvoices(
  input: BulkGenerateInput
): Promise<ActionResult<BulkGenerateResult>> {
  const supabase = await createClient()

  // アクティブな契約を全件取得（顧客名・プラン込み）
  const { data: contracts, error: contractsError } = await supabase
    .from('contracts')
    .select('*, customer:customers(id, name), plan:rental_plans(*)')
    .eq('status', 'active')
    .eq('service_type', 'home_school')

  if (contractsError) {
    return { success: false, error: contractsError.message }
  }

  if (!contracts || contracts.length === 0) {
    return { success: false, error: 'アクティブな契約が見つかりません' }
  }

  // 対象月で既に作成済みの請求書を取得（重複チェック用）
  const { data: existingInvoices } = await supabase
    .from('invoices')
    .select('contract_id')
    .eq('billing_month', input.billing_month)
    .not('contract_id', 'is', null)

  const existingContractIds = new Set((existingInvoices || []).map((inv) => inv.contract_id))

  const result: BulkGenerateResult = { generated: 0, skipped: 0, errors: [] }

  for (const contract of contracts) {
    const customer = Array.isArray(contract.customer) ? contract.customer[0] : contract.customer
    const customerName = customer?.name || contract.customer_id

    // 既に作成済みならスキップ
    if (existingContractIds.has(contract.id)) {
      result.skipped++
      continue
    }

    // ---- 以降は generateInvoice と同一ロジック ----

    // オプション取得
    let options: Array<{ id: string; name: string; monthly_fee: number }> = []
    if (contract.option_ids && contract.option_ids.length > 0) {
      const { data: opts } = await supabase
        .from('rental_options')
        .select('id, name, monthly_fee')
        .in('id', contract.option_ids)
      options = opts || []
    }

    // スポット費用取得（当月分）
    const monthStart = `${input.billing_month}-01`
    const monthEnd = `${input.billing_month}-31`
    const { data: spotFees } = await supabase
      .from('contract_spot_fees')
      .select('*')
      .eq('contract_id', contract.id)
      .or(
        `section.eq.monthly,and(section.eq.initial,occurred_at.gte.${monthStart},occurred_at.lte.${monthEnd})`
      )

    // 請求書番号生成
    const prefix = `INV-${input.billing_month.replace('-', '')}-`
    const { count } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .like('invoice_number', `${prefix}%`)
    const seq = String((count || 0) + 1).padStart(3, '0')
    const invoice_number = `${prefix}${seq}`

    // 明細行構築
    const lineItems: Array<{
      label: string
      description: null
      unit_price: number
      quantity: number
      amount: number
      sort_order: number
    }> = []
    let sortOrder = 1

    const plan = Array.isArray(contract.plan) ? contract.plan[0] : contract.plan
    if (plan) {
      const feeExTax = Math.round(plan.monthly_fee / 1.1)
      lineItems.push({
        label: plan.name,
        description: null,
        unit_price: feeExTax,
        quantity: 1,
        amount: feeExTax,
        sort_order: sortOrder++,
      })
    }

    for (const opt of options) {
      const feeExTax = Math.round(opt.monthly_fee / 1.1)
      lineItems.push({
        label: opt.name,
        description: null,
        unit_price: feeExTax,
        quantity: 1,
        amount: feeExTax,
        sort_order: sortOrder++,
      })
    }

    for (const spot of spotFees || []) {
      lineItems.push({
        label: spot.label,
        description: null,
        unit_price: spot.amount,
        quantity: spot.quantity,
        amount: spot.amount * spot.quantity,
        sort_order: sortOrder++,
      })
    }

    const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
    const taxAmount = Math.round(subtotal * 0.1)
    const totalAmount = subtotal + taxAmount

    // 日付を契約の start_date から自動計算（システム設定の invoice_due_days を使用）
    const { data: sysSettings } = await supabase.from('system_settings').select('invoice_due_days').single()
    const dueDays = sysSettings?.invoice_due_days ?? 14

    const contractDueDate = input.due_date || calcDueDateFromStartDate(input.billing_month, contract.start_date)
    const contractIssueDate = input.issue_date || calcIssueDateFromDue(contractDueDate, dueDays)

    // 請求書 INSERT
    const { data: invoice, error: invoiceError } = await supabase
      .from('invoices')
      .insert({
        invoice_number,
        contract_id: contract.id,
        customer_id: contract.customer_id,
        billing_month: input.billing_month,
        issue_date: contractIssueDate,
        due_date: contractDueDate,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'draft',
        notes: input.notes || null,
      })
      .select()
      .single()

    if (invoiceError) {
      result.errors.push({ contract_id: contract.id, customer_name: customerName, reason: invoiceError.message })
      continue
    }

    // 明細行 INSERT
    if (lineItems.length > 0) {
      const { error: itemsError } = await supabase
        .from('invoice_items')
        .insert(lineItems.map((item) => ({ ...item, invoice_id: invoice.id })))

      if (itemsError) {
        await supabase.from('invoices').delete().eq('id', invoice.id)
        result.errors.push({ contract_id: contract.id, customer_name: customerName, reason: itemsError.message })
        continue
      }
    }

    result.generated++
  }

  revalidatePath('/admin/invoices')
  revalidatePath('/admin/dashboard')
  return { success: true, data: result }
}

// ============================================================
// 見積書作成（初期費用 + 初月分）
// ============================================================

export async function createEstimate(
  contractId: string
): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient()

  // 契約データ取得
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .select('*, plan:rental_plans(*), customer:customers(id, name)')
    .eq('id', contractId)
    .single()

  if (contractError || !contract) {
    return { success: false, error: '契約が見つかりません' }
  }

  // 既に見積書があるかチェック
  const { count: existingCount } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('contract_id', contractId)
    .like('invoice_number', 'EST-%')
  if (existingCount && existingCount > 0) {
    return { success: false, error: 'この契約の見積書は既に作成されています' }
  }

  // 初期費用（スポット費用）を取得
  const { data: spotFees } = await supabase
    .from('contract_spot_fees')
    .select('*')
    .eq('contract_id', contractId)
    .eq('section', 'initial')
    .neq('memo', 'pickup_pending')  // 搬出参考費用は除外
    .gt('quantity', 0)

  // オプション取得
  let options: { name: string; monthly_fee: number }[] = []
  if (contract.option_ids && contract.option_ids.length > 0) {
    const { data: opts } = await supabase
      .from('rental_options')
      .select('name, monthly_fee')
      .in('id', contract.option_ids)
    options = opts || []
  }

  // カスタムオプション
  const customOptions = contract.custom_options || []

  // 明細行構築
  const lineItems: Array<{
    label: string; description: string | null; unit_price: number; quantity: number; amount: number; sort_order: number
  }> = []
  let sortOrder = 1

  // 初期費用
  for (const spot of spotFees || []) {
    lineItems.push({
      label: spot.label,
      description: null,
      unit_price: spot.amount,
      quantity: spot.quantity,
      amount: Math.round(spot.amount * spot.quantity),
      sort_order: sortOrder++,
    })
  }

  // 初月プラン料
  const plan = Array.isArray(contract.plan) ? contract.plan[0] : contract.plan
  if (plan) {
    const feeExTax = Math.round(plan.monthly_fee / 1.1)
    lineItems.push({
      label: `${plan.name}（初月分）`,
      description: null,
      unit_price: feeExTax,
      quantity: 1,
      amount: feeExTax,
      sort_order: sortOrder++,
    })
  }

  // オプション
  for (const opt of options) {
    const feeExTax = Math.round(opt.monthly_fee / 1.1)
    lineItems.push({
      label: `${opt.name}（初月分）`,
      description: null,
      unit_price: feeExTax,
      quantity: 1,
      amount: feeExTax,
      sort_order: sortOrder++,
    })
  }

  // カスタムオプション
  for (const co of customOptions) {
    const feeExTax = Math.round(co.monthly_fee / 1.1)
    lineItems.push({
      label: `${co.name}（初月分）`,
      description: null,
      unit_price: feeExTax,
      quantity: 1,
      amount: feeExTax,
      sort_order: sortOrder++,
    })
  }

  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)
  const taxAmount = Math.round(subtotal * 0.1)
  const totalAmount = subtotal + taxAmount

  // 見積書番号生成
  const now = new Date()
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const prefix = `EST-${ym}-`
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}%`)
  const seq = String((count || 0) + 1).padStart(3, '0')
  const estimateNumber = `${prefix}${seq}`

  // 日付
  const issueDate = now.toISOString().slice(0, 10)
  const { data: sysSettings } = await supabase.from('system_settings').select('invoice_due_days').single()
  const dueDays = sysSettings?.invoice_due_days ?? 14
  const dueDate = new Date(now)
  dueDate.setDate(dueDate.getDate() + dueDays)
  const dueDateStr = dueDate.toISOString().slice(0, 10)

  // INSERT
  const { data: invoice, error: invoiceError } = await supabase
    .from('invoices')
    .insert({
      invoice_number: estimateNumber,
      contract_id: contractId,
      customer_id: contract.customer_id,
      issue_date: issueDate,
      due_date: dueDateStr,
      subtotal,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: 'draft',
      notes: '初回見積書（初期費用＋初月分）',
    })
    .select('id')
    .single()

  if (invoiceError || !invoice) {
    return { success: false, error: invoiceError?.message || '見積書の作成に失敗しました' }
  }

  // 明細行 INSERT
  await supabase
    .from('invoice_items')
    .insert(lineItems.map((item) => ({ ...item, invoice_id: invoice.id })))

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/contracts/${contractId}`)
  return { success: true, data: { id: invoice.id } }
}

// ============================================================
// 見積書 → 請求書に変換
// ============================================================

export async function convertEstimateToInvoice(
  invoiceId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { data: invoice } = await supabase
    .from('invoices')
    .select('invoice_number')
    .eq('id', invoiceId)
    .single()

  if (!invoice || !invoice.invoice_number.startsWith('EST-')) {
    return { success: false, error: '見積書が見つかりません' }
  }

  // 新しい INV 番号を生成
  const now = new Date()
  const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const prefix = `INV-${ym}-`
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .like('invoice_number', `${prefix}%`)
  const seq = String((count || 0) + 1).padStart(3, '0')
  const invoiceNumber = `${prefix}${seq}`

  const { error } = await supabase
    .from('invoices')
    .update({
      invoice_number: invoiceNumber,
      issue_date: now.toISOString().slice(0, 10),
    })
    .eq('id', invoiceId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/invoices/${invoiceId}`)
  return { success: true, data: undefined }
}

// ============================================================
// システム設定取得（PDF用）
// ============================================================

export async function getSystemSettings() {
  const supabase = await createClient()
  const { data } = await supabase.from('system_settings').select('*').single()
  return data
}
