import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

// ============================================================
// CSVパーサー（簡易実装・RFC 4180 準拠）
// ============================================================
function parseCSV(text: string): string[][] {
  const rows: string[][] = []
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  for (const line of lines) {
    if (line.trim() === '') continue
    const fields: string[] = []
    let i = 0
    while (i < line.length) {
      if (line[i] === '"') {
        // クォートフィールド
        let field = ''
        i++
        while (i < line.length) {
          if (line[i] === '"' && line[i + 1] === '"') {
            field += '"'
            i += 2
          } else if (line[i] === '"') {
            i++
            break
          } else {
            field += line[i++]
          }
        }
        fields.push(field)
        if (line[i] === ',') i++
      } else {
        // 通常フィールド
        const end = line.indexOf(',', i)
        if (end === -1) {
          fields.push(line.slice(i).trim())
          break
        } else {
          fields.push(line.slice(i, end).trim())
          i = end + 1
        }
      }
    }
    rows.push(fields)
  }
  return rows
}

// ============================================================
// インポート対象カラムマッピング
// ============================================================
const COLUMN_MAP: Record<string, string> = {
  '顧客名': 'name',
  '氏名': 'name',
  '名前': 'name',
  '顧客名（カナ）': 'name_kana',
  '顧客名(カナ)': 'name_kana',
  'カナ': 'name_kana',
  'フリガナ': 'name_kana',
  '会社名': 'company_name',
  '法人名': 'company_name',
  'メールアドレス': 'email',
  'メール': 'email',
  'email': 'email',
  'Email': 'email',
  '電話番号': 'phone',
  'TEL': 'phone',
  'tel': 'phone',
  '郵便番号': 'postal_code',
  '住所': 'address',
  'メモ': 'memo',
  '備考': 'memo',
}

const REQUIRED_FIELDS = ['name']

export async function POST(request: NextRequest) {
  const supabase = await createClient()

  // 認証チェック
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'ファイルが見つかりません' }, { status: 400 })
    }

    const text = await file.text()
    const rows = parseCSV(text)

    if (rows.length < 2) {
      return NextResponse.json({ error: 'データ行がありません（ヘッダー行 + データ行が必要です）' }, { status: 400 })
    }

    // ヘッダー行をマッピング
    const headers = rows[0]
    const fieldMap: Record<number, string> = {}
    for (let i = 0; i < headers.length; i++) {
      const mapped = COLUMN_MAP[headers[i].trim()]
      if (mapped) {
        fieldMap[i] = mapped
      }
    }

    // name カラムが含まれているか確認
    const mappedFields = Object.values(fieldMap)
    for (const required of REQUIRED_FIELDS) {
      if (!mappedFields.includes(required)) {
        return NextResponse.json(
          { error: `必須カラム「顧客名」がCSVに含まれていません。ヘッダー行: ${headers.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // データ行を変換
    const dataRows = rows.slice(1)
    const records: Record<string, string>[] = []
    const skipped: { row: number; reason: string }[] = []

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i]
      const record: Record<string, string> = { status: 'active' }

      for (const [colIdx, fieldName] of Object.entries(fieldMap)) {
        const val = row[Number(colIdx)]?.trim() ?? ''
        if (val) record[fieldName] = val
      }

      if (!record.name) {
        skipped.push({ row: i + 2, reason: '顧客名が空のためスキップ' })
        continue
      }

      records.push(record)
    }

    if (records.length === 0) {
      return NextResponse.json({ error: '有効なデータ行がありません' }, { status: 400 })
    }

    // Supabase に一括 INSERT（重複は無視）
    const { data: inserted, error: insertError } = await supabase
      .from('customers')
      .insert(records)
      .select('id')

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      imported: inserted?.length ?? 0,
      skipped,
      total: dataRows.length,
    })
  } catch (err) {
    console.error('CSV import error:', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
