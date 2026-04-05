'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { StringContractFormData, createStringContract, updateStringContract } from '@/actions/string-contract-actions'
import { StringContract, StringInstrument, StringRentalPlan, Customer, StringRentalType, PaymentMethod } from '@/types'
import { STRING_TYPE_LABELS, STRING_RENTAL_TYPE_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  bank_transfer: '銀行振込',
  direct_debit: '口座振替',
  cash: '現金',
  card: 'クレジットカード',
  cod: '代引',
  other: 'その他',
}

interface Props {
  contract?: StringContract
  customers: Customer[]
  availableInstruments: StringInstrument[]
  plans: StringRentalPlan[]
}

export function StringContractForm({ contract, customers, availableInstruments, plans }: Props) {
  const router = useRouter()
  const isEdit = !!contract

  // 編集時は現在の楽器を含める
  const instrumentOptions = isEdit
    ? [
        ...(contract.instrument ? [contract.instrument as StringInstrument] : []),
        ...availableInstruments.filter((i) => i.id !== contract?.instrument_id),
      ]
    : availableInstruments

  const [formData, setFormData] = useState<StringContractFormData>({
    customer_id: contract?.customer_id || '',
    instrument_id: contract?.instrument_id || '',
    plan_id: contract?.plan_id || '',
    rental_type: contract?.rental_type || 'subscription',
    start_date: contract?.start_date || '',
    billing_day: contract?.billing_day || 1,
    payment_method: contract?.payment_method || 'bank_transfer',
    application_date: contract?.application_date || '',
    rule_type: contract?.rule_type || 'A',
    has_insurance: contract?.has_insurance || false,
    shipping_fee: contract?.shipping_fee || 0,
    delivery_method: contract?.delivery_method || '',
    memo: contract?.memo || '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof StringContractFormData>(key: K, value: StringContractFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  // 選択中の楽器
  const selectedInstrument = instrumentOptions.find((i) => i.id === formData.instrument_id)

  // サイズカテゴリを自動判定
  const sizeCategory = selectedInstrument?.size === '4/4' ? 'full' : 'fractional'

  // プラン自動マッチ: 楽器種別 + サイズカテゴリ + レンタルタイプ でフィルタ
  const matchedPlans = useMemo(() => {
    if (!selectedInstrument) return plans.filter((p) => p.rental_type === formData.rental_type)
    return plans.filter(
      (p) =>
        p.string_type === selectedInstrument.string_type &&
        p.size_category === sizeCategory &&
        p.rental_type === formData.rental_type
    )
  }, [selectedInstrument, sizeCategory, formData.rental_type, plans])

  // レンタルタイプが変わったらプランをリセット
  function handleRentalTypeChange(type: StringRentalType) {
    setFormData((prev) => ({ ...prev, rental_type: type, plan_id: '' }))
  }

  // 選択中プラン
  const selectedPlan = plans.find((p) => p.id === formData.plan_id)

  // スポット: end_date プレビュー
  const spotEndDate = useMemo(() => {
    if (formData.rental_type !== 'spot' || !formData.start_date || !selectedPlan) return null
    const days = parseInt(selectedPlan.period) || 30
    const d = new Date(formData.start_date)
    d.setDate(d.getDate() + days)
    return d.toISOString().slice(0, 10)
  }, [formData.rental_type, formData.start_date, selectedPlan])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.customer_id) { setError('顧客を選択してください'); return }
    if (!formData.instrument_id) { setError('楽器を選択してください'); return }
    if (!formData.plan_id) { setError('プランを選択してください'); return }
    if (!formData.start_date) { setError('開始日を入力してください'); return }
    setLoading(true)
    setError(null)

    const result = isEdit
      ? await updateStringContract(contract.id, formData)
      : await createStringContract(formData)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/admin/string-contracts/${isEdit ? contract.id : result.data.id}`)
  }

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      )}

      {/* 顧客・楽器 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">顧客・楽器</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>顧客 <span className="text-red-500">*</span></label>
            <select value={formData.customer_id} onChange={(e) => set('customer_id', e.target.value)} className={inputClass} required>
              <option value="">-- 選択 --</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>{c.name}{c.company_name ? ` (${c.company_name})` : ''}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>楽器 <span className="text-red-500">*</span></label>
            <select value={formData.instrument_id} onChange={(e) => set('instrument_id', e.target.value)} className={inputClass} required>
              <option value="">-- 選択 --</option>
              {instrumentOptions.map((i) => (
                <option key={i.id} value={i.id}>
                  {STRING_TYPE_LABELS[i.string_type]} {i.size} - {i.maker} {i.model}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* レンタルタイプ + プラン */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">プラン</h2>

        {/* レンタルタイプ切替 */}
        <div className="flex gap-3">
          {(['subscription', 'spot'] as StringRentalType[]).map((t) => (
            <label key={t}
              className={`flex-1 border rounded-lg p-3 cursor-pointer text-center transition-colors ${
                formData.rental_type === t
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/30'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
              <input type="radio" className="sr-only" checked={formData.rental_type === t}
                onChange={() => handleRentalTypeChange(t)} />
              <p className="text-sm font-medium text-gray-900">{STRING_RENTAL_TYPE_LABELS[t]}</p>
            </label>
          ))}
        </div>

        {/* プラン選択 */}
        <div>
          <label className={labelClass}>料金プラン <span className="text-red-500">*</span></label>
          {matchedPlans.length === 0 ? (
            <p className="text-sm text-gray-400">楽器を選択すると対応プランが表示されます</p>
          ) : (
            <div className="space-y-2">
              {matchedPlans.map((p) => (
                <label key={p.id}
                  className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                    formData.plan_id === p.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <div className="flex items-center gap-3">
                    <input type="radio" name="plan" checked={formData.plan_id === p.id}
                      onChange={() => set('plan_id', p.id)} className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-gray-900">{p.name}</span>
                  </div>
                  <span className="text-sm font-bold text-blue-700">
                    {formatCurrency(p.price)}
                    {p.rental_type === 'subscription' ? '/月' : ''}
                  </span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 契約詳細 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <h2 className="text-base font-semibold text-gray-900">契約詳細</h2>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>開始日 <span className="text-red-500">*</span></label>
            <input type="date" value={formData.start_date} onChange={(e) => set('start_date', e.target.value)}
              className={inputClass} required />
          </div>

          {formData.rental_type === 'subscription' && (
            <div>
              <label className={labelClass}>請求日</label>
              <select value={formData.billing_day} onChange={(e) => set('billing_day', parseInt(e.target.value))}
                className={inputClass}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>{d}日</option>
                ))}
              </select>
            </div>
          )}

          {formData.rental_type === 'spot' && spotEndDate && (
            <div>
              <label className={labelClass}>終了日（自動計算）</label>
              <p className="text-sm text-gray-900 mt-2">{spotEndDate}</p>
            </div>
          )}
        </div>

        <div>
          <label className={labelClass}>支払方法</label>
          <select value={formData.payment_method} onChange={(e) => set('payment_method', e.target.value as PaymentMethod)}
            className={inputClass}>
            {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((k) => (
              <option key={k} value={k}>{PAYMENT_METHOD_LABELS[k]}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>申込日</label>
            <input type="date" value={formData.application_date} onChange={(e) => set('application_date', e.target.value)}
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>区分</label>
            <select value={formData.rule_type} onChange={(e) => set('rule_type', e.target.value)} className={inputClass}>
              <option value="A">A（新規約）</option>
              <option value="O">O（旧規約）</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>納品方法</label>
            <select value={formData.delivery_method} onChange={(e) => set('delivery_method', e.target.value)} className={inputClass}>
              <option value="">-- 選択 --</option>
              <option value="shipping">宅配便</option>
              <option value="pickup">ご来店</option>
              <option value="self_delivery">自社配送</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>送料/手数料（税込）</label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-sm text-gray-500">¥</span>
              <input type="number" min={0} value={formData.shipping_fee || ''}
                onChange={(e) => set('shipping_fee', parseInt(e.target.value) || 0)}
                className={`${inputClass} pl-7 text-right`} placeholder="0" />
            </div>
          </div>
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={formData.has_insurance}
            onChange={(e) => set('has_insurance', e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500" />
          <span className="text-sm text-gray-900">あんしん楽器プラン加入</span>
        </label>
      </div>

      {/* メモ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">メモ</h2>
        <textarea value={formData.memo} onChange={(e) => set('memo', e.target.value)} rows={3}
          className={inputClass + ' resize-none'} placeholder="社内メモを入力..." />
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50">
          {loading ? '保存中…' : isEdit ? '変更を保存' : '契約を登録'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">キャンセル</button>
      </div>
    </form>
  )
}
