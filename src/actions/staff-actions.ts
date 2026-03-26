'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { Staff, StaffRole, ActionResult } from '@/types'

// ============================================================
// スタッフ一覧
// ============================================================

export async function getStaffList(): Promise<Staff[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .order('role')
    .order('name')

  if (error) {
    console.error('getStaffList error:', error)
    return []
  }
  return (data as Staff[]) || []
}

// ============================================================
// スタッフ招待（Auth ユーザー作成 + staff テーブル挿入）
// ============================================================

export async function inviteStaff(data: {
  name: string
  email: string
  password: string
  role: StaffRole
}): Promise<ActionResult<Staff>> {
  const adminSupabase = createAdminClient()

  // 1. Supabase Auth ユーザーを作成
  const { data: authUser, error: authError } =
    await adminSupabase.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,  // メール認証をスキップ（管理者が直接作成するため）
    })

  if (authError) {
    if (authError.message.includes('already been registered')) {
      return { success: false, error: 'このメールアドレスは既に登録されています' }
    }
    return { success: false, error: authError.message }
  }

  // 2. staff テーブルにレコードを挿入
  const { data: staff, error: staffError } = await adminSupabase
    .from('staff')
    .insert({
      auth_user_id: authUser.user.id,
      name: data.name,
      email: data.email,
      role: data.role,
      is_active: true,
    })
    .select()
    .single()

  if (staffError) {
    // staff 挿入失敗時は Auth ユーザーも削除
    await adminSupabase.auth.admin.deleteUser(authUser.user.id)
    return { success: false, error: staffError.message }
  }

  revalidatePath('/admin/staff')
  return { success: true, data: staff as Staff }
}

// ============================================================
// スタッフ更新（ロール・有効/無効）
// ============================================================

export async function updateStaff(
  id: string,
  updates: { role?: StaffRole; is_active?: boolean; name?: string }
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/staff')
  return { success: true, data: undefined }
}

// ============================================================
// パスワードリセット
// ============================================================

export async function resetStaffPassword(
  staffId: string,
  newPassword: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()
  const adminSupabase = createAdminClient()

  // staff から auth_user_id を取得
  const { data: staff } = await supabase
    .from('staff')
    .select('auth_user_id')
    .eq('id', staffId)
    .single()

  if (!staff) return { success: false, error: 'スタッフが見つかりません' }

  const { error } = await adminSupabase.auth.admin.updateUserById(
    staff.auth_user_id,
    { password: newPassword }
  )

  if (error) return { success: false, error: error.message }

  return { success: true, data: undefined }
}
