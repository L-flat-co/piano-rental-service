-- ============================================================
-- 弦楽器拡張 + 口座振替管理 + 顧客所属
-- ※ add_string_instruments.sql の後に実行すること
-- ============================================================

-- ============================================================
-- payment_method に代引を追加
-- ============================================================

ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'cod';

-- ============================================================
-- 顧客テーブルに所属を追加
-- ============================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS affiliation text;
-- 値: 'lf'(教室生徒), 'external'(提携機関), 'general'(一般), NULL(未設定/ピアノ顧客)

-- ============================================================
-- string_contracts に列追加
-- ============================================================

ALTER TABLE string_contracts ADD COLUMN IF NOT EXISTS application_date date;           -- 申込日
ALTER TABLE string_contracts ADD COLUMN IF NOT EXISTS rule_type text DEFAULT 'A';       -- 区分（O:旧規約 / A:新規約）
ALTER TABLE string_contracts ADD COLUMN IF NOT EXISTS cancellation_request_date date;   -- 解約申込日
ALTER TABLE string_contracts ADD COLUMN IF NOT EXISTS earliest_cancellation_date date;  -- 最短解約日
ALTER TABLE string_contracts ADD COLUMN IF NOT EXISTS return_date date;                 -- 返却日
ALTER TABLE string_contracts ADD COLUMN IF NOT EXISTS has_insurance boolean NOT NULL DEFAULT false;  -- あんしんプラン加入
ALTER TABLE string_contracts ADD COLUMN IF NOT EXISTS shipping_fee integer DEFAULT 0;   -- 送料/代引手数料（税込）
ALTER TABLE string_contracts ADD COLUMN IF NOT EXISTS delivery_method text;             -- 納品方法（宅配便/ご来店/自社配送）

-- ============================================================
-- 口座振替管理テーブル（ピアノ・弦楽器共通）
-- ============================================================

CREATE TYPE direct_debit_status AS ENUM ('pending', 'active', 'rejected', 'cancelled');

CREATE TABLE direct_debits (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id           uuid NOT NULL,
  contract_type         service_type NOT NULL,              -- 'home_school'(ピアノ) / 'event' は使わない想定だが拡張用
  customer_id           uuid NOT NULL REFERENCES customers(id),
  status                direct_debit_status NOT NULL DEFAULT 'pending',
  initial_debit_date    date,                               -- 初回引落日
  last_debit_date       date,                               -- 最終引落日（計算上）
  debit_count           integer DEFAULT 0,                  -- 引落回数
  bank_name             text,                               -- 引落先銀行名
  rejection_memo        text,                               -- 差し戻し理由
  memo                  text,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_direct_debits_contract ON direct_debits(contract_id, contract_type);
CREATE INDEX idx_direct_debits_customer ON direct_debits(customer_id);
CREATE INDEX idx_direct_debits_status ON direct_debits(status);

CREATE TRIGGER trg_direct_debits_updated_at
  BEFORE UPDATE ON direct_debits FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE direct_debits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "direct_debits: owner/staff write"
  ON direct_debits FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));

CREATE POLICY "direct_debits: viewer read"
  ON direct_debits FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');
