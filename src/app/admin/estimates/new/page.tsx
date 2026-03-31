import { getCustomers } from '@/actions/customer-actions'
import { getActivePlans, getActiveOptions } from '@/actions/contract-actions'
import { getSpotFeeTypes } from '@/actions/pricing-actions'
import { EstimateForm } from '@/components/estimates/EstimateForm'

export default async function NewEstimatePage() {
  const [customers, plans, options, spotFeeTypes] = await Promise.all([
    getCustomers(),
    getActivePlans(),
    getActiveOptions(),
    getSpotFeeTypes(),
  ])

  const activeCustomers = customers.filter((c) => c.status === 'active')

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">見積書を作成</h1>
        <p className="text-sm text-gray-500 mt-1">
          プラン・オプション・初期費用を選択して見積書を作成します
        </p>
      </div>
      <EstimateForm
        customers={activeCustomers}
        plans={plans}
        options={options}
        spotFeeTypes={spotFeeTypes.filter((s) => s.is_active)}
      />
    </div>
  )
}
