import { getCustomers } from '@/actions/customer-actions'
import { getPianos } from '@/actions/piano-actions'
import { getActivePlans, getActiveOptions } from '@/actions/contract-actions'
import { getSpotFeeTypes } from '@/actions/pricing-actions'
import { ContractForm } from '@/components/contracts/ContractForm'

export default async function NewContractPage() {
  const [customers, allPianos, plans, options, spotFeeTypes] = await Promise.all([
    getCustomers(),
    getPianos(),
    getActivePlans(),
    getActiveOptions(),
    getSpotFeeTypes(),
  ])

  // 在庫中のピアノのみ選択可
  const availablePianos = allPianos.filter((p) => p.status === 'available')

  // 有効な顧客のみ
  const activeCustomers = customers.filter((c) => c.status === 'active')

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">契約を登録</h1>
        <p className="text-sm text-gray-500 mt-1">ご家庭/教室用の新規契約を登録します</p>
      </div>
      <ContractForm
        customers={activeCustomers}
        availablePianos={availablePianos}
        plans={plans}
        options={options}
        spotFeeTypes={spotFeeTypes.filter((s) => s.is_active)}
      />
    </div>
  )
}
