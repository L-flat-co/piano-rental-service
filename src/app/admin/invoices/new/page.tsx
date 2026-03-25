import { getContracts } from '@/actions/contract-actions'
import { GenerateInvoiceForm } from '@/components/invoices/GenerateInvoiceForm'

export default async function NewInvoicePage() {
  // アクティブな契約のみ（JOIN情報付き）
  const allContracts = await getContracts()
  const activeContracts = allContracts.filter((c) => c.status === 'active')

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">請求書を作成</h1>
        <p className="text-sm text-gray-500 mt-1">
          契約と対象月を選択すると、プラン・オプション・スポット費用を自動集計します
        </p>
      </div>
      <GenerateInvoiceForm contracts={activeContracts} />
    </div>
  )
}
