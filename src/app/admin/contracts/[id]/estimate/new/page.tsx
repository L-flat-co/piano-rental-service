import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getContract, getActivePlans, getActiveOptions } from '@/actions/contract-actions'
import { getSpotFeeTypes } from '@/actions/pricing-actions'
import { createClient } from '@/lib/supabase/server'
import { ContractSpotFee } from '@/types'
import { EstimateFromContractForm } from '@/components/contracts/EstimateFromContractForm'

export default async function NewEstimateFromContractPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = await createClient()
  const [contract, plans, options, spotFeeTypes] = await Promise.all([
    getContract(params.id),
    getActivePlans(),
    getActiveOptions(),
    getSpotFeeTypes(),
  ])

  if (!contract) notFound()

  // 契約の初期費用を取得（プリフィル用）
  const { data: spotFeesData } = await supabase
    .from('contract_spot_fees')
    .select('*')
    .eq('contract_id', params.id)
    .eq('section', 'initial')
    .order('created_at')

  const initialFees = (spotFeesData as ContractSpotFee[]) || []

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Link href={`/admin/contracts/${contract.id}`}
            className="text-gray-400 hover:text-gray-600 text-sm">
            ← {contract.customer?.name} さんの契約
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">見積書を作成</h1>
        <p className="text-sm text-gray-500 mt-1">
          プラン・オプション・初期費用を自由に変更して見積書を作成できます。
          同じ契約から複数の見積書を作成できます。
        </p>
      </div>

      <EstimateFromContractForm
        contract={contract}
        plans={plans}
        options={options}
        spotFeeTypes={spotFeeTypes}
        initialFees={initialFees}
      />
    </div>
  )
}
