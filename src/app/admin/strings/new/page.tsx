import { StringInstrumentForm } from '@/components/strings/StringInstrumentForm'

export default function NewStringInstrumentPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">弦楽器を登録</h1>
        <p className="text-sm text-gray-500 mt-1">バイオリン・ビオラ・チェロの新規登録</p>
      </div>
      <StringInstrumentForm />
    </div>
  )
}
