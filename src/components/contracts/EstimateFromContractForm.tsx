'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEstimateWithOptions } from '@/actions/invoice-actions'
import { Contract, RentalPlan, RentalOption, SpotFeeTypeMaster, ContractSpotFee } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface Props {
  contract: Contract
  plans: RentalPlan[]
  options: RentalOption[]
  spotFeeTypes: SpotFeeTypeMaster[]
  initialFees: ContractSpotFee[]  // 契約の既存初期費用（プリフィル用）
}

interface FeeItem {
  label: string
  amount: number
  quantity: number
}

export function EstimateFromContractForm({
  contract,
  plans,
  options,
  spotFeeTypes,
  initialFees,
}: Props) {
  const router = useRouter()

  // プラン（契約の値をプリフィル）
  const [planId, setPlanId] = useState(contract.plan_id)

  // オプション（契約の値をプリフィル）
  const [selectedOptionIds, setSelectedOptionIds] = useState<string[]>(contract.option_ids || [])

  // カスタムオプション（契約の値をプリフィル）
  const [customOptions, setCustomOptions] = useState<{ name: string; monthly_fee: number }[]>(
    contract.custom_options || []
  )
  const [showAddCustomOption, setShowAddCustomOption] = useState(false)
  const [newOptionName, setNewOptionName] = useState('')
  const [newOptionFee, setNewOptionFee] = useState('')

  // 初期費用を含めるか
  const [includeInitialFees, setIncludeInitialFees] = useState(true)

  // 初期費用リスト（契約の既存スポット費用からプリフィル、pickup_pending除外）
  const [fees, setFees] = useState<FeeItem[]>(
    initialFees
      .filter((f) => f.memo !== 'pickup_pending' && f.quantity > 0)
      .map((f) => ({ label: f.label, amount: f.amount, quantity: f.quantity }))
  )

  // カスタム初期費用追加
  const [showAddFee, setShowAddFee] = useState(false)
  const [newFeeLabel, setNewFeeLabel] = useState('')
  const [newFeeAmount, setNewFeeAmount] = useState('')

  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 選択中のプラン
  const selectedPlan = plans.find((p) => p.id === planId)
  const selectedOptions = options.filter((o) => selectedOptionIds.includes(o.id))

  // 月額合計
  const monthlyTotal =
    (selectedPlan?.monthly_fee || 0) +
    selectedOptions.reduce((s, o) => s + o.monthly_fee, 0) +
    customOptions.reduce((s, o) => s + o.monthly_fee, 0)

  // 初期費用合計（税込）
  const initialFeesTotal = fees.reduce(
    (s, f) => s + Math.round(f.amount * f.quantity * 1.1), 0
  )

  // 見積合計（税込）
  const estimateTotal = (includeInitialFees ? initialFeesTotal : 0) + Math.round(monthlyTotal)

  function toggleOption(id: string) {
    setSelectedOptionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function addCustomOption() {
    if (!newOptionName.trim() || !newOptionFee) return
    setCustomOptions((prev) => [
      ...prev,
      { name: newOptionName.trim(), monthly_fee: parseInt(newOptionFee) || 0 },
    ])
    setNewOptionName('')
    setNewOptionFee('')
    setShowAddCustomOption(false)
  }

  function removeCustomOption(index: number) {
    setCustomOptions((prev) => prev.filter((_, i) => i !== index))
  }

  function addFeeFromMaster(master: SpotFeeTypeMaster) {
    if (fees.some((f) => f.label === master.name)) return
    setFees((prev) => [
      ...prev,
      { label: master.name, amount: Math.round(master.unit_price / 1.1), quantity: 1 },
    ])
  }

  function addCustomFee() {
    if (!newFeeLabel.trim() || !newFeeAmount) return
    setFees((prev) => [
      ...prev,
      { label: newFeeLabel.trim(), amount: parseInt(newFeeAmount) || 0, quantity: 1 },
    ])
    setNewFeeLabel('')
    setNewFeeAmount('')
    setShowAddFee(false)
  }

  function removeFee(index: number) {
    setFees((prev) => prev.filter((_, i) => i !== index))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!planId) { setError('プランを選択してください'); return }
    setLoading(true)
    setError(null)

    const result = await createEstimateWithOptions({
      contract_id: contract.id,
      customer_id: contract.customer_id,
      plan_id: planId,
      option_ids: selectedOptionIds,
      custom_options: customOptions,
      include_initial_fees: includeInitialFees,
      initial_fees: fees,
      notes,
    })

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/admin/invoices/${result.data.id}`)
  }

  const inputClass =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  // 利用可能なスポット費用マスタ（既に追加済みは除外・運送系除外）
  const availableMasters = spotFeeTypes.filter(
    (m) => m.is_active && !fees.some((f) => f.label === m.name) && !m.name.includes('運送')
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      )}

      {/* プラン選択 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">プラン</h2>
        <select value={planId} onChange={(e) => setPlanId(e.target.value)} className={inputClass} required>
          <option value="">-- 選択 --</option>
          {plans.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}（{formatCurrency(p.monthly_fee)}/月）
            </option>
          ))}
        </select>
      </div>

      {/* オプション */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">月額オプション</h2>
        <div className="space-y-2 mb-4">
          {options.map((opt) => (
            <label key={opt.id} className="flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedOptionIds.includes(opt.id)}
                  onChange={() => toggleOption(opt.id)}
                  className="w-4 h-4 text-blue-600 rounded" />
                <span className="text-sm text-gray-900">{opt.name}</span>
              </div>
              <span className="text-sm text-blue-700 font-medium">+{formatCurrency(opt.monthly_fee)}/月</span>
            </label>
          ))}
        </div>

        {/* カスタムオプション */}
        {customOptions.length > 0 && (
          <div className="mb-3 space-y-1">
            <p className="text-xs font-medium text-gray-500">カスタムオプション</p>
            {customOptions.map((co, i) => (
              <div key={i} className="flex items-center justify-between text-sm bg-gray-50 rounded px-3 py-2">
                <span>{co.name}</span>
                <div className="flex items-center gap-2">
                  <span className="text-blue-700 font-medium">+{formatCurrency(co.monthly_fee)}/月</span>
                  <button type="button" onClick={() => removeCustomOption(i)} className="text-red-400 hover:text-red-600 text-xs">✕</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!showAddCustomOption ? (
          <button type="button" onClick={() => setShowAddCustomOption(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            + カスタムオプションを追加
          </button>
        ) : (
          <div className="flex items-end gap-2 bg-gray-50 rounded p-3 mt-2">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">名前</label>
              <input type="text" value={newOptionName} onChange={(e) => setNewOptionName(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="オプション名" />
            </div>
            <div className="w-28">
              <label className="block text-xs text-gray-500 mb-1">月額（税込）</label>
              <input type="number" value={newOptionFee} onChange={(e) => setNewOptionFee(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right" placeholder="¥" />
            </div>
            <button type="button" onClick={addCustomOption}
              disabled={!newOptionName.trim() || !newOptionFee}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-medium rounded">
              追加
            </button>
            <button type="button" onClick={() => setShowAddCustomOption(false)} className="text-xs text-gray-500">✕</button>
          </div>
        )}

        {/* 月額合計 */}
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
          <div className="text-right">
            <p className="text-xs text-gray-500">月額合計（税込）</p>
            <p className="text-lg font-bold text-gray-900">{formatCurrency(monthlyTotal)}</p>
          </div>
        </div>
      </div>

      {/* 初期費用 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">初期費用</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={includeInitialFees}
              onChange={(e) => setIncludeInitialFees(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded" />
            <span className="text-sm text-gray-700">見積書に含める</span>
          </label>
        </div>

        {includeInitialFees && (
          <>
            {fees.length > 0 && (
              <table className="w-full text-sm mb-4">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left pb-2 font-medium text-gray-600 text-xs">品目</th>
                    <th className="text-right pb-2 font-medium text-gray-600 text-xs w-24">単価（税抜）</th>
                    <th className="text-right pb-2 font-medium text-gray-600 text-xs w-24">金額（税込）</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {fees.map((f, i) => (
                    <tr key={i} className="border-b border-gray-100">
                      <td className="py-2 text-gray-900">{f.label}</td>
                      <td className="py-2 text-right text-gray-600">{formatCurrency(f.amount)}</td>
                      <td className="py-2 text-right font-medium text-gray-900">
                        {formatCurrency(Math.round(f.amount * f.quantity * 1.1))}
                      </td>
                      <td className="py-2">
                        <button type="button" onClick={() => removeFee(i)}
                          className="text-gray-300 hover:text-red-500 text-xs">✕</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-gray-200">
                    <td colSpan={2} className="pt-2 text-right text-sm font-medium text-gray-600">合計（税込）</td>
                    <td className="pt-2 text-right font-bold text-gray-900">{formatCurrency(initialFeesTotal)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            )}

            <div className="flex flex-wrap gap-1.5">
              {availableMasters.map((m) => (
                <button key={m.id} type="button" onClick={() => addFeeFromMaster(m)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-blue-50 text-gray-600 border border-gray-200 rounded-full">
                  + {m.name} <span className="text-gray-400">{formatCurrency(m.unit_price)}</span>
                </button>
              ))}
              {!showAddFee ? (
                <button type="button" onClick={() => setShowAddFee(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium">+ カスタム</button>
              ) : (
                <div className="w-full mt-2 flex items-end gap-2 bg-gray-50 rounded p-3">
                  <div className="flex-1">
                    <input type="text" value={newFeeLabel} onChange={(e) => setNewFeeLabel(e.target.value)}
                      placeholder="品目名" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm" />
                  </div>
                  <div className="w-24">
                    <input type="number" value={newFeeAmount} onChange={(e) => setNewFeeAmount(e.target.value)}
                      placeholder="税抜" className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right" />
                  </div>
                  <button type="button" onClick={addCustomFee}
                    disabled={!newFeeLabel.trim() || !newFeeAmount}
                    className="px-3 py-1.5 bg-blue-600 disabled:bg-gray-300 text-white text-xs rounded">追加</button>
                  <button type="button" onClick={() => setShowAddFee(false)} className="text-xs text-gray-500">✕</button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* メモ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-3">備考</h2>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
          className={inputClass + ' resize-none'} placeholder="見積書PDFの備考欄に表示されます" />
      </div>

      {/* 合計プレビュー + 送信 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-blue-800">見積合計（税込）</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(estimateTotal)}</p>
        </div>
        <button type="submit" disabled={loading}
          className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg disabled:opacity-50">
          {loading ? '作成中…' : '見積書を作成'}
        </button>
      </div>
    </form>
  )
}
