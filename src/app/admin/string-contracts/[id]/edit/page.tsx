import { notFound } from 'next/navigation'
import { getStringContract, getActiveStringRentalPlans } from '@/actions/string-contract-actions'
import { getCustomers } from '@/actions/customer-actions'
import { getStringInstruments } from '@/actions/string-instrument-actions'
import { StringContractForm } from '@/components/strings/StringContractForm'

export default async function EditStringContractPage({
  params,
}: {
  params: { id: string }
}) {
  const [contract, customers, instruments, plans] = await Promise.all([
    getStringContract(params.id),
    getCustomers(),
    getStringInstruments(),
    getActiveStringRentalPlans(),
  ])

  if (!contract) notFound()

  const activeCustomers = customers.filter((c) => c.status === 'active')
  const availableInstruments = instruments.filter((i) => i.status === 'available')

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">弦楽器契約を編集</h1>
      </div>
      <StringContractForm
        contract={contract}
        customers={activeCustomers}
        availableInstruments={availableInstruments}
        plans={plans}
      />
    </div>
  )
}
