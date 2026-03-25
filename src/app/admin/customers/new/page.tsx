import { CustomerForm } from '@/components/customers/CustomerForm'

export default function NewCustomerPage() {
  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">顧客を追加</h1>
        <p className="text-sm text-gray-500 mt-1">新しい顧客を登録します</p>
      </div>
      <CustomerForm />
    </div>
  )
}
