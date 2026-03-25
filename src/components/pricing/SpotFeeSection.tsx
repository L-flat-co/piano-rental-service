'use client'

import { useState } from 'react'
import { SpotFeeTypeMaster } from '@/types'
import { createSpotFeeType, updateSpotFeeType } from '@/actions/pricing-actions'

interface Props {
  spotFeeTypes: SpotFeeTypeMaster[]
}

interface EditState {
  id: string | null  // null = 新規
  name: string
  unit_price: string
  unit: string
  description: string
  is_active: boolean
}

function fmt(n: number) {
  return `¥${n.toLocaleString('ja-JP')}`
}

const EMPTY: EditState = {
  id: null,
  name: '',
  unit_price: '',
  unit: '',
  description: '',
  is_active: true,
}

export function SpotFeeSection({ spotFeeTypes }: Props) {
  const [editing, setEditing] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startNew() {
    setEditing({ ...EMPTY })
    setError(null)
  }

  function startEdit(fee: SpotFeeTypeMaster) {
    setEditing({
      id: fee.id,
      name: fee.name,
      unit_price: String(fee.unit_price),
      unit: fee.unit ?? '',
      description: fee.description ?? '',
      is_active: fee.is_active,
    })
    setError(null)
  }

  function cancel() {
    setEditing(null)
    setError(null)
  }

  async function handleSave() {
    if (!editing) return
    if (!editing.name.trim()) {
      setError('費用名を入力してください')
      return
    }
    const price = parseInt(editing.unit_price, 10)
    if (isNaN(price) || price < 0) {
      setError('単価は0以上の整数を入力してください')
      return
    }
    setSaving(true)
    const payload = {
      name: editing.name.trim(),
      unit_price: price,
      unit: editing.unit.trim() || null,
      description: editing.description.trim() || null,
      is_active: editing.is_active,
    }
    const result =
      editing.id === null
        ? await createSpotFeeType(payload)
        : await updateSpotFeeType(editing.id, payload)
    setSaving(false)
    if (!result.success) {
      setError(result.error)
    } else {
      setEditing(null)
    }
  }

  function EditRowCells({ state, onUpdate }: {
    state: EditState
    onUpdate: (s: EditState) => void
  }) {
    return (
      <>
        <td className="px-4 py-2">
          <input
            type="text"
            placeholder="費用名"
            value={state.name}
            onChange={(e) => onUpdate({ ...state, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="text"
            placeholder="説明（任意）"
            value={state.description}
            onChange={(e) => onUpdate({ ...state, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">¥</span>
            <input
              type="number"
              value={state.unit_price}
              onChange={(e) => onUpdate({ ...state, unit_price: e.target.value })}
              className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
          </div>
        </td>
        <td className="px-4 py-2">
          <input
            type="text"
            placeholder="例：回・時間"
            value={state.unit}
            onChange={(e) => onUpdate({ ...state, unit: e.target.value })}
            className="w-20 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </td>
        {state.id !== null ? (
          <td className="px-4 py-2">
            <select
              value={state.is_active ? 'active' : 'inactive'}
              onChange={(e) => onUpdate({ ...state, is_active: e.target.value === 'active' })}
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">有効</option>
              <option value="inactive">無効</option>
            </select>
          </td>
        ) : (
          <td className="px-4 py-2" />
        )}
        <td className="px-4 py-2">
          <div className="flex gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? '保存中…' : '保存'}
            </button>
            <button
              onClick={cancel}
              className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300"
            >
              キャンセル
            </button>
          </div>
        </td>
      </>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">スポット費用マスタ</h2>
          <p className="text-xs text-gray-500 mt-0.5">
            調律・運送など契約に都度追加できるスポット費用を管理します（税込）
          </p>
        </div>
        <button
          onClick={startNew}
          disabled={!!editing}
          className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-40"
        >
          ＋ 追加
        </button>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="text-xs text-gray-500 border-b border-gray-100">
              <th className="px-4 py-3 font-medium">費用名</th>
              <th className="px-4 py-3 font-medium">説明</th>
              <th className="px-4 py-3 font-medium w-36">単価（税込）</th>
              <th className="px-4 py-3 font-medium w-20">単位</th>
              <th className="px-4 py-3 font-medium w-20">状態</th>
              <th className="px-4 py-3 w-36"></th>
            </tr>
          </thead>
          <tbody>
            {spotFeeTypes.map((fee) => {
              const isEditing = editing?.id === fee.id
              if (isEditing && editing) {
                return (
                  <tr key={fee.id} className="bg-blue-50">
                    <EditRowCells state={editing} onUpdate={setEditing} />
                  </tr>
                )
              }
              return (
                <tr key={fee.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{fee.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{fee.description ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium">{fmt(fee.unit_price)}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{fee.unit ?? '—'}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        fee.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {fee.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startEdit(fee)}
                      disabled={!!editing}
                      className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50 disabled:opacity-40"
                    >
                      編集
                    </button>
                  </td>
                </tr>
              )
            })}
            {/* 新規追加行 */}
            {editing?.id === null && (
              <tr className="bg-blue-50">
                <EditRowCells state={editing} onUpdate={setEditing} />
              </tr>
            )}
          </tbody>
        </table>

        {spotFeeTypes.length === 0 && !editing && (
          <div className="text-center py-8 text-sm text-gray-400">
            スポット費用が登録されていません
          </div>
        )}
      </div>
    </div>
  )
}
