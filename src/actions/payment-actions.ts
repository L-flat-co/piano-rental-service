'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Payment, PaymentMethod, ActionResult } from '@/types'

export interface PaymentFormData {
  invoice_id: string
  customer_id: string
  payment_date: string
  amount: number
  payment_method: PaymentMethod
  notes: string
}

// ============================================================
// 入金一覧取得
// ============================================================

export async function getPayments(): Promise<Payment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*, invoice:invoices(id, invoice_number, total_amount, status), customer:customers(id, name)')
    .order('payment_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('getPayments error:', error)
    return []
  }

  return (data as Payment[]) || []
}

// ============================================================
// 請求書に紐づく入金取得
// ============================================================

export async function getPaymentsByInvoice(invoiceId: string): Promise<Payment[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('invoice_id', invoiceId)
    .order('payment_date', { ascending: false })

  if (error) {
    console.error('getPaymentsByInvoice error:', error)
    return []
  }

  return (data as Payment[]) || []
}

// ============================================================
// 入金記録
// ============================================================

export async function recordPayment(
  formData: PaymentFormData
): Promise<ActionResult<Payment>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('payments')
    .insert({
      invoice_id: formData.invoice_id,
      customer_id: formData.customer_id,
      payment_date: formData.payment_date,
      amount: formData.amount,
      payment_method: formData.payment_method,
      notes: formData.notes || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  // 請求書を「入金確認済み」に更新
  await supabase
    .from('invoices')
    .update({ status: 'paid' })
    .eq('id', formData.invoice_id)

  revalidatePath('/admin/payments')
  revalidatePath('/admin/invoices')
  revalidatePath(`/admin/invoices/${formData.invoice_id}`)
  return { success: true, data }
}

// ============================================================
// 入金記録削除
// ============================================================

export async function deletePayment(paymentId: string): Promise<ActionResult<void>> {
  const supabase = await createClient()

  // 先に invoice_id を取得
  const { data: payment } = await supabase
    .from('payments')
    .select('invoice_id')
    .eq('id', paymentId)
    .single()

  const { error } = await supabase
    .from('payments')
    .delete()
    .eq('id', paymentId)

  if (error) {
    return { success: false, error: error.message }
  }

  // 同じ請求書に他の入金がなければ「発行済み」に戻す
  if (payment?.invoice_id) {
    const { data: remaining } = await supabase
      .from('payments')
      .select('id')
      .eq('invoice_id', payment.invoice_id)

    if (!remaining || remaining.length === 0) {
      await supabase
        .from('invoices')
        .update({ status: 'issued' })
        .eq('id', payment.invoice_id)
        .eq('status', 'paid')  // paid の場合のみ戻す
    }
  }

  revalidatePath('/admin/payments')
  revalidatePath('/admin/invoices')
  if (payment?.invoice_id) {
    revalidatePath(`/admin/invoices/${payment.invoice_id}`)
  }
  return { success: true, data: undefined }
}

// ============================================================
// 未入金請求書取得（入金管理用）
// ============================================================

export async function getUnpaidInvoices() {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('invoices')
    .select('*, customer:customers(id, name)')
    .eq('status', 'issued')
    .order('due_date', { ascending: true })

  if (error) return []
  return data || []
}
