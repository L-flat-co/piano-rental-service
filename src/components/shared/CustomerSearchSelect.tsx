'use client'

import { useState, useRef, useEffect } from 'react'
import { Customer } from '@/types'

interface Props {
  customers: Customer[]
  value: string
  onChange: (customerId: string) => void
  required?: boolean
}

export function CustomerSearchSelect({ customers, value, onChange, required }: Props) {
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)

  const selected = customers.find((c) => c.id === value)

  const filtered = search
    ? customers.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.name.toLowerCase().includes(q) ||
          c.name_kana?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.includes(q) ||
          c.company_name?.toLowerCase().includes(q)
        )
      })
    : customers

  // 外側クリックで閉じる
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleSelect(id: string) {
    onChange(id)
    setSearch('')
    setOpen(false)
  }

  function handleClear() {
    onChange('')
    setSearch('')
  }

  return (
    <div ref={wrapperRef} className="relative">
      {/* 選択済み表示 or 検索入力 */}
      {selected && !open ? (
        <div
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white flex items-center justify-between cursor-pointer hover:border-gray-400"
          onClick={() => setOpen(true)}
        >
          <div>
            <span className="text-gray-900">{selected.name}</span>
            {selected.company_name && (
              <span className="text-gray-400 ml-1 text-xs">({selected.company_name})</span>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); handleClear() }}
            className="text-gray-400 hover:text-gray-600 text-xs ml-2"
          >
            ✕
          </button>
        </div>
      ) : (
        <input
          type="text"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="顧客を検索..."
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      )}

      {/* hidden input for form validation */}
      {required && (
        <input type="hidden" value={value} required />
      )}

      {/* ドロップダウン */}
      {open && (
        <div className="absolute z-20 top-full mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-400 text-center">
              {search ? '該当する顧客がありません' : '顧客が登録されていません'}
            </div>
          ) : (
            filtered.slice(0, 50).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleSelect(c.id)}
                className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors ${
                  c.id === value ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-medium">{c.name}</span>
                    {c.name_kana && (
                      <span className="text-gray-400 text-xs ml-1">{c.name_kana}</span>
                    )}
                    {c.company_name && (
                      <span className="text-gray-400 text-xs ml-1">({c.company_name})</span>
                    )}
                  </div>
                  <span className="text-gray-400 text-xs">{c.phone || c.email || ''}</span>
                </div>
              </button>
            ))
          )}
          {filtered.length > 50 && (
            <div className="px-3 py-2 text-xs text-gray-400 text-center border-t">
              他 {filtered.length - 50}件 — 検索で絞り込んでください
            </div>
          )}
        </div>
      )}
    </div>
  )
}
