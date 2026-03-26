'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { ContractSpotFee, SpotFeeTypeMaster } from '@/types'
import { formatCurrency } from '@/lib/utils'
import {
  addContractSpotFee,
  updateContractSpotFee,
  deleteContractSpotFee,
} from '@/actions/contract-actions'

interface Props {
  contractId: string
  contractType: 'home_school' | 'event'
  fees: ContractSpotFee[]
  spotFeeTypes: SpotFeeTypeMaster[]
}

export function EditInitialFees({ contractId, contractType, fees, spotFeeTypes }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  // 編集中の行
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editAmount, setEditAmount] = useState(0)
  const [editQuantity, setEditQuantity] = useState(1)

  // 新規追加フォーム
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newAmount, setNewAmount] = useState('')
  const [newQuantity, setNewQuantity] = useState('1')

  function startEdit(fee: ContractSpotFee) {
    setEditingId(fee.id)
    setEditLabel(fee.label)
    setEditAmount(fee.amount)
    setEditQuantity(fee.quantity)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function saveEdit(feeId: string) {
    startTransition(async () => {
      await updateContractSpotFee(feeId, {
        label: editLabel,
        amount: editAmount,
        quantity: editQuantity,
      })
      setEditingId(null)
      router.refresh()
    })
  }

  function handleDelete(feeId: string) {
    if (!confirm('この初期費用を削除しますか？')) return
    startTransition(async () => {
      await deleteContractSpotFee(feeId)
      router.refresh()
    })
  }

  function addFromMaster(master: SpotFeeTypeMaster) {
    startTransition(async () => {
      await addContractSpotFee(contractId, contractType, {
        fee_type_id: master.id,
        label: master.name,
        amount: Math.round(master.unit_price / 1.1),
        quantity: 1,
        memo: '',
      })
      router.refresh()
    })
  }

  function handleAddCustom() {
    if (!newLabel.trim() || !newAmount) return
    startTransition(async () => {
      await addContractSpotFee(contractId, contractType, {
        fee_type_id: null,
        label: newLabel.trim(),
        amount: parseInt(newAmount) || 0,
        quantity: parseInt(newQuantity) || 1,
        memo: '',
      })
      setNewLabel('')
      setNewAmount('')
      setNewQuantity('1')
      setShowAdd(false)
      router.refresh()
    })
  }

  const totalIncTax = fees.reduce(
    (s, f) => s + Math.round(f.amount * f.quantity * 1.1),
    0
  )

  // マスタで未追加のもの（運送系は除外）
  const availableMasters = spotFeeTypes.filter(
    (m) => !fees.some((f) => f.fee_type_id === m.id) && !m.name.includes('運送')
  )

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-base font-semibold text-gray-900 mb-4">初期費用</h2>

      {fees.length > 0 && (
        <table className="w-full text-sm mb-4">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left pb-2 font-medium text-gray-600 text-xs">品目</th>
              <th className="text-right pb-2 font-medium text-gray-600 text-xs w-24">単価（税抜）</th>
              <th className="text-center pb-2 font-medium text-gray-600 text-xs w-12">数量</th>
              <th className="text-right pb-2 font-medium text-gray-600 text-xs w-24">金額（税込）</th>
              <th className="w-20"></th>
            </tr>
          </thead>
          <tbody>
            {fees.map((f) =>
              editingId === f.id ? (
                <tr key={f.id} className="border-b border-blue-100 bg-blue-50/50">
                  <td className="py-2">
                    <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="py-2">
                    <input type="number" value={editAmount} onChange={(e) => setEditAmount(parseInt(e.target.value) || 0)}
                      className="w-full border border-gray-300 rounded px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="py-2">
                    <input type="number" min={0} value={editQuantity} onChange={(e) => setEditQuantity(parseInt(e.target.value) || 1)}
                      className="w-12 border border-gray-300 rounded px-2 py-1 text-sm text-center mx-auto block focus:outline-none focus:ring-1 focus:ring-blue-400" />
                  </td>
                  <td className="py-2 text-right text-gray-500 text-xs">
                    {formatCurrency(Math.round(editAmount * editQuantity * 1.1))}
                  </td>
                  <td className="py-2 text-right">
                    <button onClick={() => saveEdit(f.id)} disabled={pending}
                      className="text-xs text-blue-600 hover:text-blue-800 mr-2">保存</button>
                    <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-gray-700">戻す</button>
                  </td>
                </tr>
              ) : (
                <tr key={f.id} className="border-b border-gray-100 group hover:bg-gray-50">
                  <td className="py-2 text-gray-900">{f.label}</td>
                  <td className="py-2 text-right text-gray-600">{formatCurrency(f.amount)}</td>
                  <td className="py-2 text-center text-gray-600">{f.quantity}</td>
                  <td className="py-2 text-right font-medium text-gray-900">
                    {formatCurrency(Math.round(f.amount * f.quantity * 1.1))}
                  </td>
                  <td className="py-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => startEdit(f)} className="text-xs text-blue-600 hover:text-blue-800 mr-2">編集</button>
                    <button onClick={() => handleDelete(f.id)} className="text-xs text-red-500 hover:text-red-700">削除</button>
                  </td>
                </tr>
              )
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-200">
              <td colSpan={3} className="pt-2 text-right text-sm font-medium text-gray-600">合計（税込）</td>
              <td className="pt-2 text-right font-bold text-gray-900">{formatCurrency(totalIncTax)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}

      {/* 追加ボタン */}
      <div className="flex flex-wrap items-center gap-2">
        {availableMasters.map((m) => (
          <button key={m.id} type="button" onClick={() => addFromMaster(m)} disabled={pending}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-600 border border-gray-200 hover:border-blue-300 rounded-full transition-colors disabled:opacity-50">
            + {m.name}
            <span className="text-gray-400 ml-0.5">{formatCurrency(m.unit_price)}</span>
          </button>
        ))}

        {!showAdd ? (
          <button type="button" onClick={() => setShowAdd(true)}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium">
            + カスタム品目を追加
          </button>
        ) : (
          <div className="w-full mt-2 flex items-end gap-2 bg-gray-50 rounded p-3">
            <div className="flex-1">
              <label className="block text-xs text-gray-500 mb-1">品目名</label>
              <input type="text" value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                placeholder="例: 搬入特殊作業料"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <div className="w-24">
              <label className="block text-xs text-gray-500 mb-1">単価（税抜）</label>
              <input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)}
                placeholder="¥"
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <div className="w-14">
              <label className="block text-xs text-gray-500 mb-1">数量</label>
              <input type="number" min={1} value={newQuantity} onChange={(e) => setNewQuantity(e.target.value)}
                className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-1 focus:ring-blue-400" />
            </div>
            <button type="button" onClick={handleAddCustom} disabled={pending || !newLabel.trim() || !newAmount}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-xs font-medium rounded">
              追加
            </button>
            <button type="button" onClick={() => setShowAdd(false)} className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700">✕</button>
          </div>
        )}
      </div>

      {fees.length === 0 && !showAdd && (
        <p className="text-xs text-gray-400 mt-2">上のボタンから初期費用を追加してください</p>
      )}
    </div>
  )
}
