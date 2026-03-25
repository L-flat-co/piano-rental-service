'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CustomerFormData, createCustomer, updateCustomer } from '@/actions/customer-actions'
import { Customer } from '@/types'

interface CustomerFormProps {
  customer?: Customer
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter()
  const isEdit = !!customer

  const [formData, setFormData] = useState<CustomerFormData>({
    name: customer?.name || '',
    name_kana: customer?.name_kana || '',
    company_name: customer?.company_name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    postal_code: customer?.postal_code || '',
    address: customer?.address || '',
    status: customer?.status || 'active',
    memo: customer?.memo || '',
  })
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const result = isEdit
      ? await updateCustomer(customer!.id, formData)
      : await createCustomer(formData)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    if (isEdit) {
      router.push(`/admin/customers/${customer!.id}`)
    } else {
      router.push('/admin/customers')
    }
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {/* 基本情報 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">基本情報</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              お名前 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="山田 花子"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">フリガナ</label>
            <input
              type="text"
              name="name_kana"
              value={formData.name_kana}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="ヤマダ ハナコ"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              法人名・教室名
            </label>
            <input
              type="text"
              name="company_name"
              value={formData.company_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="○○ピアノ教室"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ステータス</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">有効</option>
              <option value="suspended">休止</option>
              <option value="terminated">解約済み</option>
            </select>
          </div>
        </div>
      </div>

      {/* 連絡先 */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">連絡先</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              メールアドレス
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="hanako@example.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電話番号</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="090-0000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">郵便番号</label>
            <input
              type="text"
              name="postal_code"
              value={formData.postal_code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="123-4567"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">住所</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="東京都渋谷区..."
            />
          </div>
        </div>
      </div>

      {/* メモ */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-base font-semibold text-gray-900 mb-4">メモ</h2>
        <textarea
          name="memo"
          value={formData.memo}
          onChange={handleChange}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="社内メモを入力..."
        />
      </div>

      {/* ボタン */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-6 py-2 rounded-md text-sm"
        >
          {loading ? '保存中...' : isEdit ? '更新する' : '登録する'}
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
