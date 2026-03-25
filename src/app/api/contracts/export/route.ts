import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CONTRACT_STATUS_LABELS, CONTRACT_PERIOD_LABELS } from '@/lib/constants'

export const runtime = 'nodejs'

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  // カンマ・ダブルクォート・改行が含まれる場合はクォートで囲む
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function toRow(fields: (string | number | null | undefined)[]): string {
  return fields.map(escapeCSV).join(',')
}

export async function GET(_request: NextRequest) {
  const supabase = await createClient()

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 契約データ取得（関連テーブルJOIN）
  const { data: contracts, error } = await supabase
    .from('contracts')
    .select(`
      id,
      status,
      start_date,
      end_date,
      contract_period,
      transport_type,
      installation_address,
      monthly_total,
      created_at,
      customer:customers(name, name_kana, email, phone, postal_code, address),
      plan:rental_plans(name, plan_type, monthly_fee),
      piano:pianos(maker, model, serial_number, piano_type)
    `)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // ヘッダー行
  const headers = [
    '契約ID',
    'ステータス',
    '顧客名',
    '顧客名（カナ）',
    'メールアドレス',
    '電話番号',
    '郵便番号',
    '顧客住所',
    'プラン名',
    'プラン種別',
    '契約期間',
    '開始日',
    '終了日',
    '輸送区分',
    '設置住所',
    '月額合計（税込）',
    'ピアノメーカー',
    'ピアノ機種',
    'シリアル番号',
    'ピアノ種別',
    '登録日',
  ]

  const PLAN_TYPE_LABELS: Record<string, string> = {
    home: 'ご家庭用',
    school: '教室用',
  }
  const TRANSPORT_LABELS: Record<string, string> = {
    round_trip: '往復',
    one_way_delivery: '片道（配送のみ）',
    one_way_return: '片道（返却のみ）',
    customer_pickup: 'お客様引取り',
  }
  const PIANO_TYPE_LABELS: Record<string, string> = {
    upright: 'アップライト',
    grand: 'グランド',
    digital: 'デジタル',
  }

  const rows = (contracts || []).map((c) => {
    const customer = Array.isArray(c.customer) ? c.customer[0] : c.customer
    const plan     = Array.isArray(c.plan) ? c.plan[0] : c.plan
    const piano    = Array.isArray(c.piano) ? c.piano[0] : c.piano

    return toRow([
      c.id,
      CONTRACT_STATUS_LABELS[c.status as keyof typeof CONTRACT_STATUS_LABELS] ?? c.status,
      customer?.name,
      customer?.name_kana,
      customer?.email,
      customer?.phone,
      customer?.postal_code,
      customer?.address,
      plan?.name,
      PLAN_TYPE_LABELS[plan?.plan_type ?? ''] ?? plan?.plan_type,
      CONTRACT_PERIOD_LABELS[c.contract_period as keyof typeof CONTRACT_PERIOD_LABELS] ?? c.contract_period,
      c.start_date,
      c.end_date,
      TRANSPORT_LABELS[c.transport_type ?? ''] ?? c.transport_type,
      c.installation_address,
      c.monthly_total,
      piano?.maker,
      piano?.model,
      piano?.serial_number,
      PIANO_TYPE_LABELS[piano?.piano_type ?? ''] ?? piano?.piano_type,
      c.created_at ? c.created_at.slice(0, 10) : '',
    ])
  })

  // BOM付きUTF-8（Excelで文字化けしないように）
  const BOM = '\uFEFF'
  const csv = BOM + [toRow(headers), ...rows].join('\r\n')

  const now = new Date()
  const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="contracts_${dateStr}.csv"`,
    },
  })
}
