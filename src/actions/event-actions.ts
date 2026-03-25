'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { EventContract, ActionResult, EventStatus, PianoType } from '@/types'
import type { InitialFeeInput } from '@/actions/contract-actions'

export interface EventFormData {
  customer_id: string
  piano_id: string | null
  piano_type: PianoType
  event_name: string
  venue: string
  delivery_date: string
  pickup_date: string
  memo: string
}

// ============================================================
// 案件一覧取得
// ============================================================

export async function getEventContracts(query?: string): Promise<EventContract[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_contracts')
    .select('*, customer:customers(id, name, name_kana), piano:pianos(id, maker, model)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getEventContracts error:', error)
    return []
  }

  let result = (data as EventContract[]) || []

  if (query) {
    const q = query.toLowerCase()
    result = result.filter(
      (e) =>
        e.event_name.toLowerCase().includes(q) ||
        e.customer?.name?.toLowerCase().includes(q) ||
        e.customer?.name_kana?.toLowerCase().includes(q) ||
        e.venue?.toLowerCase().includes(q)
    )
  }

  return result
}

// ============================================================
// 案件詳細取得
// ============================================================

export async function getEventContract(id: string): Promise<EventContract | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_contracts')
    .select('*, customer:customers(*), piano:pianos(*)')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getEventContract error:', error)
    return null
  }

  return data as EventContract
}

// ============================================================
// 案件作成
// ============================================================

export async function createEventContract(
  formData: EventFormData,
  initialFees?: InitialFeeInput[]
): Promise<ActionResult<EventContract>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_contracts')
    .insert({
      customer_id: formData.customer_id,
      piano_id: formData.piano_id || null,
      piano_type: formData.piano_type,
      event_name: formData.event_name,
      venue: formData.venue || null,
      delivery_date: formData.delivery_date || null,
      pickup_date: formData.pickup_date || null,
      status: 'estimate' as EventStatus,
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
      contract_type: 'event' as const,
      fee_type_id: fee.fee_type_id || null,
      fee_type: fee.fee_type_id ? 'master' : 'custom',
      section: 'initial' as const,
      label: fee.label,
      amount: fee.amount,
      quantity: fee.quantity,
      is_recurring: false,
      occurred_at: formData.delivery_date || null,
      memo: fee.memo || null,
    }))
    await supabase.from('contract_spot_fees').insert(spotFeeRows)
  }

  revalidatePath('/admin/events')
  return { success: true, data }
}

// ============================================================
// 案件更新
// ============================================================

export async function updateEventContract(
  id: string,
  formData: EventFormData
): Promise<ActionResult<EventContract>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('event_contracts')
    .update({
      customer_id: formData.customer_id,
      piano_id: formData.piano_id || null,
      piano_type: formData.piano_type,
      event_name: formData.event_name,
      venue: formData.venue || null,
      delivery_date: formData.delivery_date || null,
      pickup_date: formData.pickup_date || null,
      memo: formData.memo || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
  return { success: true, data }
}

// ============================================================
// ステータス更新
// ============================================================

export async function updateEventStatus(
  id: string,
  status: EventStatus,
  cancellationDate?: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('event_contracts')
    .update({
      status,
      cancellation_date: status === 'cancelled' ? (cancellationDate ?? null) : null,
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/events')
  revalidatePath(`/admin/events/${id}`)
  return { success: true, data: undefined }
}

// ============================================================
// キャンセル料自動計算
// ============================================================

export interface CancellationFeeResult {
  hasFee: boolean
  daysUntilEvent: number | null   // キャンセル日からデリバリー日までの日数
  feeRate: number                 // 0 / 0.5 / 1.0
  baseAmount: number              // 計算基準となる金額（事前請求書の合計または 0）
  feeAmount: number               // キャンセル料
  policyText: string              // 適用されたポリシーの説明
}

import { EVENT_CANCEL_POLICY } from '@/lib/constants'

export async function calculateCancellationFee(
  eventId: string,
  cancellationDate: string
): Promise<ActionResult<CancellationFeeResult>> {
  const supabase = await createClient()

  // 案件＋関連請求書合計を取得
  const { data: event, error } = await supabase
    .from('event_contracts')
    .select('*')
    .eq('id', eventId)
    .single()

  if (error || !event) {
    return { success: false, error: '案件が見つかりません' }
  }

  // デリバリー日がなければ計算不可
  if (!event.delivery_date) {
    return {
      success: true,
      data: {
        hasFee: false,
        daysUntilEvent: null,
        feeRate: 0,
        baseAmount: 0,
        feeAmount: 0,
        policyText: '搬入日が設定されていないため計算できません',
      },
    }
  }

  // キャンセル日から搬入日までの日数
  const cancelDate = new Date(cancellationDate)
  const deliveryDate = new Date(event.delivery_date)
  const diffMs = deliveryDate.getTime() - cancelDate.getTime()
  const daysUntilEvent = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  // キャンセルポリシー適用
  let feeRate = 0
  let policyText = ''

  if (daysUntilEvent >= EVENT_CANCEL_POLICY.FREE_DAYS) {
    feeRate = 0
    policyText = `搬入日の${EVENT_CANCEL_POLICY.FREE_DAYS}日以上前のためキャンセル料なし`
  } else if (daysUntilEvent >= EVENT_CANCEL_POLICY.FULL_DAYS) {
    feeRate = 0.5
    policyText = `搬入日の${EVENT_CANCEL_POLICY.FULL_DAYS}〜${EVENT_CANCEL_POLICY.FREE_DAYS - 1}日前のため料金の50%`
  } else {
    feeRate = 1.0
    policyText = `搬入日の${EVENT_CANCEL_POLICY.FULL_DAYS - 1}日前以内のため料金の100%`
  }

  // 関連請求書（発行済み・入金済みを除くドラフト以降の合計）の取得
  const { data: invoices } = await supabase
    .from('invoices')
    .select('total_amount, status')
    .eq('event_contract_id', eventId)
    .in('status', ['draft', 'issued', 'paid'])

  const baseAmount = (invoices || []).reduce(
    (sum: number, inv: { total_amount: number }) => sum + inv.total_amount,
    0
  )
  const feeAmount = Math.round(baseAmount * feeRate)

  return {
    success: true,
    data: {
      hasFee: feeRate > 0,
      daysUntilEvent,
      feeRate,
      baseAmount,
      feeAmount,
      policyText,
    },
  }
}
