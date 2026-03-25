import { getCustomers } from '@/actions/customer-actions'
import { getPianos } from '@/actions/piano-actions'
import { getSpotFeeTypes } from '@/actions/pricing-actions'
import { EventForm } from '@/components/events/EventForm'

export default async function NewEventPage() {
  const [customers, allPianos, spotFeeTypes] = await Promise.all([
    getCustomers(),
    getPianos(),
    getSpotFeeTypes(),
  ])

  const activeCustomers = customers.filter((c) => c.status === 'active')
  // イベント用は在庫・貸出中問わず選択可（搬入日が被らなければOK）
  const availablePianos = allPianos.filter(
    (p) => p.status === 'available' || p.status === 'rented'
  )

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">イベント案件を登録</h1>
        <p className="text-sm text-gray-500 mt-1">演奏会・発表会などのイベント用案件を登録します</p>
      </div>
      <EventForm
        customers={activeCustomers}
        availablePianos={availablePianos}
        spotFeeTypes={spotFeeTypes.filter((s) => s.is_active)}
      />
    </div>
  )
}
