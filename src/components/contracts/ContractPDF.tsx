import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Image,
} from '@react-pdf/renderer'
import { Contract, ContractSpotFee, SystemSettings } from '@/types'

// フォントはAPIルート側で登録する（InvoicePDFと同一の登録コードを使用）

const FONT_FAMILY = 'NotoSansJP'
const NAVY = '#1e3a5f'
const GRAY_BG = '#f5f5f5'
const GRAY_BORDER = '#e0e0e0'
const GRAY_TEXT = '#666666'
const TEXT_DARK = '#1a1a1a'

const styles = StyleSheet.create({
  page: {
    fontFamily: FONT_FAMILY,
    fontSize: 8.5,
    color: TEXT_DARK,
    backgroundColor: '#ffffff',
  },

  // ヘッダー帯
  headerBand: {
    flexDirection: 'row',
    backgroundColor: NAVY,
    height: 64,
    alignItems: 'center',
    paddingHorizontal: 22,
    marginBottom: 0,
  },
  headerLeft: { flex: 1 },
  headerCompanyName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  headerCompanyNameSub: {
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.75)',
    marginTop: 2,
  },
  headerRight: { alignItems: 'flex-end' },
  headerDocTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  headerDocSubtitle: {
    fontSize: 7.5,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
    letterSpacing: 2,
  },

  // コンテンツ
  content: {
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 20,
    flex: 1,
  },

  // 契約番号バー
  metaBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottom: `1px solid ${GRAY_BORDER}`,
  },
  metaBarItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaBarLabel: { fontSize: 7.5, color: GRAY_TEXT },
  metaBarValue: { fontSize: 8.5, fontWeight: 'bold', color: TEXT_DARK },

  // セクションヘッダー
  sectionHeader: {
    backgroundColor: NAVY,
    paddingVertical: 4,
    paddingHorizontal: 8,
    marginBottom: 0,
    borderRadius: 2,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 8.5,
    fontWeight: 'bold',
    color: '#ffffff',
    letterSpacing: 0.5,
  },

  // 2カラム：借主/貸主
  partyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 0,
    border: `1px solid ${GRAY_BORDER}`,
    borderRadius: 2,
    overflow: 'hidden',
  },
  partyCol: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  partyColDivider: {
    borderLeft: `1px solid ${GRAY_BORDER}`,
  },
  partyHeading: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: NAVY,
    marginBottom: 6,
    paddingBottom: 4,
    borderBottom: `0.5px solid ${GRAY_BORDER}`,
    letterSpacing: 0.5,
  },
  partyRow2: { flexDirection: 'row', marginBottom: 3, gap: 4 },
  partyLabel: { fontSize: 7.5, color: GRAY_TEXT, width: 42 },
  partyValue: { fontSize: 8.5, color: TEXT_DARK, flex: 1, lineHeight: 1.5 },
  stampRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 6,
  },
  stampBox: {
    width: 54,
    height: 54,
    border: `0.5px solid ${GRAY_BORDER}`,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampText: {
    fontSize: 10,
    color: '#d0d0d0',
  },

  // 商品・設置情報
  infoTable: {
    border: `1px solid ${GRAY_BORDER}`,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 0,
  },
  infoRow: { flexDirection: 'row', borderBottom: `0.5px solid ${GRAY_BORDER}` },
  infoRowLast: { flexDirection: 'row' },
  infoLabel: {
    width: 88,
    backgroundColor: GRAY_BG,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 7.5,
    color: GRAY_TEXT,
    fontWeight: 'bold',
    borderRight: `0.5px solid ${GRAY_BORDER}`,
  },
  infoValue: {
    flex: 1,
    paddingVertical: 5,
    paddingHorizontal: 8,
    fontSize: 8.5,
    color: TEXT_DARK,
  },
  checkboxText: {
    fontSize: 8,
    color: TEXT_DARK,
  },
  checkboxSelected: {
    fontSize: 8,
    fontWeight: 'bold',
    color: NAVY,
    textDecoration: 'underline',
  },

  // 料金明細テーブル
  feeTableWrap: {
    border: `1px solid ${GRAY_BORDER}`,
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 2,
    marginBottom: 6,
  },
  feeTableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#e8edf3',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `1px solid ${GRAY_BORDER}`,
  },
  feeTableHeaderCell: {
    fontSize: 7.5,
    fontWeight: 'bold',
    color: NAVY,
  },
  feeTableRow: {
    flexDirection: 'row',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderBottom: `0.5px solid #eeeeee`,
  },
  feeTableRowAlt: { backgroundColor: '#fafafa' },
  feeTableCell: { fontSize: 8, color: '#333' },
  colItem:   { flex: 2 },
  colDesc:   { flex: 2 },
  colUnitEx: { width: 60, textAlign: 'right' },
  colAmtIn:  { width: 64, textAlign: 'right' },
  feeSubtotalRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingVertical: 4,
    paddingHorizontal: 6,
    backgroundColor: '#f0f4f8',
    borderTop: `0.5px solid ${GRAY_BORDER}`,
  },
  feeSubtotalLabel: { fontSize: 8, color: GRAY_TEXT, marginRight: 8 },
  feeSubtotalValue: { fontSize: 9, fontWeight: 'bold', color: NAVY, width: 64, textAlign: 'right' },

  // 合計ボックス
  totalBox: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
    marginBottom: 6,
    marginTop: 2,
  },
  totalItem: {
    backgroundColor: NAVY,
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 2,
    alignItems: 'flex-end',
    minWidth: 130,
  },
  totalItemLabel: { fontSize: 7.5, color: 'rgba(255,255,255,0.8)' },
  totalItemValue: { fontSize: 11, fontWeight: 'bold', color: '#ffffff', marginTop: 1 },

  // お支払い情報
  payRow: { flexDirection: 'row', borderBottom: `0.5px solid ${GRAY_BORDER}` },
  payRowLast: { flexDirection: 'row' },
  payLabel: {
    width: 56,
    backgroundColor: GRAY_BG,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 7.5,
    color: GRAY_TEXT,
    fontWeight: 'bold',
    borderRight: `0.5px solid ${GRAY_BORDER}`,
  },
  payValue: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 8,
    color: TEXT_DARK,
  },

  // 契約条件
  conditionItem: {
    flexDirection: 'row',
    marginBottom: 3,
    gap: 4,
    paddingHorizontal: 4,
  },
  conditionNum: { fontSize: 8, color: NAVY, fontWeight: 'bold', width: 14 },
  conditionText: { fontSize: 8, color: '#444', flex: 1, lineHeight: 1.5 },

  // フッター
  footer: {
    backgroundColor: NAVY,
    paddingVertical: 7,
    paddingHorizontal: 22,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerCompany: { fontSize: 7.5, fontWeight: 'bold', color: '#ffffff' },
  footerInfo:    { fontSize: 7, color: 'rgba(255,255,255,0.75)' },
})

function fmt(amount: number): string {
  return `\u00a5${amount.toLocaleString('ja-JP')}`
}

function fmtTax(amountExTax: number): string {
  const inc = Math.round(amountExTax * 1.1)
  return `\u00a5${inc.toLocaleString('ja-JP')}`
}

// 契約書番号を生成 (CNT-YYYYMM-XXXX)
function contractNumber(contract: Contract): string {
  const d = new Date(contract.start_date)
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}`
  const short = contract.id.replace(/-/g, '').toUpperCase().slice(0, 4)
  return `CNT-${ym}-${short}`
}

const CONTRACT_CONDITIONS = [
  '本契約は上記レンタル開始日より発効し、解約通知（30日前）をもって終了します。',
  '1年契約・半年契約の中途解約は、残余期間分または単月換算額の少ない方を申し受けます。',
  '調律は都度ご依頼ください（料金：¥16,500/回）。費用は別途ご請求いたします。',
  '楽器の転貸・譲渡・担保提供は禁止します。',
  '天災・事故等による損傷は、あんしん楽器プランご加入の場合は補償対象となります。',
  '楽器レンタルサービス利用規約（www.l-flat.co.jp/rental-kiyaku）が本契約に適用されます。',
]

interface ContractPDFProps {
  contract: Contract
  initialFees: ContractSpotFee[]
  settings: SystemSettings | null
  logoSrc?: string | null
  contractDate?: string | null  // 契約日（指定がなければ created_at）
}

export function ContractPDF({ contract, initialFees, settings, logoSrc, contractDate }: ContractPDFProps) {
  const companyName    = settings?.company_name || 'L-FLAT MUSIC'
  const postalCode     = settings?.postal_code ? `〒${settings.postal_code}` : ''
  const address        = settings?.address || ''
  const companyAddress = [postalCode, address].filter(Boolean).join(' ')
  const phone          = settings?.phone || ''
  const email          = settings?.email || ''
  const bankInfo       = settings?.bank_info || ''

  const customer = contract.customer
  const piano    = contract.piano
  const plan     = contract.plan

  // 支払方法
  const paymentMethodLabels: Record<string, string> = {
    bank_transfer: '銀行振込',
    cash: '現金',
    card: 'クレジットカード',
    other: 'その他',
  }
  const paymentMethodText = paymentMethodLabels[contract.payment_method || 'bank_transfer'] || '銀行振込'

  const cntNumber = contractNumber(contract)

  // 借主情報
  const borrowerAddress = [
    customer?.postal_code ? `〒${customer.postal_code}` : '',
    customer?.address || '',
  ].filter(Boolean).join(' ')

  // プラン種別（home / school）
  const planType = plan?.plan_type === 'school' ? '教室用' : 'ご家庭用'
  const planTypeOther = plan?.plan_type === 'school' ? 'ご家庭用' : '教室用'

  // 契約期間
  const periodMap: Record<string, string> = {
    yearly: '1年契約',
    half_year: '半年契約',
    monthly: '単月契約',
  }
  const selectedPeriod = periodMap[contract.contract_period] || contract.contract_period
  const otherPeriods = Object.values(periodMap).filter((v) => v !== selectedPeriod)

  // 月額合計
  const planFee = plan?.monthly_fee || 0
  const optionsFee = (contract.options || []).reduce((s, o) => s + o.monthly_fee, 0)
  const customOptionsFee = (contract.custom_options || []).reduce((s, o) => s + o.monthly_fee, 0)
  const monthlyTotal = planFee + optionsFee + customOptionsFee

  // 初期費用合計（税込換算）
  const initialFeesTotal = initialFees.reduce((s, f) => s + Math.round(f.amount * f.quantity * 1.1), 0)

  // 開始日フォーマット
  const startDate = contract.start_date
    ? new Date(contract.start_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '____年____月____日'
  const contractedAtSrc = contractDate || contract.created_at
  const contractedAt = contractedAtSrc
    ? new Date(contractedAtSrc).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
    : '____年____月____日'

  return (
    <Document>
      <Page size="A4" style={styles.page}>

        {/* ========== ヘッダー帯 ========== */}
        <View style={styles.headerBand}>
          <View style={styles.headerLeft}>
            {logoSrc ? (
              <Image
                src={logoSrc}
                style={{ height: 48, maxWidth: 220, objectFit: 'contain', objectPositionX: 0 }}
              />
            ) : (
              <Text style={styles.headerCompanyName}>{companyName}</Text>
            )}
            {companyAddress ? (
              <Text style={styles.headerCompanyNameSub}>{companyAddress}</Text>
            ) : null}
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.headerDocTitle}>ピアノレンタル契約書</Text>
            <Text style={styles.headerDocSubtitle}>LEASING PIANO AGREEMENT</Text>
          </View>
        </View>

        {/* ========== コンテンツ ========== */}
        <View style={styles.content}>

          {/* 契約番号バー */}
          <View style={styles.metaBar}>
            <View style={styles.metaBarItem}>
              <Text style={styles.metaBarLabel}>契約番号</Text>
              <Text style={styles.metaBarValue}>{cntNumber}</Text>
            </View>
            <View style={styles.metaBarItem}>
              <Text style={styles.metaBarLabel}>契約日</Text>
              <Text style={styles.metaBarValue}>{contractedAt}</Text>
            </View>
            <View style={styles.metaBarItem}>
              <Text style={styles.metaBarLabel}>見積番号</Text>
              <Text style={styles.metaBarValue}>—</Text>
            </View>
          </View>

          {/* 借主 / 貸主 2カラム */}
          <View style={styles.partyRow}>
            {/* 借主 */}
            <View style={styles.partyCol}>
              <Text style={styles.partyHeading}>借 主（お客様）</Text>
              <View style={styles.partyRow2}>
                <Text style={styles.partyLabel}>お名前</Text>
                <Text style={styles.partyValue}>{customer?.name || '—'} 様</Text>
              </View>
              <View style={styles.partyRow2}>
                <Text style={styles.partyLabel}>ご住所</Text>
                <Text style={styles.partyValue}>{borrowerAddress || '—'}</Text>
              </View>
              <View style={styles.partyRow2}>
                <Text style={styles.partyLabel}>電話</Text>
                <Text style={styles.partyValue}>{customer?.phone || '—'}</Text>
              </View>
              <View style={styles.partyRow2}>
                <Text style={styles.partyLabel}>メール</Text>
                <Text style={[styles.partyValue, { fontSize: (customer?.email?.length || 0) > 24 ? 7 : 8.5 }]}>
                  {customer?.email || '—'}
                </Text>
              </View>
              <View style={styles.stampRow}>
                <View style={styles.stampBox}>
                  <Text style={styles.stampText}>印</Text>
                </View>
              </View>
            </View>

            {/* 貸主 */}
            <View style={[styles.partyCol, styles.partyColDivider]}>
              <Text style={styles.partyHeading}>貸 主</Text>
              <View style={styles.partyRow2}>
                <Text style={styles.partyLabel}>会社名</Text>
                <Text style={styles.partyValue}>{companyName}</Text>
              </View>
              <View style={styles.partyRow2}>
                <Text style={styles.partyLabel}>住所</Text>
                <Text style={styles.partyValue}>{companyAddress || '—'}</Text>
              </View>
              <View style={styles.partyRow2}>
                <Text style={styles.partyLabel}>電話</Text>
                <Text style={styles.partyValue}>{phone || '—'}</Text>
              </View>
              <View style={styles.partyRow2}>
                <Text style={styles.partyLabel}>担当者</Text>
                <Text style={styles.partyValue}></Text>
              </View>
              <View style={styles.stampRow}>
                <View style={styles.stampBox}>
                  <Text style={styles.stampText}>印</Text>
                </View>
              </View>
            </View>
          </View>

          {/* レンタル商品・設置情報 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>レンタル商品・設置情報</Text>
          </View>
          <View style={styles.infoTable}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>レンタル商品</Text>
              <Text style={styles.infoValue}>
                {piano ? `${piano.maker} ${piano.model}${piano.serial_number ? `（シリアル番号：${piano.serial_number}）` : ''}` : '—'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>付属品</Text>
              <Text style={styles.infoValue}>
                {(contract.accessories && contract.accessories.length > 0)
                  ? contract.accessories.filter(Boolean).join('・')
                  : 'ピアノ椅子・インシュレーター'}
              </Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>設置場所</Text>
              <Text style={styles.infoValue}>{borrowerAddress || '借主住所と同じ'}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>プラン</Text>
              <View style={[styles.infoValue, { flexDirection: 'row', gap: 12 }]}>
                <Text style={styles.checkboxSelected}>■ {planType}</Text>
                <Text style={styles.checkboxText}>□ {planTypeOther}</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>契約形態</Text>
              <View style={[styles.infoValue, { flexDirection: 'row', gap: 12 }]}>
                <Text style={styles.checkboxSelected}>■ {selectedPeriod}</Text>
                {otherPeriods.map((p) => (
                  <Text key={p} style={styles.checkboxText}>□ {p}</Text>
                ))}
                <Text style={styles.checkboxText}>継続可</Text>
              </View>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>レンタル開始日</Text>
              <Text style={styles.infoValue}>{startDate}</Text>
            </View>
            <View style={styles.infoRowLast}>
              <Text style={styles.infoLabel}>契約終了日</Text>
              <Text style={styles.infoValue}>
                {contract.end_date
                  ? new Date(contract.end_date).toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })
                  : '（未定の場合は空欄・解約通知で終了）'}
              </Text>
            </View>
          </View>

          {/* 料金明細 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>料金明細</Text>
          </View>

          {/* 初期費用 */}
          {initialFees.length > 0 && (
            <>
              <Text style={{ fontSize: 7.5, color: GRAY_TEXT, marginTop: 4, marginLeft: 2, marginBottom: 1 }}>
                【初期費用】
              </Text>
              <View style={styles.feeTableWrap}>
                <View style={styles.feeTableHeaderRow}>
                  <Text style={[styles.feeTableHeaderCell, styles.colItem]}>項目</Text>
                  <Text style={[styles.feeTableHeaderCell, styles.colDesc]}>内容</Text>
                  <Text style={[styles.feeTableHeaderCell, styles.colUnitEx]}>単価（税抜）</Text>
                  <Text style={[styles.feeTableHeaderCell, styles.colAmtIn]}>金額（税込）</Text>
                </View>
                {initialFees.filter((f) => f.memo !== 'pickup_pending').map((fee, i) => {
                  // memo から内部データ（pickup_estimate:xxx）を除去して表示用に変換
                  const displayMemo = fee.memo?.startsWith('pickup_estimate:') ? '搬入' : (fee.memo || '')
                  return (
                    <View
                      key={fee.id}
                      style={[styles.feeTableRow, i % 2 === 1 ? styles.feeTableRowAlt : {}]}
                    >
                      <Text style={[styles.feeTableCell, styles.colItem]}>{fee.label}</Text>
                      <Text style={[styles.feeTableCell, styles.colDesc]}>{displayMemo}</Text>
                      <Text style={[styles.feeTableCell, styles.colUnitEx]}>{fmt(fee.amount)}</Text>
                      <Text style={[styles.feeTableCell, styles.colAmtIn]}>
                        {fmt(Math.round(fee.amount * fee.quantity * 1.1))}
                      </Text>
                    </View>
                  )
                })}
                <View style={styles.feeSubtotalRow}>
                  <Text style={styles.feeSubtotalLabel}>初期費用 合計</Text>
                  <Text style={styles.feeSubtotalValue}>{fmt(initialFeesTotal)}</Text>
                </View>
              </View>
              {/* 搬出参考金額（欄外・薄文字・右寄せ） */}
              {initialFees.filter((f) => f.memo === 'pickup_pending').map((fee) => (
                <Text key={fee.id} style={{ fontSize: 7, color: '#aaaaaa', marginTop: 1, textAlign: 'right', paddingRight: 6 }}>
                  ＊参考搬出費用 {fmt(Math.round(fee.amount * 1.1))}（税込）
                </Text>
              ))}
            </>
          )}

          {/* 月額費用 */}
          <Text style={{ fontSize: 7.5, color: GRAY_TEXT, marginTop: 4, marginLeft: 2, marginBottom: 1 }}>
            【月額費用】
          </Text>
          <View style={styles.feeTableWrap}>
            <View style={styles.feeTableHeaderRow}>
              <Text style={[styles.feeTableHeaderCell, styles.colItem]}>項目</Text>
              <Text style={[styles.feeTableHeaderCell, styles.colDesc]}>内容</Text>
              <Text style={[styles.feeTableHeaderCell, styles.colUnitEx]}>単価（税抜）</Text>
              <Text style={[styles.feeTableHeaderCell, styles.colAmtIn]}>金額（税込）</Text>
            </View>
            {plan && (
              <View style={styles.feeTableRow}>
                <Text style={[styles.feeTableCell, styles.colItem]}>基本レンタル料</Text>
                <Text style={[styles.feeTableCell, styles.colDesc]}>{plan.name}</Text>
                <Text style={[styles.feeTableCell, styles.colUnitEx]}>
                  {fmt(Math.round(plan.monthly_fee / 1.1))}
                </Text>
                <Text style={[styles.feeTableCell, styles.colAmtIn]}>{fmt(plan.monthly_fee)}</Text>
              </View>
            )}
            {(contract.options || []).map((opt, i) => (
              <View
                key={opt.id}
                style={[styles.feeTableRow, i % 2 === 0 && plan ? styles.feeTableRowAlt : {}]}
              >
                <Text style={[styles.feeTableCell, styles.colItem]}>{opt.name}</Text>
                <Text style={[styles.feeTableCell, styles.colDesc]}>{opt.description || '任意加入'}</Text>
                <Text style={[styles.feeTableCell, styles.colUnitEx]}>
                  {fmt(Math.round(opt.monthly_fee / 1.1))}
                </Text>
                <Text style={[styles.feeTableCell, styles.colAmtIn]}>{fmt(opt.monthly_fee)}</Text>
              </View>
            ))}
            {/* カスタム月額オプション */}
            {(contract.custom_options || []).map((co, i) => (
              <View
                key={`custom-${i}`}
                style={[styles.feeTableRow, (contract.options?.length || 0) % 2 !== 0 ? styles.feeTableRowAlt : {}]}
              >
                <Text style={[styles.feeTableCell, styles.colItem]}>{co.name}</Text>
                <Text style={[styles.feeTableCell, styles.colDesc]}></Text>
                <Text style={[styles.feeTableCell, styles.colUnitEx]}>
                  {fmt(Math.round(co.monthly_fee / 1.1))}
                </Text>
                <Text style={[styles.feeTableCell, styles.colAmtIn]}>{fmt(co.monthly_fee)}</Text>
              </View>
            ))}
            <View style={styles.feeSubtotalRow}>
              <Text style={styles.feeSubtotalLabel}>月額費用 合計</Text>
              <Text style={styles.feeSubtotalValue}>{fmt(monthlyTotal)} /月</Text>
            </View>
          </View>

          {/* 合計ボックス */}
          <View style={styles.totalBox}>
            {initialFees.length > 0 && (
              <View style={styles.totalItem}>
                <Text style={styles.totalItemLabel}>初期費用（税込）</Text>
                <Text style={styles.totalItemValue}>{fmt(initialFeesTotal)}</Text>
              </View>
            )}
            <View style={styles.totalItem}>
              <Text style={styles.totalItemLabel}>月額費用（税込）</Text>
              <Text style={styles.totalItemValue}>{fmt(monthlyTotal)} /月</Text>
            </View>
          </View>

          {/* お支払い情報（ページまたぎ防止） */}
          <View wrap={false}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>お支払い情報</Text>
          </View>
          <View style={[styles.infoTable, { marginTop: 2, marginBottom: 6 }]}>
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>支払方法</Text>
              <Text style={styles.payValue}>{paymentMethodText}</Text>
            </View>
            <View style={styles.payRow}>
              <Text style={styles.payLabel}>振込先</Text>
              <Text style={styles.payValue}>{bankInfo || '　'}</Text>
            </View>
            <View style={styles.payRowLast}>
              <Text style={styles.payLabel}>支払期限</Text>
              <Text style={styles.payValue}>
                {`毎月 ${Math.min(contract.billing_day, 28) - 1} 日（ご請求書はお支払期限の${settings?.invoice_due_days ?? 14}日ほど前に発行されます）`}
              </Text>
            </View>
          </View>

          {/* 契約条件 */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionHeaderText}>契約条件</Text>
          </View>
          <View style={{ marginTop: 4 }}>
            {CONTRACT_CONDITIONS.map((cond, i) => (
              <View key={i} style={styles.conditionItem}>
                <Text style={styles.conditionNum}>{'①②③④⑤⑥'[i]}</Text>
                <Text style={styles.conditionText}>{cond}</Text>
              </View>
            ))}
          </View>
          </View>{/* wrap={false} 閉じ */}

        </View>

        {/* ========== フッター ========== */}
        <View style={styles.footer} fixed>
          <Text style={styles.footerCompany}>{companyName}</Text>
          <Text style={styles.footerInfo}>
            {[companyAddress, phone ? `TEL: ${phone}` : '', email].filter(Boolean).join('  |  ')}
          </Text>
        </View>

      </Page>
    </Document>
  )
}
