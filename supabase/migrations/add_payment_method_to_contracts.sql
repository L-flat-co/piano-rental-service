-- ============================================================
-- contracts テーブルに payment_method カラムを追加
-- ============================================================

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS payment_method payment_method NOT NULL DEFAULT 'bank_transfer';
