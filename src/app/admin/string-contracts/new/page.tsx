import { getCustomers } from '@/actions/customer-actions'
import { getStringInstruments } from '@/actions/string-instrument-actions'
import { getActiveStringRentalPlans } from '@/actions/string-contract-actions'
import { StringContractForm } from '@/components/strings/StringContractForm'

export default async function NewStringContractPage() {
  const [customers, instruments, plans] = await Promise.all([
    getCustomers(),
    getStringInstruments(),
    getActiveStringRentalPlans(),
  ])

  const activeCustomers = customers.filter((c) => c.status === 'active')
  const availableInstruments = instruments.filter((i) => i.status === 'available')

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">弦楽器契約を登録</h1>
        <p className="text-sm text-gray-500 mt-1">サブスクリプション（長期）またはスポット（短期）の契約を登録します</p>
      </div>
      <StringContractForm
        customers={activeCustomers}
        availableInstruments={availableInstruments}
        plans={plans}
      />
    </div>
  )
}
