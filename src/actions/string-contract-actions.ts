'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { StringContract, StringRentalPlan, ActionResult, StringRentalType, PaymentMethod } from '@/types'

export interface StringContractFormData {
  customer_id: string
  instrument_id: string
  plan_id: string
  rental_type: StringRentalType
  start_date: string
  billing_day: number
  payment_method: PaymentMethod
  application_date: string
  rule_type: string
  has_insurance: boolean
  shipping_fee: number
  delivery_method: string
  memo: string
}

// ============================================================
// プラン取得
// ============================================================

export async function getActiveStringRentalPlans(): Promise<StringRentalPlan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('string_rental_plans')
    .select('*')
    .eq('is_active', true)
    .order('string_type')
    .order('rental_type')
    .order('period')

  if (error) {
    console.error('getActiveStringRentalPlans error:', error)
    return []
  }
  return (data as StringRentalPlan[]) || []
}

// ============================================================
// 契約一覧
// ============================================================

export async function getStringContracts(query?: string): Promise<StringContract[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('string_contracts')
    .select('*, customer:customers(id, name, name_kana), instrument:string_instruments(id, maker, model, string_type, size), plan:string_rental_plans(id, name, price, rental_type, period)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getStringContracts error:', error)
    return []
  }

  let result = (data as StringContract[]) || []

  if (query) {
    const q = query.toLowerCase()
    result = result.filter((c) =>
      c.customer?.name?.toLowerCase().includes(q) ||
      c.customer?.name_kana?.toLowerCase().includes(q) ||
      c.instrument?.maker?.toLowerCase().includes(q) ||
      c.instrument?.model?.toLowerCase().includes(q)
    )
  }

  return result
}

// ============================================================
// 契約詳細
// ============================================================

export async function getStringContract(id: string): Promise<StringContract | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('string_contracts')
    .select('*, customer:customers(*), instrument:string_instruments(*), plan:string_rental_plans(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getStringContract error:', error)
    return null
  }

  const contract = data as StringContract

  // サイズアップ履歴を取得
  const { data: sizeUps } = await supabase
    .from('string_contract_size_ups')
    .select('*, old_instrument:string_instruments!string_contract_size_ups_old_instrument_id_fkey(maker, model, size), new_instrument:string_instruments!string_contract_size_ups_new_instrument_id_fkey(maker, model, size)')
    .eq('contract_id', id)
    .order('changed_at', { ascending: false })

  contract.size_ups = sizeUps || []

  return contract
}

// ============================================================
// 契約作成
// ============================================================

export async function createStringContract(
  formData: StringContractFormData
): Promise<ActionResult<StringContract>> {
  const supabase = await createClient()

  // プラン取得して月額スナップショット
  const { data: plan } = await supabase
    .from('string_rental_plans')
    .select('price, rental_type, period')
    .eq('id', formData.plan_id)
    .single()

  if (!plan) {
    return { success: false, error: 'プランが見つかりません' }
  }

  // スポットの場合、end_date を自動計算
  let endDate: string | null = null
  if (formData.rental_type === 'spot' && plan.period) {
    const days = parseInt(plan.period) || 30
    const start = new Date(formData.start_date)
    start.setDate(start.getDate() + days)
    endDate = start.toISOString().slice(0, 10)
  }

  const { data, error } = await supabase
    .from('string_contracts')
    .insert({
      customer_id: formData.customer_id,
      instrument_id: formData.instrument_id,
      plan_id: formData.plan_id,
      rental_type: formData.rental_type,
      status: 'active',
      start_date: formData.start_date,
      end_date: endDate,
      billing_day: formData.rental_type === 'subscription' ? formData.billing_day : null,
      monthly_fee: plan.price,
      payment_method: formData.payment_method || 'bank_transfer',
      application_date: formData.application_date || null,
      rule_type: formData.rule_type || 'A',
      has_insurance: formData.has_insurance || false,
      shipping_fee: formData.shipping_fee || 0,
      delivery_method: formData.delivery_method || null,
      memo: formData.memo || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 楽器を「貸出中」に
  await supabase
    .from('string_instruments')
    .update({ status: 'rented' })
    .eq('id', formData.instrument_id)

  // 顧客に strings カテゴリを追加
  const { data: customer } = await supabase
    .from('customers')
    .select('product_categories')
    .eq('id', formData.customer_id)
    .single()

  if (customer && !customer.product_categories?.includes('strings')) {
    const cats = [...(customer.product_categories || []), 'strings']
    await supabase
      .from('customers')
      .update({ product_categories: cats })
      .eq('id', formData.customer_id)
  }

  revalidatePath('/admin/string-contracts')
  revalidatePath('/admin/strings')
  revalidatePath('/admin/customers')
  return { success: true, data }
}

// ============================================================
// 契約更新
// ============================================================

export async function updateStringContract(
  id: string,
  formData: StringContractFormData
): Promise<ActionResult<StringContract>> {
  const supabase = await createClient()

  // 変更前の楽器IDを取得
  const { data: existing } = await supabase
    .from('string_contracts')
    .select('instrument_id')
    .eq('id', id)
    .single()

  const { data, error } = await supabase
    .from('string_contracts')
    .update({
      customer_id: formData.customer_id,
      instrument_id: formData.instrument_id,
      plan_id: formData.plan_id,
      billing_day: formData.rental_type === 'subscription' ? formData.billing_day : null,
      payment_method: formData.payment_method,
      memo: formData.memo || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 楽器が変わった場合
  if (existing && existing.instrument_id !== formData.instrument_id) {
    await supabase.from('string_instruments').update({ status: 'available' }).eq('id', existing.instrument_id)
    await supabase.from('string_instruments').update({ status: 'rented' }).eq('id', formData.instrument_id)
  }

  revalidatePath('/admin/string-contracts')
  revalidatePath(`/admin/string-contracts/${id}`)
  revalidatePath('/admin/strings')
  return { success: true, data }
}

// ============================================================
// 解約
// ============================================================

export async function terminateStringContract(
  id: string,
  endDate: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('string_contracts')
    .select('instrument_id')
    .eq('id', id)
    .single()

  const { error } = await supabase
    .from('string_contracts')
    .update({ status: 'terminated', end_date: endDate })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  if (contract?.instrument_id) {
    await supabase.from('string_instruments').update({ status: 'available' }).eq('id', contract.instrument_id)
  }

  revalidatePath('/admin/string-contracts')
  revalidatePath(`/admin/string-contracts/${id}`)
  revalidatePath('/admin/strings')
  return { success: true, data: undefined }
}

// ============================================================
// 削除
// ============================================================

export async function deleteStringContract(id: string): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { data: contract } = await supabase
    .from('string_contracts')
    .select('instrument_id')
    .eq('id', id)
    .single()

  const { error } = await supabase.from('string_contracts').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  if (contract?.instrument_id) {
    await supabase.from('string_instruments').update({ status: 'available' }).eq('id', contract.instrument_id)
  }

  revalidatePath('/admin/string-contracts')
  revalidatePath('/admin/strings')
  return { success: true, data: undefined }
}

// ============================================================
// サイズアップ
// ============================================================

export async function sizeUpStringContract(
  contractId: string,
  newInstrumentId: string,
  changedAt: string,
  memo?: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  // 現在の契約+楽器を取得
  const { data: contract } = await supabase
    .from('string_contracts')
    .select('instrument_id')
    .eq('id', contractId)
    .single()

  if (!contract) return { success: false, error: '契約が見つかりません' }

  const { data: oldInst } = await supabase
    .from('string_instruments')
    .select('size')
    .eq('id', contract.instrument_id)
    .single()

  const { data: newInst } = await supabase
    .from('string_instruments')
    .select('size')
    .eq('id', newInstrumentId)
    .single()

  if (!oldInst || !newInst) return { success: false, error: '楽器情報の取得に失敗しました' }

  // サイズアップ履歴を記録
  const { error: sizeUpError } = await supabase
    .from('string_contract_size_ups')
    .insert({
      contract_id: contractId,
      old_instrument_id: contract.instrument_id,
      new_instrument_id: newInstrumentId,
      old_size: oldInst.size,
      new_size: newInst.size,
      changed_at: changedAt,
      memo: memo || null,
    })

  if (sizeUpError) return { success: false, error: sizeUpError.message }

  // 旧楽器を在庫に戻す
  await supabase.from('string_instruments').update({ status: 'available' }).eq('id', contract.instrument_id)

  // 新楽器を貸出中に
  await supabase.from('string_instruments').update({ status: 'rented' }).eq('id', newInstrumentId)

  // 契約の楽器IDを更新
  await supabase.from('string_contracts').update({ instrument_id: newInstrumentId }).eq('id', contractId)

  revalidatePath(`/admin/string-contracts/${contractId}`)
  revalidatePath('/admin/strings')
  return { success: true, data: undefined }
}
