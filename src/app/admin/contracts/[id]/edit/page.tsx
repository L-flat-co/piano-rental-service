import { notFound } from 'next/navigation'
import { getContract, getActivePlans, getActiveOptions } from '@/actions/contract-actions'
import { getCustomers } from '@/actions/customer-actions'
import { getPianos } from '@/actions/piano-actions'
import { ContractForm } from '@/components/contracts/ContractForm'

export default async function EditContractPage({
  params,
}: {
  params: { id: string }
}) {
  const [contract, customers, allPianos, plans, options] = await Promise.all([
    getContract(params.id),
    getCustomers(),
    getPianos(),
    getActivePlans(),
    getActiveOptions(),
  ])

  if (!contract) {
    notFound()
  }

  // 在庫ピアノ（現在のピアノは別途ContractForm内で追加される）
  const availablePianos = allPianos.filter((p) => p.status === 'available')
  const activeCustomers = customers.filter((c) => c.status === 'active')

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">契約を編集</h1>
        <p className="text-sm text-gray-500 mt-1">{contract.customer?.name} さんの契約</p>
      </div>
      <ContractForm
        contract={contract}
        customers={activeCustomers}
        availablePianos={availablePianos}
        plans={plans}
        options={options}
      />
    </div>
  )
}
