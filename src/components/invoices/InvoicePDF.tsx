import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import { Invoice, SystemSettings } from '@/types'

// フォントはAPIルート側で登録する（絶対パス必須のため）
// /public/fonts/NotoSansJP-Regular.ttf が存在すればAPIルートで登録される

const FONT_FAMILY = 'NotoSansJP'
const NAVY = '#1e3a5f'
const NAVY_LIGHT = '#2d5a8e'
const GRAY_BG = '#f5f5f5'
const GRAY_BORDER = '#e0e0e0'
const GRAY_TEXT = '#666666'
const TEXT_DARK = '#1a1a1a'

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 9,
    color: TEXT_DARK,
    backgroundColor: '#ffffff',
  },

  // =========================================
  // ヘッダー帯（ページ上部）
  // =========================================
  headerBand: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    height: 70,
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 0,
  },
  headerLeft: {
    flex: 1,
  },
  headerCompanyName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerCompanyNameSub: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  headerDocTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerDocSubtitle: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    letterSpacing: 2,
  },

  // =========================================
  // コンテンツエリア
  // =========================================
  content: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 24,
    flex: 1,
  },

  // =========================================
  // 書類番号・日付行
  // =========================================
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottom: `1px solid ${GRAY_BORDER}`,
  },
  metaBarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaBarLabel: {
    fontSize: 8,
    color: GRAY_TEXT,
  },
  metaBarValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: TEXT_DARK,
  },

  // =========================================
  // 宛先・発行者（2カラム）
  // =========================================
  infoRow: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 16,
  },
  billToBox: {
    flex: 1,
    borderLeft: `3px solid ${NAVY}`,
    paddingLeft: 10,
    paddingVertical: 4,
  },
  billToLabel: {
    fontSize: 7.5,
    color: GRAY_TEXT,
    marginBottom: 3,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  billToName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: TEXT_DARK,
    marginBottom: 4,
  },
  billToAddress: {
    fontSize: 8.5,
    color: '#444',
    lineHeight: 1.6,
  },
  issuerBox: {
    width: 180,
    paddingTop: 4,
  },
  issuerCompanyName: {
    fontSize: 10,
    fontWeight: 'bold',
    color: NAVY,
    marginBottom: 3,
  },
  issuerInfo: {
    fontSize: 8,
    color: '#555',
    lineHeight: 1.6,
  },

  // =========================================
  // セクションヘッダー
  // =========================================
  sectionHeader: {
    backgroundColor: NAVY,
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginBottom: 0,
    borderRadius: 2,
  },
  sectionHeaderText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // =========================================
  // 明細テーブル
  // =========================================
  table: {
    marginBottom: 10,
    border: `1px solid ${GRAY_BORDER}`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e8edf3',
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderBottom: `1px solid ${GRAY_BORDER}`,
  },
  tableHeaderCell: {
    fontSize: 8,
    fontWeight: 'bold',
    color: NAVY,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderBottom: `0.5px solid #eeeeee`,
  },
  tableRowAlt: {
    backgroundColor: '#fafafa',
  },
  tableCell: {
    fontSize: 9,
    color: '#333',
  },
  colLabel: { flex: 3 },
  colUnit:  { width: 72, textAlign: 'right' },
  colQty:   { width: 36, textAlign: 'center' },
  colAmount:{ width: 80, textAlign: 'right' },

  // =========================================
  // 合計セクション
  // =========================================
  totalSection: {
    alignItems: 'flex-end',
    marginBottom: 20,
  },
  totalTableWrap: {
    width: 260,
    border: `1px solid ${GRAY_BORDER}`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  totalRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderBottom: `0.5px solid ${GRAY_BORDER}`,
  },
  totalLabel: {
    flex: 1,
    fontSize: 9,
    color: GRAY_TEXT,
  },
  totalValue: {
    fontSize: 9,
    color: TEXT_DARK,
    textAlign: 'right',
    width: 80,
  },
  grandTotalRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: NAVY,
    alignItems: 'center',
  },
  grandTotalLabel: {
    flex: 1,
    fontSize: 10,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  grandTotalValue: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
  },

  // =========================================
  // 備考・振込先
  // =========================================
  notesSection: {
    marginTop: 4,
  },
  notesHeader: {
    fontSize: 8,
    fontWeight: 'bold',
    color: GRAY_TEXT,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesBody: {
    fontSize: 8.5,
    color: '#555',
    lineHeight: 1.7,
    backgroundColor: GRAY_BG,
    padding: 8,
    borderRadius: 2,
    borderLeft: `3px solid ${GRAY_BORDER}`,
  },

  // =========================================
  // フッター
  // =========================================
  footer: {
    backgroundColor: NAVY,
    paddingVertical: 8,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerCompany: {
    fontSize: 8,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  footerInfo: {
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.75)',
  },
})

function fmt(amount: number): string {
  return `\u00a5${amount.toLocaleString('ja-JP')}`
}

export type PDFDocumentType = 'invoice' | 'estimate' | 'receipt'

const DOC_META: Record<
  PDFDocumentType,
  {
    title: string
    subtitle: string
    numberLabel: string
    dueDateLabel: string
    toLabel: string
    sectionLabel: string
    showBankInfo: boolean
  }
> = {
  invoice: {
    title: '請求書',
    subtitle: 'INVOICE',
    numberLabel: '請求書番号',
    dueDateLabel: '支払期限',
    toLabel: '請求先',
    sectionLabel: '料金明細',
    showBankInfo: true,
  },
  estimate: {
    title: '見積書',
    subtitle: 'ESTIMATE',
    numberLabel: '見積書番号',
    dueDateLabel: '有効期限',
    toLabel: 'お見積先',
    sectionLabel: '御見積内容',
    showBankInfo: false,
  },
  receipt: {
    title: '領収書',
    subtitle: 'RECEIPT',
    numberLabel: '領収書番号',
    dueDateLabel: '',
    toLabel: '宛先',
    sectionLabel: '内訳',
    showBankInfo: false,
  },
}

interface InvoicePDFProps {
  invoice: Invoice
  settings: SystemSettings | null
  logoSrc?: string | null
  documentType?: PDFDocumentType
}

export function InvoicePDF({ invoice, settings, logoSrc, documentType = 'invoice' }: InvoicePDFProps) {
  const meta = DOC_META[documentType]

  const companyName  = settings?.company_name || 'L-FLAT MUSIC'
  const postalCode   = settings?.postal_code ? `\u3012${settings.postal_code}` : ''
  const address      = settings?.address || ''
  const companyAddress = [postalCode, address].filter(Boolean).join(' ')
  const phone        = settings?.phone || ''
  const email        = settings?.email || ''
  const bankInfo     = meta.showBankInfo ? (settings?.bank_info || '') : ''

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ========== ヘッダー帯 ========== */}
        <View style={styles.headerBand}>
          <View style={styles.headerLeft}>
            {logoSrc ? (
              <Image
                src={logoSrc}
                style={{ height: 56, maxWidth: 260, objectFit: 'contain', objectPositionX: 0 }}
              />
            ) : (
              <Text style={styles.headerCompanyName}>{companyName}</Text>
            )}
            {companyAddress ? (
              <Text style={styles.headerCompanyNameSub}>{companyAddress}</Text>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDocTitle}>{meta.title}</Text>
            <Text style={styles.headerDocSubtitle}>{meta.subtitle}</Text>
          </View>
        </View>

        {/* ========== コンテンツ ========== */}
        <View style={styles.content}>

          {/* 書類番号・日付 */}
          <View style={styles.metaBar}>
            <View style={styles.metaBarItem}>
              <Text style={styles.metaBarLabel}>{meta.numberLabel}</Text>
              <Text style={styles.metaBarValue}>{invoice.invoice_number}</Text>
            </View>
            <View style={styles.metaBarItem}>
              <Text style={styles.metaBarLabel}>発行日</Text>
              <Text style={styles.metaBarValue}>{invoice.issue_date}</Text>
            </View>
            {invoice.due_date && meta.dueDateLabel ? (
              <View style={styles.metaBarItem}>
                <Text style={styles.metaBarLabel}>{meta.dueDateLabel}</Text>
                <Text style={styles.metaBarValue}>{invoice.due_date}</Text>
              </View>
            ) : null}
            {invoice.billing_month && documentType === 'invoice' ? (
              <View style={styles.metaBarItem}>
                <Text style={styles.metaBarLabel}>対象月</Text>
                <Text style={styles.metaBarValue}>
                  {invoice.billing_month.replace('-', '年') + '月'}
                </Text>
              </View>
            ) : null}
          </View>

          {/* 宛先・発行者 2カラム */}
          <View style={styles.infoRow}>
            <View style={styles.billToBox}>
              <Text style={styles.billToLabel}>{meta.toLabel}</Text>
              <Text style={styles.billToName}>{invoice.customer?.name} 様</Text>
              {invoice.customer?.address ? (
                <Text style={styles.billToAddress}>{invoice.customer.address}</Text>
              ) : null}
              {invoice.customer?.phone ? (
                <Text style={styles.billToAddress}>TEL: {invoice.customer.phone}</Text>
              ) : null}
              {invoice.customer?.email ? (
                <Text style={styles.billToAddress}>{invoice.customer.email}</Text>
              ) : null}
            </View>
            <View style={styles.issuerBox}>
              <Text style={styles.issuerCompanyName}>{companyName}</Text>
              {companyAddress ? (
                <Text style={styles.issuerInfo}>{companyAddress}</Text>
              ) : null}
              {phone ? (
                <Text style={styles.issuerInfo}>TEL: {phone}</Text>
              ) : null}
              {email ? (
                <Text style={styles.issuerInfo}>{email}</Text>
              ) : null}
            </View>
          </View>

          {/* 明細セクション */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>{meta.sectionLabel}</Text>
          </View>
          <View style={styles.table}>
            <View style={styles.tableHeaderRow}>
              <Text style={[styles.tableHeaderCell, styles.colLabel]}>品目</Text>
              <Text style={[styles.tableHeaderCell, styles.colUnit]}>単価（税抜）</Text>
              <Text style={[styles.tableHeaderCell, styles.colQty]}>数量</Text>
              <Text style={[styles.tableHeaderCell, styles.colAmount]}>金額（税抜）</Text>
            </View>
            {(invoice.items || []).map((item, i) => (
              <View
                key={item.id}
                style={[styles.tableRow, i % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={[styles.tableCell, styles.colLabel]}>{item.label}</Text>
                <Text style={[styles.tableCell, styles.colUnit]}>{fmt(item.unit_price)}</Text>
                <Text style={[styles.tableCell, styles.colQty]}>{item.quantity}</Text>
                <Text style={[styles.tableCell, styles.colAmount]}>{fmt(item.amount)}</Text>
              </View>
            ))}
          </View>

          {/* 合計 */}
          <View style={styles.totalSection}>
            <View style={styles.totalTableWrap}>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>小計（税抜）</Text>
                <Text style={styles.totalValue}>{fmt(invoice.subtotal)}</Text>
              </View>
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>消費税（10%）</Text>
                <Text style={styles.totalValue}>{fmt(invoice.tax_amount)}</Text>
              </View>
              <View style={styles.grandTotalRow}>
                <Text style={styles.grandTotalLabel}>合計（税込）</Text>
                <Text style={styles.grandTotalValue}>{fmt(invoice.total_amount)}</Text>
              </View>
            </View>
          </View>

          {/* 備考・振込先 */}
          {(invoice.notes || bankInfo) ? (
            <View style={styles.notesSection}>
              <Text style={styles.notesHeader}>備考 / 振込先</Text>
              <View style={styles.notesBody}>
                {bankInfo ? <Text>{bankInfo}</Text> : null}
                {invoice.notes ? <Text>{invoice.notes}</Text> : null}
              </View>
            </View>
          ) : null}

        </View>

        {/* ========== フッター ========== */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerCompany}>{companyName}</Text>
          <Text style={styles.footerInfo}>
            {[phone ? `TEL: ${phone}` : '', email].filter(Boolean).join('  |  ')}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
