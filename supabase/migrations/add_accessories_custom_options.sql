-- ============================================================
-- contracts テーブルに accessories / custom_options カラムを追加
-- ============================================================

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS accessories text[] NOT NULL DEFAULT '{"ピアノ椅子","インシュレーター"}';

ALTER TABLE contracts
  ADD COLUMN IF NOT EXISTS custom_options jsonb NOT NULL DEFAULT '[]';
