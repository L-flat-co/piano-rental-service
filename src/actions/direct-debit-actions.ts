'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { DirectDebit, DirectDebitStatus, ServiceType, ActionResult } from '@/types'

export interface DirectDebitFormData {
  contract_id: string
  contract_type: ServiceType
  customer_id: string
  initial_debit_date: string
  bank_name: string
  memo: string
}

export async function getDirectDebits(contractType?: ServiceType): Promise<DirectDebit[]> {
  const supabase = await createClient()

  let query = supabase
    .from('direct_debits')
    .select('*, customer:customers(id, name)')
    .order('created_at', { ascending: false })

  if (contractType) {
    query = query.eq('contract_type', contractType)
  }

  const { data, error } = await query
  if (error) {
    console.error('getDirectDebits error:', error)
    return []
  }
  return (data as DirectDebit[]) || []
}

export async function createDirectDebit(
  formData: DirectDebitFormData
): Promise<ActionResult<DirectDebit>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('direct_debits')
    .insert({
      contract_id: formData.contract_id,
      contract_type: formData.contract_type,
      customer_id: formData.customer_id,
      status: 'pending' as DirectDebitStatus,
      initial_debit_date: formData.initial_debit_date || null,
      bank_name: formData.bank_name || null,
      memo: formData.memo || null,
    })
    .select()
    .single()

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/direct-debits')
  return { success: true, data }
}

export async function updateDirectDebitStatus(
  id: string,
  status: DirectDebitStatus,
  rejectionMemo?: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const updateData: Record<string, unknown> = { status }
  if (status === 'rejected' && rejectionMemo) {
    updateData.rejection_memo = rejectionMemo
  }

  const { error } = await supabase
    .from('direct_debits')
    .update(updateData)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/direct-debits')
  return { success: true, data: undefined }
}

export async function deleteDirectDebit(id: string): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const { error } = await supabase.from('direct_debits').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/direct-debits')
  return { success: true, data: undefined }
}
