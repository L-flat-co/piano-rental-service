import { getAllPlans, getOptions, getSpotFeeTypes } from '@/actions/pricing-actions'
import { PlanSection } from '@/components/pricing/PlanSection'
import { OptionSection } from '@/components/pricing/OptionSection'
import { SpotFeeSection } from '@/components/pricing/SpotFeeSection'

export default async function PricingPage() {
  const [plans, options, spotFeeTypes] = await Promise.all([
    getAllPlans(),
    getOptions(),
    getSpotFeeTypes(),
  ])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">料金設定</h1>
        <p className="text-sm text-gray-500 mt-1">
          基本プラン・月額オプション・スポット費用のマスタデータを管理します
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <PlanSection plans={plans} />
        <OptionSection options={options} />
        <SpotFeeSection spotFeeTypes={spotFeeTypes} />
      </div>
    </div>
  )
}
