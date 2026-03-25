import Link from 'next/link'

export default function ApplyCompletePage() {
  return (
    <div className="text-center py-16">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">お申込みありがとうございます</h1>
      <p className="text-gray-600 mb-2">
        お申込み内容を確認の上、担当者よりご連絡いたします。
      </p>
      <p className="text-sm text-gray-500 mb-8">
        通常1〜2営業日以内にメールまたはお電話にてご連絡いたします。
      </p>
      <Link
        href="/apply"
        className="inline-block px-6 py-2.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
      >
        トップに戻る
      </Link>
    </div>
  )
}
