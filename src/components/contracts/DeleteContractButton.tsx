'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { deleteContract, DeleteContractOptions } from '@/actions/contract-actions'

interface Props {
  contractId: string
  customerName: string
  /** 関連データの件数（UI に表示） */
  relatedCounts: {
    invoices: number
    payments: number
    spotFees: number
  }
}

type Step = 'closed' | 'choose' | 'full_confirm' | 'partial_select'

export function DeleteContractButton({ contractId, customerName, relatedCounts }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>('closed')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 一部保持のチェックボックス
  const [keepInvoices, setKeepInvoices] = useState(true)
  const [keepPayments, setKeepPayments] = useState(true)
  const [keepSpotFees, setKeepSpotFees] = useState(false)

  const hasRelated = relatedCounts.invoices > 0 || relatedCounts.payments > 0 || relatedCounts.spotFees > 0

  async function handleDelete(options?: DeleteContractOptions) {
    setLoading(true)
    setError(null)
    const result = await deleteContract(contractId, options)
    if (!result.success) {
      setError(result.error)
      setLoading(false)
      return
    }
    router.push('/admin/contracts')
  }

  function close() {
    setStep('closed')
    setError(null)
  }

  return (
    <>
      <button
        onClick={() => setStep('choose')}
        className="bg-white border border-red-300 hover:bg-red-50 text-red-600 text-sm font-medium px-4 py-2 rounded-md"
      >
        契約を抹消
      </button>

      {step !== 'closed' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">

            {/* ステップ1: 選択 */}
            {step === 'choose' && (
              <div className="p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1">契約の抹消</h2>
                <p className="text-sm text-gray-500 mb-4">
                  <strong>{customerName}</strong> の契約を抹消します。
                </p>

                {hasRelated && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-lg text-xs text-gray-600 space-y-0.5">
                    <p className="font-medium text-gray-700 mb-1">関連データ:</p>
                    {relatedCounts.invoices > 0 && <p>・請求書 {relatedCounts.invoices}件</p>}
                    {relatedCounts.payments > 0 && <p>・入金記録 {relatedCounts.payments}件</p>}
                    {relatedCounts.spotFees > 0 && <p>・スポット費用 {relatedCounts.spotFees}件</p>}
                  </div>
                )}

                <div className="space-y-2">
                  <button
                    onClick={() => setStep('full_confirm')}
                    className="w-full text-left px-4 py-3 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <p className="text-sm font-medium text-red-700">完全抹消</p>
                    <p className="text-xs text-red-500 mt-0.5">契約と全ての関連データを削除します</p>
                  </button>

                  {hasRelated && (
                    <button
                      onClick={() => setStep('partial_select')}
                      className="w-full text-left px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <p className="text-sm font-medium text-gray-700">一部データを保持して抹消</p>
                      <p className="text-xs text-gray-500 mt-0.5">保持するデータを選択できます</p>
                    </button>
                  )}
                </div>

                <button onClick={close} className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 py-2">
                  キャンセル
                </button>
              </div>
            )}

            {/* ステップ2a: 完全抹消の確認 */}
            {step === 'full_confirm' && (
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">本当に完全抹消しますか？</h2>
                    <p className="text-xs text-red-600 mt-0.5">この操作は取り消せません</p>
                  </div>
                </div>

                <div className="mb-4 p-3 bg-red-50 rounded-lg text-xs text-red-700">
                  <p>以下が全て削除されます:</p>
                  <ul className="mt-1 space-y-0.5 list-disc list-inside">
                    <li>契約レコード</li>
                    {relatedCounts.invoices > 0 && <li>請求書 {relatedCounts.invoices}件 + 明細行</li>}
                    {relatedCounts.payments > 0 && <li>入金記録 {relatedCounts.payments}件</li>}
                    {relatedCounts.spotFees > 0 && <li>スポット費用 {relatedCounts.spotFees}件</li>}
                    <li>帳票履歴</li>
                  </ul>
                  <p className="mt-1">ピアノは「在庫あり」に戻ります。</p>
                </div>

                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleDelete({ keepInvoices: false, keepPayments: false, keepSpotFees: false })}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-md"
                  >
                    {loading ? '処理中...' : '完全抹消する'}
                  </button>
                  <button
                    onClick={() => setStep('choose')}
                    disabled={loading}
                    className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-md"
                  >
                    戻る
                  </button>
                </div>
              </div>
            )}

            {/* ステップ2b: 一部保持の選択 */}
            {step === 'partial_select' && (
              <div className="p-6">
                <h2 className="text-base font-semibold text-gray-900 mb-1">保持するデータを選択</h2>
                <p className="text-xs text-gray-500 mb-4">
                  チェックを入れたデータは削除されません。契約レコード自体は削除されます。
                </p>

                <div className="space-y-3 mb-5">
                  {relatedCounts.invoices > 0 && (
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      keepInvoices ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}>
                      <input
                        type="checkbox"
                        checked={keepInvoices}
                        onChange={(e) => {
                          setKeepInvoices(e.target.checked)
                          if (!e.target.checked) setKeepPayments(false)
                        }}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <p className="text-sm text-gray-900">請求書を保持</p>
                        <p className="text-xs text-gray-500">{relatedCounts.invoices}件（契約との紐付けは解除されます）</p>
                      </div>
                    </label>
                  )}

                  {relatedCounts.payments > 0 && (
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      keepPayments ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    } ${!keepInvoices ? 'opacity-50' : ''}`}>
                      <input
                        type="checkbox"
                        checked={keepPayments}
                        onChange={(e) => setKeepPayments(e.target.checked)}
                        disabled={!keepInvoices}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <p className="text-sm text-gray-900">入金記録を保持</p>
                        <p className="text-xs text-gray-500">
                          {relatedCounts.payments}件
                          {!keepInvoices && '（請求書を保持する場合のみ）'}
                        </p>
                      </div>
                    </label>
                  )}

                  {relatedCounts.spotFees > 0 && (
                    <label className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                      keepSpotFees ? 'border-blue-300 bg-blue-50' : 'border-gray-200'
                    }`}>
                      <input
                        type="checkbox"
                        checked={keepSpotFees}
                        onChange={(e) => setKeepSpotFees(e.target.checked)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div>
                        <p className="text-sm text-gray-900">スポット費用を保持</p>
                        <p className="text-xs text-gray-500">{relatedCounts.spotFees}件</p>
                      </div>
                    </label>
                  )}
                </div>

                {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

                <div className="flex gap-3">
                  <button
                    onClick={() => handleDelete({ keepInvoices, keepPayments, keepSpotFees })}
                    disabled={loading}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-md"
                  >
                    {loading ? '処理中...' : '抹消する'}
                  </button>
                  <button
                    onClick={() => setStep('choose')}
                    disabled={loading}
                    className="flex-1 border border-gray-300 hover:bg-gray-50 text-gray-700 text-sm font-medium py-2.5 rounded-md"
                  >
                    戻る
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  )
}
