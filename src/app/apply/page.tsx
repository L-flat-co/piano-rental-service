import { getActivePlans, getActiveOptions } from '@/actions/contract-actions'
import { ApplicationForm } from '@/components/applications/ApplicationForm'

export default async function ApplyPage() {
  const [plans, options] = await Promise.all([
    getActivePlans(),
    getActiveOptions(),
  ])

  return (
    <div>
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">ピアノレンタル お申込み</h1>
        <p className="text-sm text-gray-500 mt-2">
          以下のフォームに必要事項をご記入ください。<br />
          内容を確認の上、担当者よりご連絡いたします。
        </p>
      </div>
      <ApplicationForm plans={plans} options={options} />
    </div>
  )
}
