'use client'

import { useState } from 'react'

export function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={handleCopy}
      className="text-xs text-blue-600 hover:text-blue-800 border border-blue-300 px-2 py-1 rounded"
    >
      {copied ? 'コピー済み' : 'コピー'}
    </button>
  )
}
