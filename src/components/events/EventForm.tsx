'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { EventFormData, createEventContract, updateEventContract } from '@/actions/event-actions'
import { EventContract, Customer, Piano, PianoType, SpotFeeTypeMaster } from '@/types'
import { PIANO_TYPE_LABELS } from '@/lib/constants'
import { InitialFeeSection, InitialFeeItem, TransportType } from '@/components/shared/InitialFeeSection'

interface EventFormProps {
  event?: EventContract
  customers: Customer[]
  availablePianos: Piano[]
  spotFeeTypes?: SpotFeeTypeMaster[]
}

export function EventForm({ event, customers, availablePianos, spotFeeTypes = [] }: EventFormProps) {
  const router = useRouter()
  const isEdit = !!event

  // 編集時は現在のピアノを含める
  const pianoOptions = isEdit
    ? [
        ...(event.piano ? [event.piano as Piano] : []),
        ...availablePianos.filter((p) => p.id !== event?.piano_id),
      ]
    : availablePianos

  const [formData, setFormData] = useState<EventFormData>({
    customer_id: event?.customer_id || '',
    piano_id: event?.piano_id || null,
    piano_type: event?.piano_type || 'upright',
    event_name: event?.event_name || '',
    venue: event?.venue || '',
    delivery_date: event?.delivery_date || '',
    pickup_date: event?.pickup_date || '',
    memo: event?.memo || '',
  })
  const [initialFees, setInitialFees] = useState<InitialFeeItem[]>([])
  const [transportType, setTransportType] = useState<TransportType>('round_trip')
  const [transportFee, setTransportFee] = useState(0)
  const [pickupFeeEstimate, setPickupFeeEstimate] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  function set<K extends keyof EventFormData>(key: K, value: EventFormData[K]) {
    setFormData((prev) => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.customer_id) { setError('顧客を選択してください'); return }
    if (!formData.event_name.trim()) { setError('案件名を入力してください'); return }
    setLoading(true)
    setError(null)

    const allInitialFees: InitialFeeItem[] = []
    if (transportFee > 0) {
      const label = transportType === 'round_trip' ? '運送費（往復）' : '運送費（搬入）'
      allInitialFees.push({
        fee_type_id: null,
        label,
        amount: transportFee,
        quantity: 1,
        memo: transportType === 'delivery_only' && pickupFeeEstimate > 0
          ? `pickup_estimate:${pickupFeeEstimate}`
          : '',
      })
    }
    if (transportType === 'delivery_only' && pickupFeeEstimate > 0) {
      allInitialFees.push({
        fee_type_id: null,
        label: '搬出費用（参考）',
        amount: pickupFeeEstimate,
        quantity: 0,
        memo: 'pickup_pending',
      })
    }
    allInitialFees.push(...initialFees)

    const result = isEdit
      ? await updateEventContract(event.id, formData)
      : await createEventContract(formData, allInitialFees.length > 0 ? allInitialFees : undefined)

    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push(isEdit ? `/admin/events/${event.id}` : `/admin/events/${result.data.id}`)
  }

  const inputClass =
    'w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
  const labelClass = 'block text-sm font-medium text-gray-700 mb-1'

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          {error}
        </div>
      )}

      {/* 顧客 */}
      <div>
        <label className={labelClass}>
          顧客 <span className="text-red-500">*</span>
        </label>
        <select
          value={formData.customer_id}
          onChange={(e) => set('customer_id', e.target.value)}
          className={inputClass}
          required
        >
          <option value="">-- 選択してください --</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.company_name ? ` (${c.company_name})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 案件名 */}
      <div>
        <label className={labelClass}>
          案件名 <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.event_name}
          onChange={(e) => set('event_name', e.target.value)}
          placeholder="例: 〇〇ホール演奏会"
          className={inputClass}
          required
        />
      </div>

      {/* 会場 */}
      <div>
        <label className={labelClass}>会場</label>
        <input
          type="text"
          value={formData.venue}
          onChange={(e) => set('venue', e.target.value)}
          placeholder="例: 東京文化会館"
          className={inputClass}
        />
      </div>

      {/* 搬入・搬出日 */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>搬入日</label>
          <input
            type="date"
            value={formData.delivery_date}
            onChange={(e) => set('delivery_date', e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass}>搬出日</label>
          <input
            type="date"
            value={formData.pickup_date}
            onChange={(e) => set('pickup_date', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      {/* ピアノ種別 */}
      <div>
        <label className={labelClass}>ピアノ種別</label>
        <select
          value={formData.piano_type}
          onChange={(e) => set('piano_type', e.target.value as PianoType)}
          className={inputClass}
        >
          {(Object.keys(PIANO_TYPE_LABELS) as PianoType[]).map((k) => (
            <option key={k} value={k}>
              {PIANO_TYPE_LABELS[k]}
            </option>
          ))}
        </select>
      </div>

      {/* ピアノ割当（任意） */}
      <div>
        <label className={labelClass}>
          ピアノ
          <span className="text-gray-400 font-normal ml-1">（任意・確定後に割当可）</span>
        </label>
        <select
          value={formData.piano_id || ''}
          onChange={(e) => set('piano_id', e.target.value || null)}
          className={inputClass}
        >
          <option value="">-- 未割当 --</option>
          {pianoOptions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.maker} {p.model}
              {p.serial_number ? ` (${p.serial_number})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* メモ */}
      <div>
        <label className={labelClass}>メモ</label>
        <textarea
          value={formData.memo}
          onChange={(e) => set('memo', e.target.value)}
          rows={3}
          className={inputClass + ' resize-none'}
          placeholder="搬入条件・調律回数・特記事項など"
        />
      </div>

      {/* 初期費用（新規登録時のみ） */}
      {!isEdit && (
        <InitialFeeSection
          spotFeeTypes={spotFeeTypes}
          fees={initialFees}
          onChange={setInitialFees}
          transportType={transportType}
          onTransportTypeChange={setTransportType}
          transportFee={transportFee}
          onTransportFeeChange={setTransportFee}
          pickupFeeEstimate={pickupFeeEstimate}
          onPickupFeeEstimateChange={setPickupFeeEstimate}
        />
      )}

      {/* 送信ボタン */}
      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md disabled:opacity-50"
        >
          {loading ? '保存中…' : isEdit ? '変更を保存' : '案件を登録'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
        >
          キャンセル
        </button>
      </div>
    </form>
  )
}
