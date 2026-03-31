'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Application, ApplicationStatus, ActionResult, ContractPeriod, PianoType } from '@/types'
import type { InitialFeeInput } from '@/actions/contract-actions'

// ============================================================
// 公開申込フォーム用データ型
// ============================================================

export interface ApplicationFormData {
  applicant_name: string
  applicant_kana: string
  applicant_email: string
  applicant_phone: string
  applicant_postal_code: string
  applicant_address: string
  company_name: string
  plan_type: 'home' | 'school'
  contract_period: ContractPeriod
  piano_type: PianoType
  preferred_start_date: string
  option_ids: string[]
  installation_address: string
  installation_floor: string
  installation_elevator: boolean
}

// ============================================================
// 公開: 申込送信（認証不要 — anon key で INSERT）
// ============================================================

export async function submitApplication(
  formData: ApplicationFormData
): Promise<ActionResult<{ id: string }>> {
  // Admin Client を使用（RLS の public insert ポリシーでも動くが確実に）
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('applications')
    .insert({
      applicant_name: formData.applicant_name,
      applicant_kana: formData.applicant_kana || null,
      applicant_email: formData.applicant_email,
      applicant_phone: formData.applicant_phone || null,
      applicant_postal_code: formData.applicant_postal_code || null,
      applicant_address: formData.applicant_address || null,
      company_name: formData.company_name || null,
      plan_type: formData.plan_type,
      contract_period: formData.contract_period,
      piano_type: formData.piano_type,
      preferred_start_date: formData.preferred_start_date || null,
      option_ids: formData.option_ids,
      installation_address: formData.installation_address || null,
      installation_floor: formData.installation_floor || null,
      installation_elevator: formData.installation_elevator,
      status: 'submitted' as ApplicationStatus,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true, data: { id: data.id } }
}

// ============================================================
// 管理: 申込一覧取得
// ============================================================

export async function getApplications(query?: string): Promise<Application[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getApplications error:', error)
    return []
  }

  let result = (data as Application[]) || []

  if (query) {
    const q = query.toLowerCase()
    result = result.filter(
      (a) =>
        a.applicant_name.toLowerCase().includes(q) ||
        a.applicant_email.toLowerCase().includes(q) ||
        a.applicant_kana?.toLowerCase().includes(q) ||
        a.company_name?.toLowerCase().includes(q)
    )
  }

  return result
}

// ============================================================
// 管理: 申込詳細取得
// ============================================================

export async function getApplication(id: string): Promise<Application | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('applications')
    .select('*, customer:customers(*), contract:contracts(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getApplication error:', error)
    return null
  }

  return data as Application
}

// ============================================================
// 管理: ステータス変更
// ============================================================

export async function updateApplicationStatus(
  id: string,
  status: ApplicationStatus,
  adminMemo?: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { status }
  if (adminMemo !== undefined) updateData.admin_memo = adminMemo

  const { error } = await supabase
    .from('applications')
    .update(updateData)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/applications')
  revalidatePath(`/admin/applications/${id}`)
  return { success: true, data: undefined }
}

// ============================================================
// 管理: 申込 → 契約変換
// ============================================================

export interface ConvertFormData {
  piano_id: string
  start_date: string
  billing_day: number
  transport_fee: number         // 運送費（税抜）
  transport_type: 'round_trip' | 'delivery_only'
  pickup_fee_estimate: number   // 搬出参考金額
  memo: string
}

export async function convertToContract(
  applicationId: string,
  convertData: ConvertFormData
): Promise<ActionResult<{ contractId: string }>> {
  const supabase = await createClient()

  // 申込データ取得
  const { data: app, error: appError } = await supabase
    .from('applications')
    .select('*')
    .eq('id', applicationId)
    .single()

  if (appError || !app) {
    return { success: false, error: '申込が見つかりません' }
  }

  if (app.status !== 'approved') {
    return { success: false, error: '承認済みの申込のみ契約に変換できます' }
  }

  // 1. 顧客を作成（または既存を紐付け）
  let customerId = app.customer_id as string | null

  if (!customerId) {
    // メールで既存顧客を検索
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('email', app.applicant_email)
      .limit(1)

    if (existing && existing.length > 0) {
      customerId = existing[0].id
    } else {
      // 新規顧客作成
      const { data: newCustomer, error: custError } = await supabase
        .from('customers')
        .insert({
          name: app.applicant_name,
          name_kana: app.applicant_kana,
          email: app.applicant_email,
          phone: app.applicant_phone,
          postal_code: app.applicant_postal_code,
          address: app.applicant_address,
          company_name: app.company_name,
          status: 'active',
          memo: `Web申込から自動作成（${new Date().toLocaleDateString('ja-JP')})`,
        })
        .select('id')
        .single()

      if (custError || !newCustomer) {
        return { success: false, error: '顧客の作成に失敗しました: ' + custError?.message }
      }
      customerId = newCustomer.id
    }

    // 申込に顧客IDを紐付け
    await supabase
      .from('applications')
      .update({ customer_id: customerId })
      .eq('id', applicationId)
  }

  // 2. プランを取得
  const { data: plans } = await supabase
    .from('rental_plans')
    .select('id')
    .eq('plan_type', app.plan_type)
    .eq('period', app.contract_period)
    .eq('is_active', true)
    .single()

  if (!plans) {
    return { success: false, error: '該当するプランが見つかりません' }
  }

  // 3. 契約を作成
  const { data: contract, error: contractError } = await supabase
    .from('contracts')
    .insert({
      service_type: 'home_school',
      customer_id: customerId,
      application_id: applicationId,
      piano_id: convertData.piano_id,
      plan_id: plans.id,
      option_ids: app.option_ids || [],
      contract_period: app.contract_period,
      status: 'active',
      origin: 'web',
      start_date: convertData.start_date,
      billing_day: Math.min(new Date(convertData.start_date).getDate() || 1, 28),
      payment_method: 'bank_transfer',
      memo: convertData.memo || null,
    })
    .select('id')
    .single()

  if (contractError || !contract) {
    return { success: false, error: '契約の作成に失敗しました: ' + contractError?.message }
  }

  // 4. 初期費用（運送費）
  const spotFeeRows: Record<string, unknown>[] = []
  if (convertData.transport_fee > 0) {
    const label = convertData.transport_type === 'round_trip' ? '運送費（往復）' : '運送費（搬入）'
    spotFeeRows.push({
      contract_id: contract.id,
      contract_type: 'home_school',
      fee_type: 'custom',
      section: 'initial',
      label,
      amount: convertData.transport_fee,
      quantity: 1,
      is_recurring: false,
      occurred_at: convertData.start_date,
      memo: convertData.transport_type === 'delivery_only' && convertData.pickup_fee_estimate > 0
        ? `pickup_estimate:${convertData.pickup_fee_estimate}` : null,
    })
  }
  if (convertData.transport_type === 'delivery_only' && convertData.pickup_fee_estimate > 0) {
    spotFeeRows.push({
      contract_id: contract.id,
      contract_type: 'home_school',
      fee_type: 'custom',
      section: 'initial',
      label: '搬出費用（参考）',
      amount: convertData.pickup_fee_estimate,
      quantity: 0,
      is_recurring: false,
      memo: 'pickup_pending',
    })
  }
  if (spotFeeRows.length > 0) {
    await supabase.from('contract_spot_fees').insert(spotFeeRows)
  }

  // 5. ピアノを「貸出中」に
  await supabase
    .from('pianos')
    .update({ status: 'rented' })
    .eq('id', convertData.piano_id)

  // 6. 申込を「契約変換済み」に
  await supabase
    .from('applications')
    .update({ status: 'converted', contract_id: contract.id })
    .eq('id', applicationId)

  revalidatePath('/admin/applications')
  revalidatePath(`/admin/applications/${applicationId}`)
  revalidatePath('/admin/contracts')
  revalidatePath('/admin/customers')
  revalidatePath('/admin/pianos')
  return { success: true, data: { contractId: contract.id } }
}

// ============================================================
// 管理: 新規申込件数（ダッシュボード用）
// ============================================================

export async function getNewApplicationCount(): Promise<number> {
  const supabase = await createClient()
  const { count } = await supabase
    .from('applications')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'submitted')
  return count || 0
}
