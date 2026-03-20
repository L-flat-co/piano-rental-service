'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { ActionResult } from '@/types'

export async function signIn(
  email: string,
  password: string
): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' }
  }

  return { success: true, data: undefined }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/admin/login')
}

export async function getCurrentStaff() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: staff } = await supabase
    .from('staff')
    .select('*')
    .eq('auth_user_id', user.id)
    .single()

  return staff
}
