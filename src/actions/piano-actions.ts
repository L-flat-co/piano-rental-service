'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Piano, ActionResult, PianoType, PianoStatus } from '@/types'

export interface PianoFormData {
  maker: string
  model: string
  serial_number: string
  piano_type: PianoType
  is_mute: boolean
  is_white: boolean
  status: PianoStatus
  storage_location: string
  purchase_date: string
  memo: string
}

export async function getPianos(query?: string): Promise<Piano[]> {
  const supabase = await createClient()

  let queryBuilder = supabase
    .from('pianos')
    .select('*')
    .order('created_at', { ascending: false })

  if (query) {
    queryBuilder = queryBuilder.or(
      `maker.ilike.%${query}%,model.ilike.%${query}%,serial_number.ilike.%${query}%`
    )
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('getPianos error:', error)
    return []
  }

  return data || []
}

export async function getPiano(id: string): Promise<Piano | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pianos')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getPiano error:', error)
    return null
  }

  return data
}

export async function createPiano(
  formData: PianoFormData
): Promise<ActionResult<Piano>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pianos')
    .insert({
      maker: formData.maker,
      model: formData.model,
      serial_number: formData.serial_number || null,
      piano_type: formData.piano_type,
      is_mute: formData.is_mute,
      is_white: formData.is_white,
      status: formData.status || 'available',
      storage_location: formData.storage_location || null,
      purchase_date: formData.purchase_date || null,
      memo: formData.memo || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/pianos')
  return { success: true, data }
}

export async function updatePiano(
  id: string,
  formData: PianoFormData
): Promise<ActionResult<Piano>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('pianos')
    .update({
      maker: formData.maker,
      model: formData.model,
      serial_number: formData.serial_number || null,
      piano_type: formData.piano_type,
      is_mute: formData.is_mute,
      is_white: formData.is_white,
      status: formData.status,
      storage_location: formData.storage_location || null,
      purchase_date: formData.purchase_date || null,
      memo: formData.memo || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/pianos')
  revalidatePath(`/admin/pianos/${id}`)
  return { success: true, data }
}

export async function deletePiano(id: string): Promise<ActionResult<void>> {
  const supabase = await createClient()

  // 貸出中は削除不可
  const { data: piano } = await supabase
    .from('pianos')
    .select('status')
    .eq('id', id)
    .single()

  if (piano?.status === 'rented') {
    return { success: false, error: '貸出中のピアノは削除できません。先に契約を解約してください。' }
  }

  // 契約に紐づいていないか確認
  const { count } = await supabase
    .from('contracts')
    .select('id', { count: 'exact', head: true })
    .eq('piano_id', id)
  if (count && count > 0) {
    return { success: false, error: 'このピアノに紐づく契約があるため削除できません。' }
  }

  const { error } = await supabase.from('pianos').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/pianos')
  return { success: true, data: undefined }
}
