import { type ClassValue, clsx } from 'clsx'

/**
 * 金額を日本円フォーマットで表示する
 * 例: 5500 → "¥5,500"
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
  }).format(amount)
}

/**
 * 日付を日本語フォーマットで表示する
 * 例: "2025-01-15" → "2025年1月15日"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return new Intl.DateTimeFormat('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

/**
 * 年月を日本語フォーマットで表示する
 * 例: "2025-01" → "2025年1月"
 */
export function formatYearMonth(yearMonth: string): string {
  const [year, month] = yearMonth.split('-')
  return `${year}年${parseInt(month)}月`
}

/**
 * 消費税額を計算する（税込金額から）
 */
export function calcTax(amountWithTax: number, taxRate = 0.1): number {
  return Math.round(amountWithTax * taxRate / (1 + taxRate))
}

/**
 * 税込金額を計算する
 */
export function calcAmountWithTax(amountExTax: number, taxRate = 0.1): number {
  return Math.round(amountExTax * (1 + taxRate))
}

/**
 * クラス名を結合する（Tailwind CSS 用）
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
