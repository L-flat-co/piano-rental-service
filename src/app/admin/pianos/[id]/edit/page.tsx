import { notFound } from 'next/navigation'
import { getPiano } from '@/actions/piano-actions'
import { PianoForm } from '@/components/pianos/PianoForm'

export default async function EditPianoPage({
  params,
}: {
  params: { id: string }
}) {
  const piano = await getPiano(params.id)

  if (!piano) {
    notFound()
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ピアノを編集</h1>
        <p className="text-sm text-gray-500 mt-1">
          {piano.maker} {piano.model}
        </p>
      </div>
      <PianoForm piano={piano} />
    </div>
  )
}
