'use client'

import { useState } from 'react'
import { RentalPlan } from '@/types'
import { updatePlan } from '@/actions/pricing-actions'

interface Props {
  plans: RentalPlan[]
}

const PLAN_TYPE_LABELS: Record<string, string> = {
  home: 'ご家庭用',
  school: '教室用',
}
const PERIOD_LABELS: Record<string, string> = {
  yearly: '1年契約',
  half_year: '半年契約',
  monthly: '単月契約',
}
const PERIOD_ORDER = ['yearly', 'half_year', 'monthly']

function fmt(n: number) {
  return `¥${n.toLocaleString('ja-JP')}`
}

interface EditState {
  id: string
  name: string
  monthly_fee: string
  is_active: boolean
}

export function PlanSection({ plans }: Props) {
  const [editing, setEditing] = useState<EditState | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const home = plans
    .filter((p) => p.plan_type === 'home')
    .sort((a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period))
  const school = plans
    .filter((p) => p.plan_type === 'school')
    .sort((a, b) => PERIOD_ORDER.indexOf(a.period) - PERIOD_ORDER.indexOf(b.period))

  function startEdit(plan: RentalPlan) {
    setEditing({
      id: plan.id,
      name: plan.name,
      monthly_fee: String(plan.monthly_fee),
      is_active: plan.is_active,
    })
    setError(null)
  }

  function cancelEdit() {
    setEditing(null)
    setError(null)
  }

  async function handleSave() {
    if (!editing) return
    const fee = parseInt(editing.monthly_fee, 10)
    if (isNaN(fee) || fee < 0) {
      setError('金額は0以上の整数を入力してください')
      return
    }
    setSaving(true)
    const result = await updatePlan(editing.id, {
      name: editing.name,
      monthly_fee: fee,
      is_active: editing.is_active,
    })
    setSaving(false)
    if (!result.success) {
      setError(result.error)
    } else {
      setEditing(null)
    }
  }

  function renderRows(rows: RentalPlan[]) {
    return rows.map((plan) => {
      const isEditing = editing?.id === plan.id
      if (isEditing && editing) {
        return (
          <tr key={plan.id} className="bg-blue-50">
            <td className="px-4 py-2 text-sm text-gray-600">
              {PERIOD_LABELS[plan.period] ?? plan.period}
            </td>
            <td className="px-4 py-2">
              <input
                type="text"
                value={editing.name}
                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
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
                  className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  onClick={cancelEdit}
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
        <tr key={plan.id} className="hover:bg-gray-50">
          <td className="px-4 py-3 text-sm text-gray-600">
            {PERIOD_LABELS[plan.period] ?? plan.period}
          </td>
          <td className="px-4 py-3 text-sm">{plan.name}</td>
          <td className="px-4 py-3 text-sm font-medium">{fmt(plan.monthly_fee)}<span className="text-gray-500 font-normal">/月</span></td>
          <td className="px-4 py-3">
            <span
              className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                plan.is_active
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {plan.is_active ? '有効' : '無効'}
            </span>
          </td>
          <td className="px-4 py-3">
            <button
              onClick={() => startEdit(plan)}
              className="px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded hover:bg-blue-50"
            >
              編集
            </button>
          </td>
        </tr>
      )
    })
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900">基本プラン</h2>
        <p className="text-xs text-gray-500 mt-0.5">
          ご家庭用・教室用それぞれの契約期間ごとの月額料金を設定します（税込）
        </p>
      </div>

      {error && (
        <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {[
        { label: 'ご家庭用', rows: home },
        { label: '教室用', rows: school },
      ].map(({ label, rows }) => (
        <div key={label} className="px-6 py-4 border-b border-gray-100 last:border-b-0">
          <h3 className="text-sm font-medium text-gray-700 mb-3">{label}</h3>
          <table className="w-full text-left">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-100">
                <th className="px-4 pb-2 font-medium w-28">契約期間</th>
                <th className="px-4 pb-2 font-medium">プラン名</th>
                <th className="px-4 pb-2 font-medium w-40">月額（税込）</th>
                <th className="px-4 pb-2 font-medium w-20">状態</th>
                <th className="px-4 pb-2 w-32"></th>
              </tr>
            </thead>
            <tbody>{renderRows(rows)}</tbody>
          </table>
        </div>
      ))}
    </div>
  )
}
