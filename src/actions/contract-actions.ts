'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Contract, RentalPlan, RentalOption, ActionResult, ContractPeriod } from '@/types'

export interface ContractFormData {
  customer_id: string
  piano_id: string
  plan_id: string
  option_ids: string[]
  contract_period: ContractPeriod
  start_date: string
  billing_day: number
  memo: string
}

export interface InitialFeeInput {
  fee_type_id: string | null
  label: string
  amount: number       // 税抜
  quantity: number
  memo: string
}

// ============================================================
// マスタ取得
// ============================================================

export async function getActivePlans(): Promise<RentalPlan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rental_plans')
    .select('*')
    .eq('is_active', true)
    .order('plan_type')
    .order('period')

  if (error) {
    console.error('getActivePlans error:', error)
    return []
  }
  return data || []
}

export async function getActiveOptions(): Promise<RentalOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rental_options')
    .select('*')
    .eq('is_active', true)
    .order('name')

  if (error) {
    console.error('getActiveOptions error:', error)
    return []
  }
  return data || []
}

// ============================================================
// 契約 CRUD
// ============================================================

export async function getContracts(query?: string): Promise<Contract[]> {
  const supabase = await createClient()

  let queryBuilder = supabase
    .from('contracts')
    .select('*, customer:customers(id, name, name_kana), piano:pianos(id, maker, model), plan:rental_plans(id, name, monthly_fee, plan_type, period)')
    .order('created_at', { ascending: false })

  if (query) {
    // 顧客名での絞り込みはサーバー側で行う（JOINフィルタの代わりに後でクライアント絞り込み）
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('getContracts error:', error)
    return []
  }

  let result = (data as Contract[]) || []

  // 顧客名での検索（JOIN後フィルタ）
  if (query) {
    const q = query.toLowerCase()
    result = result.filter(
      (c) =>
        c.customer?.name?.toLowerCase().includes(q) ||
        c.customer?.name_kana?.toLowerCase().includes(q) ||
        c.piano?.maker?.toLowerCase().includes(q) ||
        c.piano?.model?.toLowerCase().includes(q)
    )
  }

  return result
}

export async function getContract(id: string): Promise<Contract | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contracts')
    .select('*, customer:customers(*), piano:pianos(*), plan:rental_plans(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getContract error:', error)
    return null
  }

  const contract = data as Contract

  // option_ids から実際のオプション情報を取得
  if (contract.option_ids && contract.option_ids.length > 0) {
    const { data: options } = await supabase
      .from('rental_options')
      .select('*')
      .in('id', contract.option_ids)

    contract.options = options || []
  } else {
    contract.options = []
  }

  return contract
}

export async function createContract(
  formData: ContractFormData,
  initialFees?: InitialFeeInput[]
): Promise<ActionResult<Contract>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('contracts')
    .insert({
      service_type: 'home_school',
      customer_id: formData.customer_id,
      piano_id: formData.piano_id,
      plan_id: formData.plan_id,
      option_ids: formData.option_ids,
      contract_period: formData.contract_period,
      status: 'active',
      origin: 'manual',
      start_date: formData.start_date,
      billing_day: formData.billing_day,
      memo: formData.memo || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 初期費用をスポット費用として挿入
  if (initialFees && initialFees.length > 0) {
    const spotFeeRows = initialFees.map((fee) => ({
      contract_id: data.id,
      contract_type: 'home_school' as const,
      fee_type_id: fee.fee_type_id || null,
      fee_type: fee.fee_type_id ? 'master' : 'custom',
      section: 'initial' as const,
      label: fee.label,
      amount: fee.amount,
      quantity: fee.quantity,
      is_recurring: false,
      occurred_at: formData.start_date,
      memo: fee.memo || null,
    }))
    await supabase.from('contract_spot_fees').insert(spotFeeRows)
  }

  // ピアノのステータスを「貸出中」に更新
  await supabase
    .from('pianos')
    .update({ status: 'rented' })
    .eq('id', formData.piano_id)

  revalidatePath('/admin/contracts')
  revalidatePath('/admin/pianos')
  return { success: true, data }
}

export async function updateContract(
  id: string,
  formData: ContractFormData
): Promise<ActionResult<Contract>> {
  const supabase = await createClient()

  // 変更前のピアノIDを取得
  const { data: existing } = await supabase
    .from('contracts')
    .select('piano_id')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('contracts')
    .update({
      customer_id: formData.customer_id,
      piano_id: formData.piano_id,
      plan_id: formData.plan_id,
      option_ids: formData.option_ids,
      contract_period: formData.contract_period,
      billing_day: formData.billing_day,
      memo: formData.memo || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // ピアノが変わった場合、旧ピアノを在庫に戻し新ピアノを貸出中にする
  if (existing && existing.piano_id !== formData.piano_id) {
    await supabase
      .from('pianos')
      .update({ status: 'available' })
      .eq('id', existing.piano_id)
    await supabase
      .from('pianos')
      .update({ status: 'rented' })
      .eq('id', formData.piano_id)
  }

  revalidatePath('/admin/contracts')
  revalidatePath(`/admin/contracts/${id}`)
  revalidatePath('/admin/pianos')
  return { success: true, data }
}

// ============================================================
// 中途解約料自動計算
// ============================================================

export interface EarlyTerminationFeeResult {
  hasFee: boolean
  remainingMonths: number
  monthlyTotal: number   // 月額合計（税込）
  feeAmount: number      // 解約料（税込）
  minEndDate: string | null  // 最低契約満了日
}

export async function calculateEarlyTerminationFee(
  contractId: string,
  terminationDate: string
): Promise<ActionResult<EarlyTerminationFeeResult>> {
  const supabase = await createClient()

  const { data: contract, error } = await supabase
    .from('contracts')
    .select('*, plan:rental_plans(monthly_fee)')
    .eq('id', contractId)
    .single()

  if (error || !contract) {
    return { success: false, error: '契約が見つかりません' }
  }

  // 単月契約は解約料なし
  if (contract.contract_period === 'monthly') {
    return {
      success: true,
      data: { hasFee: false, remainingMonths: 0, monthlyTotal: 0, feeAmount: 0, minEndDate: null },
    }
  }

  // 最低契約期間（月数）
  const minMonths = contract.contract_period === 'yearly' ? 12 : 6

  // 最低契約満了日 = 開始日 + minMonths ヶ月
  const start = new Date(contract.start_date)
  const minEnd = new Date(start)
  minEnd.setMonth(minEnd.getMonth() + minMonths)
  const minEndDate = minEnd.toISOString().slice(0, 10)

  const terminate = new Date(terminationDate)

  // 解約日が満了日以降なら解約料なし
  if (terminate >= minEnd) {
    return {
      success: true,
      data: { hasFee: false, remainingMonths: 0, monthlyTotal: 0, feeAmount: 0, minEndDate },
    }
  }

  // 残り月数（切り上げ）
  const diffMs = minEnd.getTime() - terminate.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  const remainingMonths = Math.ceil(diffDays / 30)

  // 月額合計（プラン＋オプション）
  const planFee = (Array.isArray(contract.plan) ? contract.plan[0] : contract.plan)?.monthly_fee ?? 0
  let optionsFee = 0
  if (contract.option_ids && contract.option_ids.length > 0) {
    const { data: opts } = await supabase
      .from('rental_options')
      .select('monthly_fee')
      .in('id', contract.option_ids)
    optionsFee = (opts || []).reduce((sum: number, o: { monthly_fee: number }) => sum + o.monthly_fee, 0)
  }

  const monthlyTotal = planFee + optionsFee
  const feeAmount = monthlyTotal * remainingMonths

  return {
    success: true,
    data: { hasFee: true, remainingMonths, monthlyTotal, feeAmount, minEndDate },
  }
}

// ============================================================
// スポット費用 CRUD（初期費用の編集用）
// ============================================================

export async function addContractSpotFee(
  contractId: string,
  contractType: 'home_school' | 'event',
  fee: InitialFeeInput
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { error } = await supabase.from('contract_spot_fees').insert({
    contract_id: contractId,
    contract_type: contractType,
    fee_type_id: fee.fee_type_id || null,
    fee_type: fee.fee_type_id ? 'master' : 'custom',
    section: 'initial',
    label: fee.label,
    amount: fee.amount,
    quantity: fee.quantity,
    is_recurring: false,
    memo: fee.memo || null,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/contracts')
  revalidatePath(`/admin/contracts/${contractId}`)
  revalidatePath('/admin/events')
  return { success: true, data: undefined }
}

export async function updateContractSpotFee(
  feeId: string,
  updates: { label?: string; amount?: number; quantity?: number }
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { data: fee } = await supabase
    .from('contract_spot_fees')
    .select('contract_id')
    .eq('id', feeId)
    .single()

  const { error } = await supabase
    .from('contract_spot_fees')
    .update(updates)
    .eq('id', feeId)

  if (error) return { success: false, error: error.message }

  if (fee) {
    revalidatePath(`/admin/contracts/${fee.contract_id}`)
    revalidatePath(`/admin/events/${fee.contract_id}`)
  }
  revalidatePath('/admin/contracts')
  revalidatePath('/admin/events')
  return { success: true, data: undefined }
}

export async function deleteContractSpotFee(
  feeId: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { data: fee } = await supabase
    .from('contract_spot_fees')
    .select('contract_id')
    .eq('id', feeId)
    .single()

  const { error } = await supabase
    .from('contract_spot_fees')
    .delete()
    .eq('id', feeId)

  if (error) return { success: false, error: error.message }

  if (fee) {
    revalidatePath(`/admin/contracts/${fee.contract_id}`)
    revalidatePath(`/admin/events/${fee.contract_id}`)
  }
  revalidatePath('/admin/contracts')
  revalidatePath('/admin/events')
  return { success: true, data: undefined }
}

export async function terminateContract(
  id: string,
  endDate: string,
  pickupOptions?: {
    createPickupInvoice: boolean
    pickupFeeAmount: number
    customerId: string
  }
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  // piano_id を取得して在庫に戻す
  const { data: contract } = await supabase
    .from('contracts')
    .select('piano_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('contracts')
    .update({ status: 'terminated', end_date: endDate })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  if (contract?.piano_id) {
    await supabase
      .from('pianos')
      .update({ status: 'available' })
      .eq('id', contract.piano_id)
  }

  // 搬出費用の請求書を自動作成
  if (pickupOptions?.createPickupInvoice && pickupOptions.pickupFeeAmount > 0) {
    const now = new Date()
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`

    // 請求書番号を生成
    const { count } = await supabase
      .from('invoices')
      .select('id', { count: 'exact', head: true })
      .like('invoice_number', `INV-${ym}-%`)
    const seq = String((count || 0) + 1).padStart(3, '0')
    const invoiceNumber = `INV-${ym}-${seq}`

    const subtotal = pickupOptions.pickupFeeAmount
    const taxAmount = Math.round(subtotal * 0.1)
    const totalAmount = subtotal + taxAmount

    const { data: invoice } = await supabase
      .from('invoices')
      .insert({
        invoice_number: invoiceNumber,
        contract_id: id,
        customer_id: pickupOptions.customerId,
        issue_date: endDate,
        subtotal,
        tax_amount: taxAmount,
        total_amount: totalAmount,
        status: 'draft',
        notes: '解約に伴う搬出費用',
      })
      .select('id')
      .single()

    if (invoice) {
      await supabase.from('invoice_items').insert({
        invoice_id: invoice.id,
        label: '搬出費用',
        unit_price: subtotal,
        quantity: 1,
        amount: subtotal,
        sort_order: 0,
      })
    }

    revalidatePath('/admin/invoices')
  }

  revalidatePath('/admin/contracts')
  revalidatePath(`/admin/contracts/${id}`)
  revalidatePath('/admin/pianos')
  return { success: true, data: undefined }
}
