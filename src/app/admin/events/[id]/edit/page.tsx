import { notFound } from 'next/navigation'
import { getEventContract } from '@/actions/event-actions'
import { getCustomers } from '@/actions/customer-actions'
import { getPianos } from '@/actions/piano-actions'
import { EventForm } from '@/components/events/EventForm'

export default async function EditEventPage({
  params,
}: {
  params: { id: string }
}) {
  const [event, customers, allPianos] = await Promise.all([
    getEventContract(params.id),
    getCustomers(),
    getPianos(),
  ])

  if (!event) {
    notFound()
  }

  const activeCustomers = customers.filter((c) => c.status === 'active')
  const availablePianos = allPianos.filter(
    (p) => p.status === 'available' || p.status === 'rented'
  )

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">案件を編集</h1>
        <p className="text-sm text-gray-500 mt-1">{event.event_name}</p>
      </div>
      <EventForm
        event={event}
        customers={activeCustomers}
        availablePianos={availablePianos}
      />
    </div>
  )
}
