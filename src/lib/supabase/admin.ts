import { createClient } from '@supabase/supabase-js'

/**
 * Admin 専用 Supabase クライアント（Service Role Key 使用）
 *
 * 警告:
 * - このクライアントは Server Action / API Route でのみ使用可能
 * - Client Component や環境変数として絶対に露出させないこと
 * - RLS をバイパスできる強力な権限を持つ
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'Missing Supabase environment variables for admin client. ' +
        'Ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.'
    )
  }

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
