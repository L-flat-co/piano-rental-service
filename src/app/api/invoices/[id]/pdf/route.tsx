import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, Font } from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getInvoice, getSystemSettings } from '@/actions/invoice-actions'
import { InvoicePDF, PDFDocumentType } from '@/components/invoices/InvoicePDF'

// Node.js ランタイムを強制（@react-pdf/renderer は Edge 非対応）
export const runtime = 'nodejs'

// Supabase Storage バケット名
const STORAGE_BUCKET = 'invoice-pdfs'

// ============================================================
// フォント登録（絶対パスで解決・ファイルが存在する場合のみ）
// /public/fonts/NotoSansJP-Regular.ttf を置くと日本語が正しく表示される
// ============================================================
let fontsRegistered = false
function registerFonts() {
  if (fontsRegistered) return
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  const regularPath = path.join(fontsDir, 'NotoSansJP-Regular.ttf')
  const boldPath = path.join(fontsDir, 'NotoSansJP-Bold.ttf')

  if (fs.existsSync(regularPath)) {
    Font.register({
      family: 'NotoSansJP',
      fonts: [
        { src: regularPath, fontWeight: 'normal' },
        { src: fs.existsSync(boldPath) ? boldPath : regularPath, fontWeight: 'bold' },
      ],
    })
    console.log('[PDF] Using local NotoSansJP font')
  } else {
    Font.register({
      family: 'NotoSansJP',
      src: 'https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj757Y0IyqdA.ttf',
    })
    console.log('[PDF] Using CDN NotoSansJP font (place /public/fonts/NotoSansJP-Regular.ttf for offline use)')
  }
  fontsRegistered = true
}

// ============================================================
// Storage 保存（失敗しても PDF 返却は継続）
// ============================================================
async function saveToStorage(
  invoiceId: string,
  invoiceNumber: string,
  buffer: Buffer
): Promise<string | null> {
  try {
    const adminSupabase = createAdminClient()
    const storageKey = `${invoiceNumber}.pdf`

    const { error: uploadError } = await adminSupabase.storage
      .from(STORAGE_BUCKET)
      .upload(storageKey, buffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      console.warn('[PDF Storage] Upload failed:', uploadError.message)
      return null
    }

    // 公開 URL を取得
    const {
      data: { publicUrl },
    } = adminSupabase.storage.from(STORAGE_BUCKET).getPublicUrl(storageKey)

    // invoices テーブルに pdf_url を保存
    await adminSupabase
      .from('invoices')
      .update({ pdf_url: publicUrl })
      .eq('id', invoiceId)

    console.log('[PDF Storage] Saved:', publicUrl)
    return publicUrl
  } catch (err) {
    console.warn('[PDF Storage] Unexpected error:', err)
    return null
  }
}

const VALID_TYPES: PDFDocumentType[] = ['invoice', 'estimate', 'receipt']

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const invoice = await getInvoice(params.id)
    if (!invoice) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // ?type=estimate / ?type=receipt / (default: invoice)
    const typeParam = request.nextUrl.searchParams.get('type') as PDFDocumentType | null
    const documentType: PDFDocumentType =
      typeParam && VALID_TYPES.includes(typeParam) ? typeParam : 'invoice'

    const settings = await getSystemSettings()

    // フォント登録（絶対パス）
    registerFonts()

    // ロゴパスを解決（ファイルが存在する場合のみ渡す）
    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
    const logoSrc = fs.existsSync(logoPath) ? logoPath : null

    // PDF 生成
    const buffer = await renderToBuffer(
      <InvoicePDF invoice={invoice} settings={settings} logoSrc={logoSrc} documentType={documentType} />
    )

    // 請求書のみ Storage に自動保存
    if (documentType === 'invoice') {
      saveToStorage(params.id, invoice.invoice_number, Buffer.from(buffer)).catch(console.warn)
    }

    // ファイル名にタイプを反映
    const filenamePrefix =
      documentType === 'estimate' ? 'EST' :
      documentType === 'receipt'  ? 'RCP' : ''
    const filename = filenamePrefix
      ? `${filenamePrefix}-${invoice.invoice_number}.pdf`
      : `${invoice.invoice_number}.pdf`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('PDF generation error:', err)
    return NextResponse.json(
      { error: 'PDF generation failed', detail: String(err) },
      { status: 500 }
    )
  }
}
