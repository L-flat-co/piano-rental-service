'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ContractFormData, createContract, updateContract } from '@/actions/contract-actions'
import { Contract, Customer, Piano, RentalPlan, RentalOption, SpotFeeTypeMaster, PaymentMethod } from '@/types'
import { formatCurrency } from '@/lib/utils'
import { InitialFeeSection, InitialFeeItem, TransportType } from '@/components/shared/InitialFeeSection'

interface ContractFormProps {
  contract?: Contract
  customers: Customer[]
  availablePianos: Piano[]
  plans: RentalPlan[]
  options: RentalOption[]
  spotFeeTypes?: SpotFeeTypeMaster[]
}

export function ContractForm({
  contract,
  customers,
  availablePianos,
  plans,
  options,
  spotFeeTypes = [],
}: ContractFormProps) {
  const router = useRouter()
  const isEdit = !!contract

  const [formData, setFormData] = useState<ContractFormData>({
    customer_id: contract?.customer_id || '',
    piano_id: contract?.piano_id || '',
    plan_id: contract?.plan_id || '',
    option_ids: contract?.option_ids || [],
    contract_period: contract?.contract_period || 'yearly',
    start_date: contract?.start_date || '',
    billing_day: contract?.billing_day || 1,
    payment_method: (contract?.payment_method as PaymentMethod) || 'bank_transfer',
    accessories: contract?.accessories || ['ピアノ椅子', 'インシュレーター'],
    custom_options: contract?.custom_options || [],
    memo: contract?.memo || '',
  })
  const [initialFees, setInitialFees] = useState<InitialFeeItem[]>([])
  const [transportType, setTransportType] = useState<TransportType>('round_trip')
  const [transportFee, setTransportFee] = useState(0)
  const [pickupFeeEstimate, setPickupFeeEstimate] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const pianoOptions = isEdit
    ? [
        ...(contract.piano ? [contract.piano as Piano] : []),
        ...availablePianos.filter((p) => p.id !== contract?.piano_id),
      ]
    : availablePianos

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === formData.plan_id),
    [plans, formData.plan_id]
  )

  function handlePlanChange(planId: string) {
    const plan = plans.find((p) => p.id === planId)
    setFormData((prev) => ({
      ...prev,
      plan_id: planId,
      contract_period: plan?.period || prev.contract_period,
    }))
  }

  function toggleOption(optionId: string) {
    setFormData((prev) => ({
      ...prev,
      option_ids: prev.option_ids.includes(optionId)
        ? prev.option_ids.filter((id) => id !== optionId)
        : [...prev.option_ids, optionId],
    }))
  }

  const monthlyTotal = useMemo(() => {
    const planFee = selectedPlan?.monthly_fee || 0
    const optionFee = options
      .filter((o) => formData.option_ids.includes(o.id))
      .reduce((sum, o) => sum + o.monthly_fee, 0)
    const customOptionFee = formData.custom_options.reduce((sum, o) => sum + o.monthly_fee, 0)
    return planFee + optionFee + customOptionFee
  }, [selectedPlan, options, formData.option_ids, formData.custom_options])

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'billing_day' ? Number(value) : value,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.customer_id || !formData.piano_id || !formData.plan_id) {
      setError('顧客・ピアノ・プランは必須です')
      return
    }
    setLoading(true)
    setError(null)

    // 運送料 + その他の初期費用をまとめる
    const allInitialFees: InitialFeeItem[] = []
    if (transportFee > 0) {
      const label = transportType === 'round_trip' ? '運送費（往復）' : '運送費（搬入）'
      allInitialFees.push({
        fee_type_id: null,
        label,
        amount: transportFee,
        quantity: 1,
        memo: transportType === 'delivery_only' && pickupFeeEstimate > 0
          ? `pickup_estimate:${pickupFeeEstimate}`
          : '',
      })
    }
    // 搬入のみの場合、搬出参考金額を quantity=0 で記録（未請求マーカー）
    if (transportType === 'delivery_only' && pickupFeeEstimate > 0) {
      allInitialFees.push({
        fee_type_id: null,
        label: '搬出費用（参考）',
        amount: pickupFeeEstimate,
        quantity: 0,
        memo: 'pickup_pending',
      })
    }
    allInitialFees.push(...initialFees)

    const result = isEdit
      ? await updateContract(contract!.id, formData)
      : await createContract(formData, allInitialFees.length > 0 ? allInitialFees : undefined)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(isEdit ? `/admin/contracts/${contract!.id}` : `/admin/contracts/${result.data.id}`)
    router.refresh()
  }

  const homePlans = plans.filter((p) => p.plan_type === 'home')
  const schoolPlans = plans.filter((p) => p.plan_type === 'school')

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 顧客・ピアノ選択 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">顧客・ピアノ</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              顧客 <span className="text-red-500">*</span>
            </label>
            <select name="customer_id" value={formData.customer_id} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">顧客を選択...</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}{c.company_name ? ` (${c.company_name})` : ''}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ピアノ <span className="text-red-500">*</span>
            </label>
            <select name="piano_id" value={formData.piano_id} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">ピアノを選択...</option>
              {pianoOptions.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.maker} {p.model}
                  {p.serial_number ? ` [${p.serial_number}]` : ''}
                  {p.is_mute ? ' ・消音' : ''}{p.is_white ? ' ・白' : ''}
                </option>
              ))}
            </select>
            {!isEdit && availablePianos.length === 0 && (
              <p className="mt-1 text-xs text-red-500">在庫中のピアノがありません</p>
            )}
          </div>
        </div>
      </div>

      {/* プラン選択 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">料金プラン</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              プラン <span className="text-red-500">*</span>
            </label>
            <select value={formData.plan_id} onChange={(e) => handlePlanChange(e.target.value)} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">プランを選択...</option>
              {homePlans.length > 0 && (
                <optgroup label="ご家庭用">
                  {homePlans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}（{formatCurrency(p.monthly_fee)}/月）</option>
                  ))}
                </optgroup>
              )}
              {schoolPlans.length > 0 && (
                <optgroup label="教室用">
                  {schoolPlans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}（{formatCurrency(p.monthly_fee)}/月）</option>
                  ))}
                </optgroup>
              )}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">契約期間</label>
            <input type="text" readOnly
              value={selectedPlan
                ? { yearly: '1年契約', half_year: '半年契約', monthly: '単月契約' }[selectedPlan.period]
                : '—'}
              className="w-full px-3 py-2 border border-gray-200 bg-gray-50 rounded-md text-sm text-gray-600 cursor-not-allowed" />
            <p className="mt-1 text-xs text-gray-400">プラン選択により自動設定</p>
          </div>
        </div>

        {/* 月額オプション（マスタ） */}
        {options.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">月額オプション（複数選択可）</label>
            <div className="space-y-2">
              {options.map((option) => (
                <label key={option.id} className="flex items-center gap-3 cursor-pointer group">
                  <input type="checkbox" checked={formData.option_ids.includes(option.id)}
                    onChange={() => toggleOption(option.id)} className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
                  <span className="text-sm text-gray-700 group-hover:text-gray-900">
                    {option.name}
                    <span className="ml-2 text-gray-400">+{formatCurrency(option.monthly_fee)}/月</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* カスタム月額オプション */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">カスタム月額オプション</label>
          {formData.custom_options.map((co, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input type="text" value={co.name} placeholder="オプション名"
                onChange={(e) => {
                  const next = [...formData.custom_options]
                  next[i] = { ...next[i], name: e.target.value }
                  setFormData((prev) => ({ ...prev, custom_options: next }))
                }}
                className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">¥</span>
                <input type="number" min={0} value={co.monthly_fee}
                  onChange={(e) => {
                    const next = [...formData.custom_options]
                    next[i] = { ...next[i], monthly_fee: parseInt(e.target.value) || 0 }
                    setFormData((prev) => ({ ...prev, custom_options: next }))
                  }}
                  className="w-20 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <span className="text-xs text-gray-400">/月</span>
              </div>
              <button type="button"
                onClick={() => setFormData((prev) => ({ ...prev, custom_options: prev.custom_options.filter((_, j) => j !== i) }))}
                className="text-gray-400 hover:text-red-500 text-sm">✕</button>
            </div>
          ))}
          <button type="button"
            onClick={() => setFormData((prev) => ({ ...prev, custom_options: [...prev.custom_options, { name: '', monthly_fee: 0 }] }))}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            + カスタムオプションを追加
          </button>
        </div>

        {selectedPlan && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end">
            <div className="text-right">
              <p className="text-xs text-gray-500 mb-0.5">月額合計（税込）</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(monthlyTotal)}</p>
            </div>
          </div>
        )}
      </div>

      {/* 初期費用（新規登録時のみ） */}
      {!isEdit && (
        <InitialFeeSection
          spotFeeTypes={spotFeeTypes}
          fees={initialFees}
          onChange={setInitialFees}
          transportType={transportType}
          onTransportTypeChange={setTransportType}
          transportFee={transportFee}
          onTransportFeeChange={setTransportFee}
          pickupFeeEstimate={pickupFeeEstimate}
          onPickupFeeEstimateChange={setPickupFeeEstimate}
        />
      )}

      {/* 契約詳細 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">契約詳細</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              開始日 <span className="text-red-500">*</span>
            </label>
            <input type="date" name="start_date" value={formData.start_date} onChange={handleChange} required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {/* 請求日は start_date から自動決定（表示のみ） */}
          {formData.start_date && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">支払期限</label>
              <p className="text-sm text-gray-600 mt-2">
                毎月 {(new Date(formData.start_date).getDate() <= 1 ? 28 : Math.min(new Date(formData.start_date).getDate(), 28) - 1)} 日
              </p>
              <p className="text-xs text-gray-400 mt-0.5">開始日から自動設定</p>
            </div>
          )}
        </div>

        {/* 支払方法 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">支払方法</label>
          <select
            value={formData.payment_method}
            onChange={(e) => setFormData((prev) => ({ ...prev, payment_method: e.target.value as PaymentMethod }))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="bank_transfer">銀行振込</option>
            <option value="direct_debit">口座振替</option>
            <option value="cash">現金</option>
            <option value="card">クレジットカード</option>
            <option value="other">その他</option>
          </select>
        </div>
      </div>

      {/* 付属品 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">付属品</h2>
        <div className="space-y-2">
          {['ピアノ椅子', 'インシュレーター', '敷板', 'ヘッドホン'].map((item) => (
            <label key={item} className="flex items-center gap-3 cursor-pointer group">
              <input type="checkbox" checked={formData.accessories.includes(item)}
                onChange={() => {
                  setFormData((prev) => ({
                    ...prev,
                    accessories: prev.accessories.includes(item)
                      ? prev.accessories.filter((a) => a !== item)
                      : [...prev.accessories, item],
                  }))
                }}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded" />
              <span className="text-sm text-gray-700 group-hover:text-gray-900">{item}</span>
            </label>
          ))}
          {/* カスタム付属品 */}
          {formData.accessories
            .filter((a) => !['ピアノ椅子', 'インシュレーター', '敷板', 'ヘッドホン'].includes(a))
            .map((a, i) => (
              <div key={`custom-${i}`} className="flex items-center gap-2 pl-7">
                <input type="text" value={a}
                  onChange={(e) => {
                    const customs = formData.accessories.filter((x) => !['ピアノ椅子', 'インシュレーター', '敷板', 'ヘッドホン'].includes(x))
                    customs[i] = e.target.value
                    const standards = formData.accessories.filter((x) => ['ピアノ椅子', 'インシュレーター', '敷板', 'ヘッドホン'].includes(x))
                    setFormData((prev) => ({ ...prev, accessories: [...standards, ...customs] }))
                  }}
                  className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500" />
                <button type="button"
                  onClick={() => {
                    setFormData((prev) => ({ ...prev, accessories: prev.accessories.filter((x) => x !== a) }))
                  }}
                  className="text-gray-400 hover:text-red-500 text-sm">✕</button>
              </div>
            ))}
          <button type="button"
            onClick={() => setFormData((prev) => ({ ...prev, accessories: [...prev.accessories, ''] }))}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium ml-7">
            + その他の付属品を追加
          </button>
        </div>
      </div>

      {/* メモ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">メモ</h2>
        <textarea name="memo" value={formData.memo} onChange={handleChange} rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="社内メモを入力..." />
      </div>

      {/* ボタン */}
      <div className="flex items-center gap-3">
        <button type="submit" disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded-md text-sm">
          {loading ? '保存中...' : isEdit ? '更新する' : '契約を登録する'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50">
          キャンセル
        </button>
      </div>
    </form>
  )
}
