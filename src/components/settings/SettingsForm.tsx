'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SettingsFormData, updateSettings } from '@/actions/settings-actions'
import { SystemSettings } from '@/types'

interface SettingsFormProps {
  settings: SystemSettings
}

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter()
  const [formData, setFormData] = useState<SettingsFormData>({
    company_name: settings.company_name || '',
    postal_code: settings.postal_code || '',
    address: settings.address || '',
    phone: settings.phone || '',
    email: settings.email || '',
    website: settings.website || '',
    bank_info: settings.bank_info || '',
    tax_rate: settings.tax_rate ?? 0.1,
    invoice_due_days: settings.invoice_due_days ?? 30,
    email_subject_template: settings.email_subject_template || '',
    email_body_template: settings.email_body_template || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  function set<K extends keyof SettingsFormData>(key: K, value: SettingsFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setSaved(false)

    const result = await updateSettings(formData)
    setLoading(false)

    if (!result.success) {
      setError(result.error)
    } else {
      setSaved(true)
      router.refresh()
    }
  }

  const inputClass =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">{error}</div>
      )}
      {saved && (
        <div className="p-3 bg-green-50 border border-green-200 rounded text-sm text-green-700">
          ✓ 設定を保存しました
        </div>
      )}

      {/* 会社情報 */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">会社情報</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>会社名 <span className="text-red-500">*</span></label>
            <input type="text" required value={formData.company_name}
              onChange={(e) => set('company_name', e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>郵便番号</label>
              <input type="text" value={formData.postal_code} placeholder="000-0000"
                onChange={(e) => set('postal_code', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>電話番号</label>
              <input type="text" value={formData.phone} placeholder="03-0000-0000"
                onChange={(e) => set('phone', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div>
            <label className={labelClass}>住所</label>
            <input type="text" value={formData.address}
              onChange={(e) => set('address', e.target.value)} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>メールアドレス</label>
              <input type="email" value={formData.email} placeholder="info@example.com"
                onChange={(e) => set('email', e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Webサイト</label>
              <input type="text" value={formData.website} placeholder="https://example.com"
                onChange={(e) => set('website', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      </div>

      {/* 請求設定 */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">請求設定</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>消費税率</label>
              <div className="flex items-center gap-2">
                <input type="number" min={0} max={1} step={0.01} value={formData.tax_rate}
                  onChange={(e) => set('tax_rate', parseFloat(e.target.value) || 0)}
                  className={`${inputClass} w-24 text-right`} />
                <span className="text-sm text-gray-500">（0.10 = 10%）</span>
              </div>
            </div>
            <div>
              <label className={labelClass}>請求書発行タイミング</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">支払期限の</span>
                <input type="number" min={1} max={90} value={formData.invoice_due_days}
                  onChange={(e) => set('invoice_due_days', parseInt(e.target.value) || 14)}
                  className={`${inputClass} w-16 text-right`} />
                <span className="text-sm text-gray-500">日前に発行</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">例: 14日前 → 支払期限が27日なら13日に発行</p>
            </div>
          </div>
          <div>
            <label className={labelClass}>振込先情報</label>
            <textarea value={formData.bank_info} rows={4}
              onChange={(e) => set('bank_info', e.target.value)}
              className={inputClass + ' resize-none'}
              placeholder="銀行名 支店名 普通/当座 口座番号 口座名義" />
            <p className="text-xs text-gray-400 mt-1">請求書PDF・契約書PDFに記載されます</p>
          </div>
        </div>
      </div>

      {/* メールテンプレート */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-4 pb-2 border-b border-gray-200">メールテンプレート</h2>
        <p className="text-xs text-gray-500 mb-4">
          請求書メール送信時のデフォルト値を設定します。変数: {'{customer_name}'} {'{billing_month}'} {'{total_amount}'} {'{invoice_number}'}
        </p>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>件名テンプレート</label>
            <input type="text" value={formData.email_subject_template}
              onChange={(e) => set('email_subject_template', e.target.value)}
              placeholder="例: 【請求書】{billing_month} {total_amount}"
              className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>追加メッセージ（デフォルト）</label>
            <textarea value={formData.email_body_template} rows={4}
              onChange={(e) => set('email_body_template', e.target.value)}
              className={inputClass + ' resize-none'}
              placeholder="例: お振込先は請求書PDFに記載の口座にお願いいたします。" />
            <p className="text-xs text-gray-400 mt-1">メール送信時の「追加メッセージ」欄の初期値になります</p>
          </div>
        </div>
      </div>

      {/* 保存 */}
      <div className="pt-2">
        <button type="submit" disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50">
          {loading ? '保存中…' : '設定を保存'}
        </button>
      </div>
    </form>
  )
}
