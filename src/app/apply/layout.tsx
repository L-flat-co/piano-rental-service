export default function ApplyLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-[#1e3a5f] text-white">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold tracking-wide">L-flat PiANOS</p>
            <p className="text-xs text-white/70">ピアノレンタルサービス</p>
          </div>
        </div>
      </header>

      {/* コンテンツ */}
      <main className="max-w-3xl mx-auto px-6 py-8">
        {children}
      </main>

      {/* フッター */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="max-w-3xl mx-auto px-6 py-6 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} 株式会社エルフラット　All Rights Reserved.
          </p>
        </div>
      </footer>
    </div>
  )
}
