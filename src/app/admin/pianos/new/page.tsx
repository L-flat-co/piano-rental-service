import { PianoForm } from '@/components/pianos/PianoForm'

export default function NewPianoPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">ピアノを追加</h1>
        <p className="text-sm text-gray-500 mt-1">新しいピアノを在庫に登録します</p>
      </div>
      <PianoForm />
    </div>
  )
}
