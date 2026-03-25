import { notFound } from 'next/navigation'
import { getCustomer } from '@/actions/customer-actions'
import { CustomerForm } from '@/components/customers/CustomerForm'

export default async function EditCustomerPage({
  params,
}: {
  params: { id: string }
}) {
  const customer = await getCustomer(params.id)

  if (!customer) {
    notFound()
  }

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">顧客を編集</h1>
        <p className="text-sm text-gray-500 mt-1">{customer.name}</p>
      </div>
      <CustomerForm customer={customer} />
    </div>
  )
}
