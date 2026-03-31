'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createStandaloneEstimate } from '@/actions/invoice-actions'
import { Customer, RentalPlan, RentalOption, SpotFeeTypeMaster, PianoType, ContractPeriod } from '@/types'
import { CONTRACT_PERIOD_LABELS, PIANO_TYPE_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import { InitialFeeSection, InitialFeeItem, TransportType } from '@/components/shared/InitialFeeSection'

interface EstimateFormProps {
  customers: Customer[]
  plans: RentalPlan[]
  options: RentalOption[]
  spotFeeTypes: SpotFeeTypeMaster[]
}

export function EstimateForm({ customers, plans, options, spotFeeTypes }: EstimateFormProps) {
  const router = useRouter()

  const [customerId, setCustomerId] = useState('')
  const [planType, setPlanType] = useState<'home' | 'school'>('home')
  const [contractPeriod, setContractPeriod] = useState<ContractPeriod>('monthly')
  const [pianoType, setPianoType] = useState<PianoType>('upright')
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>([])
  const [customOptions, setCustomOptions] = useState<{ name: string; monthly_fee: number }[]>([])
  const [newCustomName, setNewCustomName] = useState('')
  const [newCustomFee, setNewCustomFee] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // 初期費用
  const [initialFees, setInitialFees] = useState<InitialFeeItem[]>([])
  const [transportType, setTransportType] = useState<TransportType>('round_trip')
  const [transportFee, setTransportFee] = useState(0)
  const [pickupFeeEstimate, setPickupFeeEstimate] = useState(0)

  // 選択中のプラン
  const selectedPlan = useMemo(
    () => plans.find((p) => p.plan_type === planType && p.period === contractPeriod),
    [plans, planType, contractPeriod]
  )

  // 月額合計
  const monthlyTotal = useMemo(() => {
    const planFee = selectedPlan?.monthly_fee || 0
    const optFee = options
      .filter((o) => selectedOptionIds.includes(o.id))
      .reduce((s, o) => s + o.monthly_fee, 0)
    const customFee = customOptions.reduce((s, o) => s + o.monthly_fee, 0)
    return planFee + optFee + customFee
  }, [selectedPlan, options, selectedOptionIds, customOptions])

  // 初期費用合計（税込）
  const transportIncTax = transportFee > 0 ? Math.round(transportFee * 1.1) : 0
  const otherFeesIncTax = initialFees.reduce((s, f) => s + Math.round(f.amount * f.quantity * 1.1), 0)
  const initialTotal = transportIncTax + otherFeesIncTax

  function toggleOption(id: string) {
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function addCustomOption() {
    if (!newCustomName.trim() || !newCustomFee) return
    setCustomOptions((prev) => [...prev, { name: newCustomName.trim(), monthly_fee: parseInt(newCustomFee) || 0 }])
    setNewCustomName('')
    setNewCustomFee('')
  }

  function removeCustomOption(index: number) {
    setCustomOptions((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!customerId) { setError('顧客を選択してください'); return }
    if (!selectedPlan) { setError('プランを選択してください'); return }

    setLoading(true)
    setError(null)

    // 初期費用をまとめる
    const allInitialFees: { label: string; amount: number; quantity: number }[] = []
    if (transportFee > 0) {
      allInitialFees.push({
        label: transportType === 'round_trip' ? '運送費（往復）' : '運送費（搬入）',
        amount: transportFee,
        quantity: 1,
      })
    }
    for (const fee of initialFees) {
      if (fee.amount > 0) {
        allInitialFees.push({ label: fee.label, amount: fee.amount, quantity: fee.quantity })
      }
    }

    const result = await createStandaloneEstimate({
      customer_id: customerId,
      plan_id: selectedPlan.id,
      option_ids: selectedOptionIds,
      custom_options: customOptions,
      initial_fees: allInitialFees,
      notes,
    })

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/admin/invoices/${result.data.id}`)
  }

  const inputClass = 'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      )}

      {/* 顧客 */}
      <div>
        <label className={labelClass}>顧客 <span className="text-red-500">*</span></label>
        <select value={customerId} onChange={(e) => setCustomerId(e.target.value)} className={inputClass} required>
          <option value="">-- 選択してください --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}{c.company_name ? ` (${c.company_name})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* プラン種別 + 契約期間 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">料金プラン</h2>

        {/* 利用用途 */}
        <div className="mb-4">
          <label className={labelClass}>ご利用用途</label>
          <div className="flex gap-4">
            {(['home', 'school'] as const).map((t) => (
              <label key={t} className="flex items-center gap-2 cursor-pointer">
                <input type="radio" checked={planType === t} onChange={() => setPlanType(t)}
                  className="w-4 h-4 text-blue-600" />
                <span className="text-sm">{t === 'home' ? 'ご家庭用' : '教室用'}</span>
              </label>
            ))}
          </div>
        </div>

        {/* 契約期間 */}
        <div className="mb-4">
          <label className={labelClass}>契約期間</label>
          <div className="flex gap-3">
            {(['yearly', 'half_year', 'monthly'] as ContractPeriod[]).map((p) => {
              const plan = plans.find((pl) => pl.plan_type === planType && pl.period === p)
              return (
                <label key={p} className={`flex-1 border rounded-lg p-3 cursor-pointer text-center transition-colors ${
                  contractPeriod === p ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" className="sr-only" checked={contractPeriod === p}
                    onChange={() => setContractPeriod(p)} />
                  <p className="text-sm font-medium">{CONTRACT_PERIOD_LABELS[p]}</p>
                  {plan && <p className="text-xs text-blue-600 font-bold mt-1">{formatCurrency(plan.monthly_fee)}/月</p>}
                </label>
              )
            })}
          </div>
        </div>

        {/* ピアノ種別 */}
        <div className="mb-4">
          <label className={labelClass}>ピアノ種別</label>
          <div className="flex gap-3">
            {(['upright', 'grand', 'digital'] as PianoType[]).map((t) => (
              <label key={t} className={`flex-1 border rounded-lg p-3 cursor-pointer text-center transition-colors ${
                pianoType === t ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500/20' : 'border-gray-200 hover:border-gray-300'
              }`}>
                <input type="radio" className="sr-only" checked={pianoType === t}
                  onChange={() => setPianoType(t)} />
                <p className="text-sm font-medium">{PIANO_TYPE_LABELS[t]}</p>
              </label>
            ))}
          </div>
        </div>

        {/* オプション */}
        {options.length > 0 && (
          <div className="mb-4">
            <label className={labelClass}>月額オプション</label>
            <div className="space-y-2">
              {options.map((opt) => (
                <label key={opt.id} className={`flex items-center justify-between border rounded-lg px-4 py-2.5 cursor-pointer transition-colors ${
                  selectedOptionIds.includes(opt.id) ? 'border-blue-500 bg-blue-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={selectedOptionIds.includes(opt.id)}
                      onChange={() => toggleOption(opt.id)} className="w-4 h-4 text-blue-600 rounded" />
                    <span className="text-sm">{opt.name}</span>
                  </div>
                  <span className="text-sm font-medium text-blue-600">+{formatCurrency(opt.monthly_fee)}/月</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {/* カスタム月額オプション */}
        <div className="mb-4">
          <label className={labelClass}>カスタム月額オプション</label>
          {customOptions.map((co, i) => (
            <div key={i} className="flex items-center gap-2 mb-1.5">
              <span className="text-sm text-gray-700 flex-1">{co.name}</span>
              <span className="text-sm font-medium">{formatCurrency(co.monthly_fee)}/月</span>
              <button type="button" onClick={() => removeCustomOption(i)}
                className="text-xs text-red-500 hover:text-red-700">✕</button>
            </div>
          ))}
          <div className="flex items-end gap-2 mt-2">
            <input type="text" value={newCustomName} onChange={(e) => setNewCustomName(e.target.value)}
              placeholder="オプション名" className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm" />
            <div className="relative w-28">
              <span className="absolute left-2 top-1.5 text-sm text-gray-400">¥</span>
              <input type="number" value={newCustomFee} onChange={(e) => setNewCustomFee(e.target.value)}
                placeholder="税込月額" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm pl-5 text-right" />
            </div>
            <button type="button" onClick={addCustomOption}
              disabled={!newCustomName.trim() || !newCustomFee}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-medium rounded">
              追加
            </button>
          </div>
        </div>

        {/* 月額合計 */}
        <div className="flex justify-between items-center pt-3 border-t border-gray-200">
          <span className="text-sm font-medium text-gray-700">月額合計（税込）</span>
          <span className="text-lg font-bold text-gray-900">{formatCurrency(monthlyTotal)}</span>
        </div>
      </div>

      {/* 初期費用 */}
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

      {/* 合計プレビュー */}
      <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700">見積合計（税込・初期費用＋初月分）</span>
        <span className="text-xl font-bold text-gray-900">
          {formatCurrency(initialTotal + Math.round(monthlyTotal))}
        </span>
      </div>

      {/* メモ */}
      <div>
        <label className={labelClass}>備考</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          className={inputClass + ' resize-none'} placeholder="見積書の備考欄に表示されます" />
      </div>

      {/* 送信 */}
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50">
          {loading ? '作成中…' : '見積書を作成'}
        </button>
        <button type="button" onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800">
          キャンセル
        </button>
      </div>
    </form>
  )
}
