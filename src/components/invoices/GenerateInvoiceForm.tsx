'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GenerateInvoiceInput, generateInvoice } from '@/actions/invoice-actions'
import { Contract } from '@/types'
import { formatCurrency } from '@/lib/utils'

interface GenerateInvoiceFormProps {
  contracts: Contract[]
  invoiceDueDays?: number
}

/** start_dateの日付-1 = 支払期限（29〜31日は28日扱い） */
function calcDueDateFromStartDate(billingMonth: string, startDate: string): string {
  const [y, m] = billingMonth.split('-').map(Number)
  const startDay = new Date(startDate).getDate() || 1
  const safeDay = Math.min(startDay, 28)
  const dueDay = Math.max(safeDay - 1, 1)
  const due = new Date(y, m - 1, dueDay)
  return `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`
}

/** 支払期限から発行日を逆算 */
function calcIssueDateFromDue(dueDate: string, dueDays: number): string {
  const d = new Date(dueDate)
  d.setDate(d.getDate() - dueDays)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function GenerateInvoiceForm({ contracts, invoiceDueDays = 14 }: GenerateInvoiceFormProps) {
  const router = useRouter()

  const today = new Date()
  const defaultBillingMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
  const todayStr = today.toISOString().split('T')[0]

  const [formData, setFormData] = useState<GenerateInvoiceInput>({
    contract_id: '',
    billing_month: defaultBillingMonth,
    issue_date: todayStr,
    due_date: '',
    notes: '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const selectedContract = contracts.find((c) => c.id === formData.contract_id)
  const monthlyTotal =
    (selectedContract?.plan?.monthly_fee || 0) +
    (selectedContract?.options?.reduce((sum, o) => sum + o.monthly_fee, 0) || 0)

  /** 契約選択 or 対象月変更 → 支払期限・発行日を自動計算 */
  function recalcDates(contractId: string, billingMonth: string) {
    const contract = contracts.find((c) => c.id === contractId)
    if (contract && billingMonth) {
      const dueDate = calcDueDateFromStartDate(billingMonth, contract.start_date)
      const issueDate = calcIssueDateFromDue(dueDate, invoiceDueDays)
      return { due_date: dueDate, issue_date: issueDate }
    }
    return {}
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      // 契約選択 or 対象月変更 → 日付を自動再計算
      if (name === 'contract_id' || name === 'billing_month') {
        const cid = name === 'contract_id' ? value : prev.contract_id
        const bm = name === 'billing_month' ? value : prev.billing_month
        Object.assign(next, recalcDates(cid, bm))
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.contract_id) {
      setError('契約を選択してください')
      return
    }
    setLoading(true)
    setError(null)

    const result = await generateInvoice(formData)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(`/admin/invoices/${result.data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 契約選択 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">対象契約</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            契約 <span className="text-red-500">*</span>
          </label>
          <select
            name="contract_id"
            value={formData.contract_id}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">契約を選択...</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.customer?.name} /{' '}
                {c.piano
                  ? `${c.piano.maker} ${c.piano.model}`
                  : '—'}{' '}
                / {c.plan?.name}
              </option>
            ))}
          </select>
        </div>

        {/* 選択中の契約情報 */}
        {selectedContract && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-800">
            <div className="flex justify-between">
              <span>月額合計（税込）</span>
              <span className="font-bold">{formatCurrency(monthlyTotal)}</span>
            </div>
            {selectedContract.options && selectedContract.options.length > 0 && (
              <div className="mt-1 text-xs text-blue-600">
                オプション: {selectedContract.options.map((o) => o.name).join('・')}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 請求情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">請求情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              対象月 <span className="text-red-500">*</span>
            </label>
            <input
              type="month"
              name="billing_month"
              value={formData.billing_month}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              発行日 <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="issue_date"
              value={formData.issue_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">支払い期限</label>
            <input
              type="date"
              name="due_date"
              value={formData.due_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* 備考 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">備考（PDF に印字）</h2>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="振込先情報など..."
        />
      </div>

      {/* ボタン */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded-md text-sm"
        >
          {loading ? '生成中...' : '請求書を生成する'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-gray-600 hover:text-gray-900 text-sm font-medium px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
