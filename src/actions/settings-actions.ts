'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { SystemSettings, ActionResult } from '@/types'

export interface SettingsFormData {
  company_name: string
  postal_code: string
  address: string
  phone: string
  email: string
  website: string
  bank_info: string
  tax_rate: number
  invoice_due_days: number
  email_subject_template: string
  email_body_template: string
}

export async function getSettings(): Promise<SystemSettings | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('system_settings').select('*').single()
  return data as SystemSettings | null
}

export async function updateSettings(
  formData: SettingsFormData
): Promise<ActionResult<void>> {
  // 認証チェック（Server Action からの呼び出し確認）
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: '認証が必要です' }

  // Admin Client で更新（RLS をバイパス）
  const adminSupabase = createAdminClient()

  const { data: existing } = await adminSupabase
    .from('system_settings')
    .select('id')
    .single()

  if (!existing) {
    return { success: false, error: 'システム設定が見つかりません。seed.sql を実行してください。' }
  }

  const { data: updated, error } = await adminSupabase
    .from('system_settings')
    .update({
      company_name: formData.company_name,
      postal_code: formData.postal_code || null,
      address: formData.address || null,
      phone: formData.phone || null,
      email: formData.email || null,
      website: formData.website || null,
      bank_info: formData.bank_info || null,
      tax_rate: formData.tax_rate,
      invoice_due_days: formData.invoice_due_days,
      email_subject_template: formData.email_subject_template || null,
      email_body_template: formData.email_body_template || null,
    })
    .eq('id', existing.id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  if (!updated) {
    return { success: false, error: '設定の更新に失敗しました' }
  }

  revalidatePath('/admin/settings')
  revalidatePath('/admin/dashboard')
  return { success: true, data: undefined }
}
