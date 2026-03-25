import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, Font } from '@react-pdf/renderer'
import path from 'path'
import fs from 'fs'
import { createClient } from '@/lib/supabase/server'
import { getContract } from '@/actions/contract-actions'
import { getSystemSettings } from '@/actions/invoice-actions'
import { ContractPDF } from '@/components/contracts/ContractPDF'
import { ContractSpotFee } from '@/types'

export const runtime = 'nodejs'

let fontsRegistered = false
function registerFonts() {
  if (fontsRegistered) return
  const fontsDir = path.join(process.cwd(), 'public', 'fonts')
  const regularPath = path.join(fontsDir, 'NotoSansJP-Regular.ttf')
  const boldPath    = path.join(fontsDir, 'NotoSansJP-Bold.ttf')

  if (fs.existsSync(regularPath)) {
    Font.register({
      family: 'NotoSansJP',
      fonts: [
        { src: regularPath, fontWeight: 'normal' },
        { src: fs.existsSync(boldPath) ? boldPath : regularPath, fontWeight: 'bold' },
      ],
    })
  } else {
    Font.register({
      family: 'NotoSansJP',
      src: 'https://fonts.gstatic.com/s/notosansjp/v53/-F6jfjtqLzI2JPCgQBnw7HFyzSD-AsregP8VFBEj757Y0IyqdA.ttf',
    })
  }
  fontsRegistered = true
}

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 契約データ取得（customer / piano / plan / options 含む）
    const contract = await getContract(params.id)
    if (!contract) {
      return NextResponse.json({ error: 'Contract not found' }, { status: 404 })
    }

    // 初期費用のスポット費用明細を取得
    const { data: initialFees } = await supabase
      .from('contract_spot_fees')
      .select('*')
      .eq('contract_id', params.id)
      .eq('section', 'initial')
      .order('created_at')

    const settings = await getSystemSettings()

    registerFonts()

    const logoPath = path.join(process.cwd(), 'public', 'images', 'logo.png')
    const logoSrc = fs.existsSync(logoPath) ? logoPath : null

    const buffer = await renderToBuffer(
      <ContractPDF
        contract={contract}
        initialFees={(initialFees as ContractSpotFee[]) || []}
        settings={settings}
        logoSrc={logoSrc}
      />
    )

    // ファイル名：CNT-YYYYMM-XXXX.pdf
    const d = new Date(contract.start_date)
    const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
    const short = contract.id.replace(/-/g, '').toUpperCase().slice(0, 4)
    const filename = `CNT-${ym}-${short}.pdf`

    return new NextResponse(buffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error('Contract PDF generation error:', err)
    return NextResponse.json(
      { error: 'PDF generation failed', detail: String(err) },
      { status: 500 }
    )
  }
}
