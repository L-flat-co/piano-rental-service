'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { resend, FROM_EMAIL } from '@/lib/resend'
import { getInvoice } from '@/actions/invoice-actions'
import { ActionResult } from '@/types'

// ============================================================
// 請求書メール送信
// ============================================================

export async function sendInvoiceEmail(
  invoiceId: string,
  options: {
    to: string
    subject?: string
    message?: string
  }
): Promise<ActionResult<void>> {
  // RESEND_API_KEY 未設定チェック
  if (!process.env.RESEND_API_KEY) {
    return {
      success: false,
      error: 'RESEND_API_KEY が設定されていません。.env.local に設定してください。',
    }
  }

  const supabase = await createClient()

  // 認証チェック
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Unauthorized' }
  }

  // 請求書取得
  const invoice = await getInvoice(invoiceId)
  if (!invoice) {
    return { success: false, error: '請求書が見つかりません' }
  }

  const customerName = invoice.customer?.name || 'お客様'

  // 金額フォーマット
  const formatCurrency = (n: number) =>
    n.toLocaleString('ja-JP', { style: 'currency', currency: 'JPY' })

  // 対象月フォーマット
  const billingMonthStr = invoice.billing_month
    ? invoice.billing_month.replace('-', '年') + '月分'
    : ''

  const subject =
    options.subject ||
    `【請求書】${billingMonthStr} ${formatCurrency(invoice.total_amount)}`

  // PDF リンク
  const pdfSection = invoice.pdf_url
    ? `<p style="margin:16px 0;">
        <a href="${invoice.pdf_url}"
           style="display:inline-block;padding:10px 20px;background:#1e3a5f;color:#fff;text-decoration:none;border-radius:6px;font-size:14px;">
          請求書PDFをダウンロード
        </a>
       </p>`
    : `<p style="color:#6b7280;font-size:13px;">
        ※ 請求書PDFはこちらのURLよりご確認ください：
        <a href="${process.env.NEXT_PUBLIC_APP_URL || ''}/api/invoices/${invoiceId}/pdf">
          ${invoice.invoice_number}.pdf
        </a>
       </p>`

  // カスタムメッセージ
  const messageSection = options.message
    ? `<div style="background:#f8fafc;border-left:4px solid #1e3a5f;padding:12px 16px;margin:16px 0;font-size:14px;color:#374151;white-space:pre-line;">${options.message}</div>`
    : ''

  // 支払期限
  const dueDateStr = invoice.due_date
    ? new Date(invoice.due_date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const html = `<!DOCTYPE html>
<html lang="ja">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:600px;margin:32px auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

    <!-- ヘッダー -->
    <div style="background:#1e3a5f;padding:28px 32px;">
      <p style="color:#fff;font-size:20px;font-weight:700;margin:0;">請求書のご案内</p>
    </div>

    <!-- 本文 -->
    <div style="padding:28px 32px;">
      <p style="color:#374151;font-size:15px;margin:0 0 16px;">${customerName} 様</p>
      <p style="color:#374151;font-size:14px;line-height:1.6;margin:0 0 20px;">
        いつもご利用ありがとうございます。<br>
        以下の通り、ご請求書を発行いたしました。
      </p>

      ${messageSection}

      <!-- 請求書情報テーブル -->
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 20px;">
        <tr>
          <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;color:#6b7280;width:40%;font-weight:500;">請求書番号</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111827;font-family:monospace;">${invoice.invoice_number}</td>
        </tr>
        ${
          billingMonthStr
            ? `<tr>
          <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;color:#6b7280;font-weight:500;">対象月</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111827;">${billingMonthStr}</td>
        </tr>`
            : ''
        }
        <tr>
          <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;color:#6b7280;font-weight:500;">発行日</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111827;">
            ${new Date(invoice.issue_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
          </td>
        </tr>
        ${
          dueDateStr
            ? `<tr>
          <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;color:#6b7280;font-weight:500;">お支払期限</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#111827;">${dueDateStr}</td>
        </tr>`
            : ''
        }
        <tr>
          <td style="padding:10px 12px;background:#f8fafc;border:1px solid #e5e7eb;color:#6b7280;font-weight:500;">ご請求金額（税込）</td>
          <td style="padding:10px 12px;border:1px solid #e5e7eb;color:#1e3a5f;font-size:18px;font-weight:700;">${formatCurrency(invoice.total_amount)}</td>
        </tr>
      </table>

      ${pdfSection}

      <p style="color:#6b7280;font-size:13px;margin:20px 0 0;line-height:1.6;">
        ご不明な点がございましたら、お気軽にお問い合わせください。<br>
        引き続きよろしくお願いいたします。
      </p>
    </div>

    <!-- フッター -->
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e5e7eb;">
      <p style="margin:0;color:#9ca3af;font-size:12px;">
        このメールはピアノレンタルサービス管理システムより自動送信されています。
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const { error: sendError } = await resend.emails.send({
      from: FROM_EMAIL,
      to: [options.to],
      subject,
      html,
    })

    if (sendError) {
      return { success: false, error: sendError.message }
    }

    // 請求書を「発行済み」に更新（下書きの場合のみ）
    if (invoice.status === 'draft') {
      await supabase
        .from('invoices')
        .update({ status: 'issued' })
        .eq('id', invoiceId)
    }

    revalidatePath('/admin/invoices')
    revalidatePath(`/admin/invoices/${invoiceId}`)
    return { success: true, data: undefined }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}
