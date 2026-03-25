'use client'

import { useState } from 'react'
import { RentalOption } from '@/types'
import { createOption, updateOption } from '@/actions/pricing-actions'

interface Props {
  options: RentalOption[]
}

interface EditState {
  id: string | null  // null = 新規
  name: string
  monthly_fee: string
  description: string
  is_active: boolean
}

function fmt(n: number) {
  return `¥${n.toLocaleString('ja-JP')}`
}

const EMPTY: EditState = {
  id: null,
  name: '',
  monthly_fee: '',
  description: '',
  is_active: true,
}

export function OptionSection({ options }: Props) {
  const [editing, setEditing] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function startNew() {
    setEditing({ ...EMPTY })
    setError(null)
  }

  function startEdit(opt: RentalOption) {
    setEditing({
      id: opt.id,
      name: opt.name,
      monthly_fee: String(opt.monthly_fee),
      description: opt.description ?? '',
      is_active: opt.is_active,
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
      setError('オプション名を入力してください')
      return
    }
    const fee = parseInt(editing.monthly_fee, 10)
    if (isNaN(fee) || fee < 0) {
      setError('金額は0以上の整数を入力してください')
      return
    }
    setSaving(true)
    const payload = {
      name: editing.name.trim(),
      monthly_fee: fee,
      description: editing.description.trim() || null,
      is_active: editing.is_active,
    }
    const result =
      editing.id === null
        ? await createOption(payload)
        : await updateOption(editing.id, payload)
    setSaving(false)
    if (!result.success) {
      setError(result.error)
    } else {
      setEditing(null)
    }
  }

  const renderEditRow = () => {
    if (!editing) return null
    return (
      <tr className="bg-blue-50">
        <td className="px-4 py-2">
          <input
            type="text"
            placeholder="オプション名"
            value={editing.name}
            onChange={(e) => setEditing({ ...editing, name: e.target.value })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="text"
            placeholder="説明（任意）"
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1">
            <span className="text-sm text-gray-500">¥</span>
            <input
              type="number"
              value={editing.monthly_fee}
              onChange={(e) => setEditing({ ...editing, monthly_fee: e.target.value })}
              className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              min="0"
            />
            <span className="text-sm text-gray-500">/月</span>
          </div>
        </td>
        <td className="px-4 py-2">
          {editing.id !== null && (
            <select
              value={editing.is_active ? 'active' : 'inactive'}
              onChange={(e) =>
                setEditing({ ...editing, is_active: e.target.value === 'active' })
              }
              className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">有効</option>
              <option value="inactive">無効</option>
            </select>
          )}
        </td>
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
      </tr>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-gray-900">月額オプション</h2>
          <p className="text-xs text-gray-500 mt-0.5">契約に追加できる月額オプションを管理します（税込）</p>
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
              <th className="px-4 py-3 font-medium">オプション名</th>
              <th className="px-4 py-3 font-medium">説明</th>
              <th className="px-4 py-3 font-medium w-40">月額（税込）</th>
              <th className="px-4 py-3 font-medium w-20">状態</th>
              <th className="px-4 py-3 w-36"></th>
            </tr>
          </thead>
          <tbody>
            {options.map((opt) => {
              const isEditing = editing?.id === opt.id
              if (isEditing && editing) {
                return (
                  <tr key={opt.id} className="bg-blue-50">
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editing.name}
                        onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <input
                        type="text"
                        value={editing.description}
                        onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-gray-500">¥</span>
                        <input
                          type="number"
                          value={editing.monthly_fee}
                          onChange={(e) => setEditing({ ...editing, monthly_fee: e.target.value })}
                          className="w-24 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                          min="0"
                        />
                        <span className="text-sm text-gray-500">/月</span>
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <select
                        value={editing.is_active ? 'active' : 'inactive'}
                        onChange={(e) =>
                          setEditing({ ...editing, is_active: e.target.value === 'active' })
                        }
                        className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="active">有効</option>
                        <option value="inactive">無効</option>
                      </select>
                    </td>
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
                  </tr>
                )
              }
              return (
                <tr key={opt.id} className="border-b border-gray-50 hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{opt.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{opt.description ?? '—'}</td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {fmt(opt.monthly_fee)}<span className="text-gray-500 font-normal">/月</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                        opt.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {opt.is_active ? '有効' : '無効'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => startEdit(opt)}
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
            {editing?.id === null && renderEditRow()}
          </tbody>
        </table>

        {options.length === 0 && !editing && (
          <div className="text-center py-8 text-sm text-gray-400">
            オプションが登録されていません
          </div>
        )}
      </div>
    </div>
  )
}
