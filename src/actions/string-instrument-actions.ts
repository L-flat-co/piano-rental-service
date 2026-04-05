'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { StringInstrument, ActionResult, StringType, PianoStatus, StringSize } from '@/types'

export interface StringInstrumentFormData {
  maker: string
  model: string
  serial_number: string
  string_type: StringType
  size: StringSize
  status: PianoStatus
  accessories: string[]
  storage_location: string
  purchase_date: string
  memo: string
}

export async function getStringInstruments(
  query?: string,
  typeFilter?: StringType,
  statusFilter?: PianoStatus
): Promise<StringInstrument[]> {
  const supabase = await createClient()

  let queryBuilder = supabase
    .from('string_instruments')
    .select('*')
    .order('created_at', { ascending: false })

  if (typeFilter) {
    queryBuilder = queryBuilder.eq('string_type', typeFilter)
  }
  if (statusFilter) {
    queryBuilder = queryBuilder.eq('status', statusFilter)
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('getStringInstruments error:', error)
    return []
  }

  let result = (data as StringInstrument[]) || []

  if (query) {
    const q = query.toLowerCase()
    result = result.filter(
      (s) =>
        s.maker.toLowerCase().includes(q) ||
        s.model.toLowerCase().includes(q) ||
        s.serial_number?.toLowerCase().includes(q)
    )
  }

  return result
}

export async function getStringInstrument(id: string): Promise<StringInstrument | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('string_instruments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getStringInstrument error:', error)
    return null
  }

  return data as StringInstrument
}

export async function createStringInstrument(
  formData: StringInstrumentFormData
): Promise<ActionResult<StringInstrument>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('string_instruments')
    .insert({
      maker: formData.maker,
      model: formData.model,
      serial_number: formData.serial_number || null,
      string_type: formData.string_type,
      size: formData.size,
      status: formData.status || 'available',
      accessories: formData.accessories || [],
      storage_location: formData.storage_location || null,
      purchase_date: formData.purchase_date || null,
      memo: formData.memo || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/strings')
  return { success: true, data }
}

export async function updateStringInstrument(
  id: string,
  formData: StringInstrumentFormData
): Promise<ActionResult<StringInstrument>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('string_instruments')
    .update({
      maker: formData.maker,
      model: formData.model,
      serial_number: formData.serial_number || null,
      string_type: formData.string_type,
      size: formData.size,
      status: formData.status,
      accessories: formData.accessories || [],
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

  revalidatePath('/admin/strings')
  revalidatePath(`/admin/strings/${id}`)
  return { success: true, data }
}

export async function deleteStringInstrument(id: string): Promise<ActionResult<void>> {
  const supabase = await createClient()

  const { data: instrument } = await supabase
    .from('string_instruments')
    .select('status')
    .eq('id', id)
    .single()

  if (instrument?.status === 'rented') {
    return { success: false, error: '貸出中の楽器は削除できません。先に契約を解約してください。' }
  }

  const { count } = await supabase
    .from('string_contracts')
    .select('id', { count: 'exact', head: true })
    .eq('instrument_id', id)
  if (count && count > 0) {
    return { success: false, error: 'この楽器に紐づく契約があるため削除できません。' }
  }

  const { error } = await supabase.from('string_instruments').delete().eq('id', id)
  if (error) return { success: false, error: error.message }

  revalidatePath('/admin/strings')
  return { success: true, data: undefined }
}
