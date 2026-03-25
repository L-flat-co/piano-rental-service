'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

type ImportResult = {
  success: boolean
  imported: number
  skipped: { row: number; reason: string }[]
  total: number
}

export function CustomerImportForm() {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setError(null)
    setResult(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!file) {
      setError('CSVファイルを選択してください')
      return
    }
    if (!file.name.endsWith('.csv')) {
      setError('CSVファイル（.csv）のみアップロード可能です')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await fetch('/api/customers/import', {
        method: 'POST',
        body: formData,
      })
      const json = await res.json()
      if (!res.ok || !json.success) {
        setError(json.error || 'インポートに失敗しました')
      } else {
        setResult(json as ImportResult)
        router.refresh()
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* フォーマット説明 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
        <h2 className="text-sm font-semibold text-blue-800 mb-2">CSVフォーマット</h2>
        <p className="text-xs text-blue-700 mb-3">
          1行目はヘッダー行として認識されます。以下のカラム名に対応しています。
        </p>
        <div className="overflow-x-auto">
          <table className="text-xs text-blue-800 border-collapse">
            <thead>
              <tr className="bg-blue-100">
                <th className="border border-blue-300 px-3 py-1.5 text-left font-semibold">カラム名（CSVヘッダー）</th>
                <th className="border border-blue-300 px-3 py-1.5 text-left font-semibold">フィールド</th>
                <th className="border border-blue-300 px-3 py-1.5 text-left font-semibold">必須</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['顧客名 / 氏名 / 名前', '顧客名', '必須'],
                ['顧客名（カナ）/ カナ / フリガナ', 'よみがな', '任意'],
                ['会社名 / 法人名', '会社名', '任意'],
                ['メールアドレス / メール / email', 'メール', '任意'],
                ['電話番号 / TEL', '電話番号', '任意'],
                ['郵便番号', '郵便番号', '任意'],
                ['住所', '住所', '任意'],
                ['メモ / 備考', '備考', '任意'],
              ].map(([col, field, req]) => (
                <tr key={col}>
                  <td className="border border-blue-200 px-3 py-1.5 font-mono">{col}</td>
                  <td className="border border-blue-200 px-3 py-1.5">{field}</td>
                  <td className="border border-blue-200 px-3 py-1.5">
                    {req === '必須' ? (
                      <span className="text-red-600 font-semibold">必須</span>
                    ) : (
                      <span className="text-blue-600">任意</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-blue-600 mt-3">
          ※ 文字コード：UTF-8（BOM付き推奨）/ Shift-JIS でも動作します<br />
          ※ 顧客名が空の行はスキップされます
        </p>
      </div>

      {/* サンプルダウンロード */}
      <div className="flex items-center gap-3">
        <a
          href="data:text/csv;charset=utf-8,%EF%BB%BF%E9%A1%A7%E5%AE%A2%E5%90%8D%2C%E9%A1%A7%E5%AE%A2%E5%90%8D%EF%BC%88%E3%82%AB%E3%83%8A%EF%BC%89%2C%E4%BC%9A%E7%A4%BE%E5%90%8D%2C%E3%83%A1%E3%83%BC%E3%83%AB%E3%82%A2%E3%83%89%E3%83%AC%E3%82%B9%2C%E9%9B%BB%E8%A9%B1%E7%95%AA%E5%8F%B7%2C%E9%83%B5%E4%BE%BF%E7%95%AA%E5%8F%B7%2C%E4%BD%8F%E6%89%80%2C%E3%83%A1%E3%83%A2%0D%0A%E5%B1%B1%E7%94%B0%E8%8A%B1%E5%AD%90%2C%E3%83%A4%E3%83%9E%E3%83%80%E3%83%8F%E3%83%8A%E3%82%B3%2C%2Chanako%40example.com%2C090-1234-5678%2C150-0001%2C%E6%9D%B1%E4%BA%AC%E9%83%BD%E6%B8%8B%E8%B0%B7%E5%8C%BA%E7%A5%9E%E5%AE%AE%E5%89%8D1-1-1%2C"
          download="customers_sample.csv"
          className="flex items-center gap-1.5 text-sm text-blue-600 border border-blue-300 rounded px-3 py-1.5 hover:bg-blue-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          サンプルCSVをダウンロード
        </a>
      </div>

      {/* アップロードフォーム */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">CSVファイルをアップロード</h2>

        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <svg className="w-10 h-10 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {file ? (
            <div>
              <p className="text-sm font-medium text-blue-700">{file.name}</p>
              <p className="text-xs text-gray-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div>
              <p className="text-sm text-gray-600">クリックしてCSVファイルを選択</p>
              <p className="text-xs text-gray-400 mt-1">または、ここにファイルをドラッグ＆ドロップ</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            type="submit"
            disabled={!file || loading}
            className="px-5 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'インポート中…' : 'インポート実行'}
          </button>
          <a
            href="/admin/customers"
            className="px-5 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
          >
            キャンセル
          </a>
        </div>
      </form>

      {/* 結果表示 */}
      {result && (
        <div className={`rounded-lg border p-5 ${result.imported > 0 ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <h3 className={`text-sm font-semibold mb-2 ${result.imported > 0 ? 'text-green-800' : 'text-yellow-800'}`}>
            インポート完了
          </h3>
          <div className="text-sm space-y-1">
            <p className="text-green-700">✓ {result.imported}件 インポートしました</p>
            {result.skipped.length > 0 && (
              <p className="text-yellow-700">⚠ {result.skipped.length}件 スキップ（合計 {result.total}件中）</p>
            )}
          </div>
          {result.skipped.length > 0 && (
            <ul className="mt-2 space-y-0.5">
              {result.skipped.map((s) => (
                <li key={s.row} className="text-xs text-yellow-700">
                  {s.row}行目: {s.reason}
                </li>
              ))}
            </ul>
          )}
          {result.imported > 0 && (
            <a
              href="/admin/customers"
              className="mt-3 inline-block text-sm text-green-700 underline hover:text-green-900"
            >
              顧客一覧を確認する →
            </a>
          )}
        </div>
      )}
    </div>
  )
}
