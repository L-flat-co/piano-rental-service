import { notFound } from 'next/navigation'
import { getStringInstrument } from '@/actions/string-instrument-actions'
import { StringInstrumentForm } from '@/components/strings/StringInstrumentForm'

export default async function EditStringInstrumentPage({
  params,
}: {
  params: { id: string }
}) {
  const instrument = await getStringInstrument(params.id)
  if (!instrument) notFound()

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">弦楽器を編集</h1>
        <p className="text-sm text-gray-500 mt-1">{instrument.maker} {instrument.model}</p>
      </div>
      <StringInstrumentForm instrument={instrument} />
    </div>
  )
}
