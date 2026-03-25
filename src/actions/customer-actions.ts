'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { Customer, ActionResult, CustomerStatus } from '@/types'

export interface CustomerFormData {
  name: string
  name_kana: string
  company_name: string
  email: string
  phone: string
  postal_code: string
  address: string
  status: CustomerStatus
  memo: string
}

export async function getCustomers(query?: string): Promise<Customer[]> {
  const supabase = await createClient()

  let queryBuilder = supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false })

  if (query) {
    queryBuilder = queryBuilder.or(
      `name.ilike.%${query}%,name_kana.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%,company_name.ilike.%${query}%`
    )
  }

  const { data, error } = await queryBuilder

  if (error) {
    console.error('getCustomers error:', error)
    return []
  }

  return data || []
}

export async function getCustomer(id: string): Promise<Customer | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('getCustomer error:', error)
    return null
  }

  return data
}

export async function createCustomer(
  formData: CustomerFormData
): Promise<ActionResult<Customer>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .insert({
      name: formData.name,
      name_kana: formData.name_kana || null,
      company_name: formData.company_name || null,
      email: formData.email || null,
      phone: formData.phone || null,
      postal_code: formData.postal_code || null,
      address: formData.address || null,
      status: formData.status || 'active',
      memo: formData.memo || null,
    })
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/customers')
  return { success: true, data }
}

export async function updateCustomer(
  id: string,
  formData: CustomerFormData
): Promise<ActionResult<Customer>> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('customers')
    .update({
      name: formData.name,
      name_kana: formData.name_kana || null,
      company_name: formData.company_name || null,
      email: formData.email || null,
      phone: formData.phone || null,
      postal_code: formData.postal_code || null,
      address: formData.address || null,
      status: formData.status,
      memo: formData.memo || null,
    })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/admin/customers')
  revalidatePath(`/admin/customers/${id}`)
  return { success: true, data }
}
