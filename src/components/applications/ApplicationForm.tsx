'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitApplication, ApplicationFormData } from '@/actions/application-actions'
import { RentalPlan, RentalOption, ContractPeriod, PianoType } from '@/types'
import { CONTRACT_PERIOD_LABELS, PIANO_TYPE_LABELS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'

interface ApplicationFormProps {
  plans: RentalPlan[]
  options: RentalOption[]
}

export function ApplicationForm({ plans, options }: ApplicationFormProps) {
  const router = useRouter()

  const [formData, setFormData] = useState<ApplicationFormData>({
    applicant_name: '',
    applicant_kana: '',
    applicant_email: '',
    applicant_phone: '',
    applicant_postal_code: '',
    applicant_address: '',
    company_name: '',
    plan_type: 'home',
    contract_period: 'monthly',
    piano_type: 'upright',
    preferred_start_date: '',
    option_ids: [],
    installation_address: '',
    installation_floor: '',
    installation_elevator: false,
  })
  const [sameAddress, setSameAddress] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof ApplicationFormData>(key: K, value: ApplicationFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  function toggleOption(optionId: string) {
    setFormData((prev) => ({
      ...prev,
      option_ids: prev.option_ids.includes(optionId)
        ? prev.option_ids.filter((id) => id !== optionId)
        : [...prev.option_ids, optionId],
    }))
  }

  // 選択中のプラン
  const selectedPlan = plans.find(
    (p) => p.plan_type === formData.plan_type && p.period === formData.contract_period
  )
  const selectedOptions = options.filter((o) => formData.option_ids.includes(o.id))
  const monthlyTotal =
    (selectedPlan?.monthly_fee || 0) +
    selectedOptions.reduce((s, o) => s + o.monthly_fee, 0)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.applicant_name.trim()) { setError('お名前を入力してください'); return }
    if (!formData.applicant_email.trim()) { setError('メールアドレスを入力してください'); return }

    setLoading(true)
    setError(null)

    const result = await submitApplication(formData)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/apply/complete')
  }

  const inputClass =
    'w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{error}</div>
      )}

      {/* お客様情報 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">お客様情報</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>お名前 <span className="text-red-500">*</span></label>
              <input type="text" required value={formData.applicant_name}
                onChange={(e) => set('applicant_name', e.target.value)} className={inputClass}
                placeholder="山田 太郎" />
            </div>
            <div>
              <label className={labelClass}>フリガナ</label>
              <input type="text" value={formData.applicant_kana}
                onChange={(e) => set('applicant_kana', e.target.value)} className={inputClass}
                placeholder="ヤマダ タロウ" />
            </div>
          </div>
          <div>
            <label className={labelClass}>メールアドレス <span className="text-red-500">*</span></label>
            <input type="email" required value={formData.applicant_email}
              onChange={(e) => set('applicant_email', e.target.value)} className={inputClass}
              placeholder="example@email.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>電話番号</label>
              <input type="tel" value={formData.applicant_phone}
                onChange={(e) => set('applicant_phone', e.target.value)} className={inputClass}
                placeholder="090-0000-0000" />
            </div>
            <div>
              <label className={labelClass}>法人名（法人の場合）</label>
              <input type="text" value={formData.company_name}
                onChange={(e) => set('company_name', e.target.value)} className={inputClass} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>郵便番号</label>
              <input type="text" value={formData.applicant_postal_code}
                onChange={(e) => set('applicant_postal_code', e.target.value)} className={inputClass}
                placeholder="000-0000" />
            </div>
            <div className="col-span-2">
              <label className={labelClass}>住所</label>
              <input type="text" value={formData.applicant_address}
                onChange={(e) => set('applicant_address', e.target.value)} className={inputClass} />
            </div>
          </div>
        </div>
      </section>

      {/* レンタル希望 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">レンタル希望</h2>
        <div className="space-y-5">
          {/* プラン種別 */}
          <div>
            <label className={labelClass}>ご利用用途</label>
            <div className="flex gap-4">
              {(['home', 'school'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="planType" checked={formData.plan_type === t}
                    onChange={() => set('plan_type', t)}
                    className="w-4 h-4 text-[#1e3a5f] focus:ring-[#1e3a5f]" />
                  <span className="text-sm">{t === 'home' ? 'ご家庭用' : '教室用'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* 契約期間 */}
          <div>
            <label className={labelClass}>契約期間</label>
            <div className="flex gap-3">
              {(['yearly', 'half_year', 'monthly'] as ContractPeriod[]).map((p) => {
                const plan = plans.find((pl) => pl.plan_type === formData.plan_type && pl.period === p)
                return (
                  <label key={p}
                    className={`flex-1 border rounded-lg p-3 cursor-pointer text-center transition-colors ${
                      formData.contract_period === p
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 ring-2 ring-[#1e3a5f]/30'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <input type="radio" name="contractPeriod" className="sr-only"
                      checked={formData.contract_period === p}
                      onChange={() => set('contract_period', p)} />
                    <p className="text-sm font-medium text-gray-900">{CONTRACT_PERIOD_LABELS[p]}</p>
                    {plan && (
                      <p className="text-xs text-[#1e3a5f] font-bold mt-1">
                        {formatCurrency(plan.monthly_fee)}/月
                      </p>
                    )}
                  </label>
                )
              })}
            </div>
          </div>

          {/* ピアノ種別 */}
          <div>
            <label className={labelClass}>ピアノ種別</label>
            <div className="flex gap-3">
              {(['upright', 'grand', 'digital'] as PianoType[]).map((t) => (
                <label key={t}
                  className={`flex-1 border rounded-lg p-3 cursor-pointer text-center transition-colors ${
                    formData.piano_type === t
                      ? 'border-[#1e3a5f] bg-[#1e3a5f]/5 ring-2 ring-[#1e3a5f]/30'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}>
                  <input type="radio" name="pianoType" className="sr-only"
                    checked={formData.piano_type === t}
                    onChange={() => set('piano_type', t)} />
                  <p className="text-sm font-medium text-gray-900">{PIANO_TYPE_LABELS[t]}</p>
                </label>
              ))}
            </div>
          </div>

          {/* オプション */}
          {options.length > 0 && (
            <div>
              <label className={labelClass}>オプション（任意）</label>
              <div className="space-y-2">
                {options.map((opt) => (
                  <label key={opt.id}
                    className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer transition-colors ${
                      formData.option_ids.includes(opt.id)
                        ? 'border-[#1e3a5f] bg-[#1e3a5f]/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={formData.option_ids.includes(opt.id)}
                        onChange={() => toggleOption(opt.id)}
                        className="w-4 h-4 text-[#1e3a5f] rounded focus:ring-[#1e3a5f]" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{opt.name}</p>
                        {opt.description && <p className="text-xs text-gray-500">{opt.description}</p>}
                      </div>
                    </div>
                    <p className="text-sm font-bold text-[#1e3a5f]">+{formatCurrency(opt.monthly_fee)}/月</p>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* 月額合計 */}
          <div className="bg-[#1e3a5f]/5 rounded-lg p-4 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">月額合計（税込）</span>
            <span className="text-xl font-bold text-[#1e3a5f]">{formatCurrency(monthlyTotal)}/月</span>
          </div>

          {/* 利用開始希望日 */}
          <div>
            <label className={labelClass}>ご利用開始希望日</label>
            <input type="date" value={formData.preferred_start_date}
              onChange={(e) => set('preferred_start_date', e.target.value)} className={inputClass + ' max-w-xs'} />
          </div>
        </div>
      </section>

      {/* 設置場所 */}
      <section className="bg-white rounded-xl border border-gray-200 p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">設置場所</h2>
        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={sameAddress}
              onChange={(e) => setSameAddress(e.target.checked)}
              className="w-4 h-4 text-[#1e3a5f] rounded focus:ring-[#1e3a5f]" />
            <span className="text-sm text-gray-700">お客様住所と同じ</span>
          </label>
          {!sameAddress && (
            <div className="space-y-3">
              <div>
                <label className={labelClass}>設置先住所</label>
                <input type="text" value={formData.installation_address}
                  onChange={(e) => set('installation_address', e.target.value)} className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>階数</label>
                  <input type="text" value={formData.installation_floor}
                    onChange={(e) => set('installation_floor', e.target.value)} className={inputClass}
                    placeholder="例: 2階" />
                </div>
                <div className="flex items-end pb-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={formData.installation_elevator}
                      onChange={(e) => set('installation_elevator', e.target.checked)}
                      className="w-4 h-4 text-[#1e3a5f] rounded" />
                    <span className="text-sm text-gray-700">エレベーターあり</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 送信ボタン */}
      <div className="text-center">
        <button type="submit" disabled={loading}
          className="px-10 py-3 bg-[#1e3a5f] hover:bg-[#2d5a8e] text-white text-base font-bold rounded-lg disabled:opacity-50 transition-colors shadow-sm">
          {loading ? '送信中…' : '申込を送信する'}
        </button>
        <p className="text-xs text-gray-400 mt-3">
          送信後、担当者よりご連絡いたします。
        </p>
      </div>
    </form>
  )
}
