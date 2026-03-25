'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { RentalPlan, RentalOption, SpotFeeTypeMaster } from '@/types'

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

// ============================================================
// rental_plans（管理用 — 全件取得）
// ============================================================

export async function getAllPlans(): Promise<RentalPlan[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rental_plans')
    .select('*')
    .order('plan_type')
    .order('period')
  if (error) {
    console.error('getAllPlans error:', error)
    return []
  }
  return (data as RentalPlan[]) || []
}

export async function updatePlan(
  id: string,
  data: { name: string; monthly_fee: number; is_active: boolean }
): Promise<ActionResult<RentalPlan>> {
  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('rental_plans')
    .update({
      name: data.name,
      monthly_fee: data.monthly_fee,
      is_active: data.is_active,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }
  revalidatePath('/admin/pricing')
  revalidatePath('/admin/contracts')
  return { success: true, data: updated as RentalPlan }
}

// ============================================================
// rental_options
// ============================================================

export async function getOptions(): Promise<RentalOption[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rental_options')
    .select('*')
    .order('created_at')
  if (error) {
    console.error('getOptions error:', error)
    return []
  }
  return (data as RentalOption[]) || []
}

export async function createOption(data: {
  name: string
  monthly_fee: number
  description: string | null
}): Promise<ActionResult<RentalOption>> {
  const supabase = await createClient()
  const { data: created, error } = await supabase
    .from('rental_options')
    .insert({
      name: data.name,
      monthly_fee: data.monthly_fee,
      description: data.description || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }
  revalidatePath('/admin/pricing')
  revalidatePath('/admin/contracts')
  return { success: true, data: created as RentalOption }
}

export async function updateOption(
  id: string,
  data: {
    name: string
    monthly_fee: number
    description: string | null
    is_active: boolean
  }
): Promise<ActionResult<RentalOption>> {
  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('rental_options')
    .update({
      name: data.name,
      monthly_fee: data.monthly_fee,
      description: data.description || null,
      is_active: data.is_active,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }
  revalidatePath('/admin/pricing')
  revalidatePath('/admin/contracts')
  return { success: true, data: updated as RentalOption }
}

// ============================================================
// spot_fee_types
// ============================================================

export async function getSpotFeeTypes(): Promise<SpotFeeTypeMaster[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('spot_fee_types')
    .select('*')
    .order('created_at')
  if (error) {
    console.error('getSpotFeeTypes error:', error)
    return []
  }
  return (data as SpotFeeTypeMaster[]) || []
}

export async function createSpotFeeType(data: {
  name: string
  unit_price: number
  unit: string | null
  description: string | null
}): Promise<ActionResult<SpotFeeTypeMaster>> {
  const supabase = await createClient()
  const { data: created, error } = await supabase
    .from('spot_fee_types')
    .insert({
      name: data.name,
      unit_price: data.unit_price,
      unit: data.unit || null,
      description: data.description || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }
  revalidatePath('/admin/pricing')
  return { success: true, data: created as SpotFeeTypeMaster }
}

export async function updateSpotFeeType(
  id: string,
  data: {
    name: string
    unit_price: number
    unit: string | null
    description: string | null
    is_active: boolean
  }
): Promise<ActionResult<SpotFeeTypeMaster>> {
  const supabase = await createClient()
  const { data: updated, error } = await supabase
    .from('spot_fee_types')
    .update({
      name: data.name,
      unit_price: data.unit_price,
      unit: data.unit || null,
      description: data.description || null,
      is_active: data.is_active,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }
  revalidatePath('/admin/pricing')
  return { success: true, data: updated as SpotFeeTypeMaster }
}
