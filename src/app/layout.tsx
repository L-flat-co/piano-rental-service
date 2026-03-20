import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'ピアノレンタル管理システム | L-FLAT MUSIC',
  description: '株式会社エルフラット ピアノレンタルサービス 管理システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}
