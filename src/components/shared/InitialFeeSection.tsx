'use client'

import { useState } from 'react'
import { SpotFeeTypeMaster } from '@/types'
import { formatCurrency } from '@/lib/utils'

export type TransportType = 'round_trip' | 'delivery_only'

export interface InitialFeeItem {
  fee_type_id: string | null
  label: string
  amount: number              // 単価（税抜）
  quantity: number
  memo: string
}

interface InitialFeeSectionProps {
  spotFeeTypes: SpotFeeTypeMaster[]
  fees: InitialFeeItem[]
  onChange: (fees: InitialFeeItem[]) => void
  /** 運送種別 */
  transportType: TransportType
  onTransportTypeChange: (type: TransportType) => void
  /** 運送料（税抜） */
  transportFee: number
  onTransportFeeChange: (amount: number) => void
  /** 搬出参考金額（税抜）— 搬入のみ時に表示 */
  pickupFeeEstimate: number
  onPickupFeeEstimateChange: (amount: number) => void
}

export function InitialFeeSection({
  spotFeeTypes,
  fees,
  onChange,
  transportType,
  onTransportTypeChange,
  transportFee,
  onTransportFeeChange,
  pickupFeeEstimate,
  onPickupFeeEstimateChange,
}: InitialFeeSectionProps) {
  const [showCustom, setShowCustom] = useState(false)
  const [customLabel, setCustomLabel] = useState('')
  const [customAmount, setCustomAmount] = useState('')
  const [customQuantity, setCustomQuantity] = useState('1')

  function addFromMaster(master: SpotFeeTypeMaster) {
    if (fees.some((f) => f.fee_type_id === master.id)) return
    const item: InitialFeeItem = {
      fee_type_id: master.id,
      label: master.name,
      amount: Math.round(master.unit_price / 1.1),
      quantity: 1,
      memo: '',
    }
    onChange([...fees, item])
  }

  function addCustom() {
    if (!customLabel.trim() || !customAmount) return
    const item: InitialFeeItem = {
      fee_type_id: null,
      label: customLabel.trim(),
      amount: parseInt(customAmount) || 0,
      quantity: parseInt(customQuantity) || 1,
      memo: '',
    }
    onChange([...fees, item])
    setCustomLabel('')
    setCustomAmount('')
    setCustomQuantity('1')
    setShowCustom(false)
  }

  function removeFee(index: number) {
    onChange(fees.filter((_, i) => i !== index))
  }

  function updateFee(index: number, field: keyof InitialFeeItem, value: string | number) {
    const updated = [...fees]
    updated[index] = { ...updated[index], [field]: value }
    onChange(updated)
  }

  const transportIncTax = transportFee > 0 ? Math.round(transportFee * 1.1) : 0
  const pickupIncTax = pickupFeeEstimate > 0 ? Math.round(pickupFeeEstimate * 1.1) : 0
  const otherIncTax = fees.reduce(
    (sum, f) => sum + Math.round(f.amount * f.quantity * 1.1),
    0
  )
  const totalIncTax = transportIncTax + otherIncTax

  const availableMasters = spotFeeTypes.filter(
    (m) =>
      !fees.some((f) => f.fee_type_id === m.id) &&
      !m.name.includes('運送')
  )

  const inputClass =
    'border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">初期費用</h2>

      {/* 運送費 — 常設フィールド */}
      <div className="mb-5 space-y-3">
        <label className="block text-sm font-medium text-gray-700">運送費</label>

        {/* 往復 / 搬入のみ ラジオ */}
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="transportType"
              checked={transportType === 'round_trip'}
              onChange={() => onTransportTypeChange('round_trip')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-900">往復</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="transportType"
              checked={transportType === 'delivery_only'}
              onChange={() => onTransportTypeChange('delivery_only')}
              className="w-4 h-4 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-900">搬入のみ</span>
          </label>
        </div>

        {/* 運送費入力 */}
        <div className="flex items-start gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">
              {transportType === 'round_trip' ? '運送費（往復・税抜）' : '運送費（搬入・税抜）'}
            </p>
            <div className="flex items-center gap-2">
              <div className="relative">
                <span className="absolute left-3 top-2 text-sm text-gray-500">¥</span>
                <input
                  type="number"
                  min={0}
                  value={transportFee || ''}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0
                    onTransportFeeChange(val)
                    // 搬入のみの場合、搬出参考金額が未入力なら運送費と同額にする
                    if (transportType === 'delivery_only' && pickupFeeEstimate === 0) {
                      onPickupFeeEstimateChange(val)
                    }
                  }}
                  placeholder="35000"
                  className={`${inputClass} w-36 pl-7 text-right`}
                />
              </div>
              {transportFee > 0 && (
                <span className="text-xs text-gray-400">
                  税込 {formatCurrency(transportIncTax)}
                </span>
              )}
            </div>
          </div>

          {/* 搬入のみの場合：搬出参考金額 */}
          {transportType === 'delivery_only' && (
            <div>
              <p className="text-xs text-gray-400 mb-1">搬出参考金額（税抜）</p>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-gray-400">¥</span>
                  <input
                    type="number"
                    min={0}
                    value={pickupFeeEstimate || ''}
                    onChange={(e) => onPickupFeeEstimateChange(parseInt(e.target.value) || 0)}
                    placeholder="35000"
                    className="border border-gray-200 rounded-md px-3 py-2 text-xs text-gray-500 w-28 pl-6 text-right focus:outline-none focus:ring-1 focus:ring-blue-400 bg-gray-50"
                  />
                </div>
                {pickupFeeEstimate > 0 && (
                  <span className="text-xs text-gray-400">
                    税込 {formatCurrency(pickupIncTax)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-1">※ 搬出費用は解約時に別途請求</p>
            </div>
          )}
        </div>
      </div>

      {/* その他の初期費用テーブル */}
      {fees.length > 0 && (
        <>
          <p className="text-sm font-medium text-gray-700 mb-2">その他の初期費用</p>
          <table className="w-full text-sm mb-4">
            <thead>
              <tr className="border-b border-gray-200 text-left">
                <th className="pb-2 font-medium text-gray-600 text-xs">品目</th>
                <th className="pb-2 font-medium text-gray-600 text-xs text-right w-28">単価（税抜）</th>
                <th className="pb-2 font-medium text-gray-600 text-xs text-center w-16">数量</th>
                <th className="pb-2 font-medium text-gray-600 text-xs text-right w-28">金額（税込）</th>
                <th className="w-8"></th>
              </tr>
            </thead>
            <tbody>
              {fees.map((fee, i) => (
                <tr key={i} className="border-b border-gray-100 group">
                  <td className="py-2">
                    <input
                      type="text"
                      value={fee.label}
                      onChange={(e) => updateFee(i, 'label', e.target.value)}
                      className="w-full border-0 bg-transparent text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-400 rounded px-1 -ml-1"
                    />
                  </td>
                  <td className="py-2">
                    <div className="flex items-center justify-end">
                      <span className="text-gray-400 text-xs mr-1">¥</span>
                      <input
                        type="number"
                        value={fee.amount}
                        onChange={(e) => updateFee(i, 'amount', parseInt(e.target.value) || 0)}
                        className="w-20 border border-gray-200 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    </div>
                  </td>
                  <td className="py-2 text-center">
                    <input
                      type="number"
                      min={1}
                      value={fee.quantity}
                      onChange={(e) => updateFee(i, 'quantity', parseInt(e.target.value) || 1)}
                      className="w-12 border border-gray-200 rounded px-2 py-1 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
                    />
                  </td>
                  <td className="py-2 text-right text-gray-900 font-medium">
                    {formatCurrency(Math.round(fee.amount * fee.quantity * 1.1))}
                  </td>
                  <td className="py-2">
                    <button
                      type="button"
                      onClick={() => removeFee(i)}
                      className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="削除"
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* 追加ボタン */}
      <div className="flex flex-wrap items-center gap-2">
        {availableMasters.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {availableMasters.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => addFromMaster(m)}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 border border-gray-200 hover:border-blue-300 rounded-full transition-colors"
              >
                + {m.name}
                <span className="text-gray-400 ml-0.5">{formatCurrency(m.unit_price)}</span>
              </button>
            ))}
          </div>
        )}

        {!showCustom ? (
          <button
            type="button"
            onClick={() => setShowCustom(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            + カスタム品目を追加
          </button>
        ) : (
          <div className="w-full mt-2 flex items-end gap-2 bg-gray-50 rounded p-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">品目名</label>
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                placeholder="例: 搬入特殊作業料"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">単価（税抜）</label>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="¥"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <div className="w-14">
              <label className="block text-xs text-gray-500 mb-1">数量</label>
              <input
                type="number"
                min={1}
                value={customQuantity}
                onChange={(e) => setCustomQuantity(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400"
              />
            </div>
            <button
              type="button"
              onClick={addCustom}
              disabled={!customLabel.trim() || !customAmount}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-medium rounded"
            >
              追加
            </button>
            <button
              type="button"
              onClick={() => setShowCustom(false)}
              className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
        )}
      </div>

      {/* 合計 */}
      {(transportFee > 0 || fees.length > 0) && (
        <div className="mt-4 pt-3 border-t border-gray-200 flex justify-end">
          <div className="text-right">
            <p className="text-xs text-gray-500 mb-0.5">初期費用 合計（税込）</p>
            <p className="text-xl font-bold text-gray-900">{formatCurrency(totalIncTax)}</p>
          </div>
        </div>
      )}
    </div>
  )
}
