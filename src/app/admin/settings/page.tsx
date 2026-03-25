import { redirect } from 'next/navigation'
import { getSettings } from '@/actions/settings-actions'
import { SettingsForm } from '@/components/settings/SettingsForm'

export default async function SettingsPage() {
  const settings = await getSettings()

  if (!settings) {
    redirect('/admin/dashboard')
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">システム設定</h1>
        <p className="text-sm text-gray-500 mt-1">
          会社情報・請求設定を管理します。PDF帳票やメールに反映されます。
        </p>
      </div>
      <SettingsForm settings={settings} />
    </div>
  )
}
