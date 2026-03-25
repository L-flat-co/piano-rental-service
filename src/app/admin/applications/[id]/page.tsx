import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getApplication } from '@/actions/application-actions'
import { getPianos } from '@/actions/piano-actions'
import { APPLICATION_STATUS_LABELS, APPLICATION_STATUS_COLORS } from '@/lib/constants-applications'
import { CONTRACT_PERIOD_LABELS, PIANO_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatCurrency } from '@/lib/utils'
import { ApplicationStatusButtons } from '@/components/applications/ApplicationStatusButtons'
import { ConvertToContractButton } from '@/components/applications/ConvertToContractButton'

export default async function ApplicationDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const [app, allPianos] = await Promise.all([
    getApplication(params.id),
    getPianos(),
  ])

  if (!app) notFound()

  const availablePianos = allPianos.filter((p) => p.status === 'available')

  return (
    <div className="p-6 max-w-4xl">
      {/* ヘッダー */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{app.applicant_name}</h1>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${APPLICATION_STATUS_COLORS[app.status]}`}>
              {APPLICATION_STATUS_LABELS[app.status]}
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">
            {app.applicant_email} / 申込日: {formatDate(app.created_at)}
          </p>
        </div>
        <Link href="/admin/applications" className="text-gray-500 hover:text-gray-700 text-sm px-3 py-2">
          ← 一覧に戻る
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* 申込者情報 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">申込者情報</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500">氏名</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{app.applicant_name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">フリガナ</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{app.applicant_kana || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">メール</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{app.applicant_email}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">電話</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{app.applicant_phone || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">住所</dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {app.applicant_postal_code ? `〒${app.applicant_postal_code} ` : ''}
                  {app.applicant_address || '—'}
                </dd>
              </div>
              {app.company_name && (
                <div>
                  <dt className="text-xs font-medium text-gray-500">法人名</dt>
                  <dd className="mt-0.5 text-sm text-gray-900">{app.company_name}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* レンタル希望 */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-900 mb-4">レンタル希望</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              <div>
                <dt className="text-xs font-medium text-gray-500">利用用途</dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {app.plan_type === 'home' ? 'ご家庭用' : '教室用'}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">契約期間</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{CONTRACT_PERIOD_LABELS[app.contract_period]}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">ピアノ種別</dt>
                <dd className="mt-0.5 text-sm text-gray-900">{PIANO_TYPE_LABELS[app.piano_type]}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-gray-500">利用開始希望日</dt>
                <dd className="mt-0.5 text-sm text-gray-900">
                  {app.preferred_start_date ? formatDate(app.preferred_start_date) : '未指定'}
                </dd>
              </div>
            </dl>
          </div>

          {/* 設置場所 */}
          {(app.installation_address || app.installation_floor) && (
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h2 className="text-base font-semibold text-gray-900 mb-4">設置場所</h2>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                <div className="col-span-2">
                  <dt className="text-xs font-medium text-gray-500">住所</dt>
                  <dd className="mt-0.5 text-sm text-gray-900">{app.installation_address || '申込者住所と同じ'}</dd>
                </div>
                {app.installation_floor && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500">階数</dt>
                    <dd className="mt-0.5 text-sm text-gray-900">{app.installation_floor}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-gray-500">エレベーター</dt>
                  <dd className="mt-0.5 text-sm text-gray-900">{app.installation_elevator ? 'あり' : 'なし'}</dd>
                </div>
              </dl>
            </div>
          )}

          {/* 契約リンク（変換済みの場合） */}
          {app.status === 'converted' && app.contract_id && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm text-green-800 font-medium mb-1">✓ 契約に変換済み</p>
              <Link href={`/admin/contracts/${app.contract_id}`}
                className="text-sm text-blue-600 hover:underline">
                契約詳細を表示 →
              </Link>
            </div>
          )}
        </div>

        {/* サイドバー */}
        <div className="space-y-4">
          {/* ステータス操作 */}
          {app.status !== 'converted' && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">ステータス変更</h3>
              <ApplicationStatusButtons applicationId={app.id} currentStatus={app.status} />
            </div>
          )}

          {/* 契約変換（承認済みの場合） */}
          {app.status === 'approved' && (
            <div className="bg-white rounded-lg border border-blue-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">契約に変換</h3>
              <ConvertToContractButton
                applicationId={app.id}
                pianoType={app.piano_type}
                availablePianos={availablePianos}
              />
            </div>
          )}

          {/* 顧客リンク */}
          {app.customer_id && app.customer && (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">紐付き顧客</h3>
              <Link href={`/admin/customers/${app.customer.id}`}
                className="text-sm text-blue-600 hover:underline">
                {app.customer.name}
              </Link>
            </div>
          )}

          {/* 管理者メモ */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">管理者メモ</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">
              {app.admin_memo || '—'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
