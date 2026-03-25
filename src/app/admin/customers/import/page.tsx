import Link from 'next/link'
import { CustomerImportForm } from '@/components/customers/CustomerImportForm'

export default function CustomerImportPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">顧客CSVインポート</h1>
          <p className="text-sm text-gray-500 mt-1">
            CSVファイルから顧客情報を一括登録します
          </p>
        </div>
        <Link
          href="/admin/customers"
          className="ml-auto text-sm text-gray-500 hover:text-gray-700"
        >
          ← 顧客一覧に戻る
        </Link>
      </div>

      <CustomerImportForm />
    </div>
  )
}
