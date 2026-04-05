-- ============================================================
-- 弦楽器レンタル管理 — テーブル追加
-- ============================================================

-- ENUM 型
CREATE TYPE string_type AS ENUM ('violin', 'viola', 'cello');
CREATE TYPE string_size AS ENUM ('4/4', '7/8', '3/4', '1/2', '1/4', '1/8', '1/10', '1/16', '1/32');
CREATE TYPE string_rental_type AS ENUM ('subscription', 'spot');
CREATE TYPE string_size_category AS ENUM ('fractional', 'full');

-- ============================================================
-- 顧客テーブルに product_categories を追加
-- ============================================================

ALTER TABLE customers ADD COLUMN IF NOT EXISTS product_categories text[] NOT NULL DEFAULT '{}';

-- 既存顧客を全て piano に初期化
UPDATE customers SET product_categories = ARRAY['piano'] WHERE product_categories = '{}';

-- ============================================================
-- 弦楽器 在庫
-- ============================================================

CREATE TABLE string_instruments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maker             text NOT NULL,
  model             text NOT NULL,
  serial_number     text,
  string_type       string_type NOT NULL,
  size              string_size NOT NULL DEFAULT '4/4',
  status            piano_status NOT NULL DEFAULT 'available',
  accessories       text[] NOT NULL DEFAULT '{}',
  storage_location  text,
  purchase_date     date,
  memo              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_string_instruments_status ON string_instruments(status);
CREATE INDEX idx_string_instruments_type ON string_instruments(string_type);

CREATE TRIGGER trg_string_instruments_updated_at
  BEFORE UPDATE ON string_instruments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 弦楽器 料金プラン
-- ============================================================

CREATE TABLE string_rental_plans (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  string_type       string_type NOT NULL,
  size_category     string_size_category NOT NULL,
  rental_type       string_rental_type NOT NULL,
  period            text NOT NULL,
  price             integer NOT NULL,
  name              text NOT NULL,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (string_type, size_category, rental_type, period)
);

CREATE TRIGGER trg_string_rental_plans_updated_at
  BEFORE UPDATE ON string_rental_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 弦楽器 契約
-- ============================================================

CREATE TABLE string_contracts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id       uuid NOT NULL REFERENCES customers(id),
  instrument_id     uuid NOT NULL REFERENCES string_instruments(id),
  plan_id           uuid NOT NULL REFERENCES string_rental_plans(id),
  rental_type       string_rental_type NOT NULL,
  status            contract_status NOT NULL DEFAULT 'active',
  start_date        date NOT NULL,
  end_date          date,
  billing_day       integer CHECK (billing_day BETWEEN 1 AND 28),
  monthly_fee       integer NOT NULL,
  payment_method    payment_method NOT NULL DEFAULT 'bank_transfer',
  memo              text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_string_contracts_customer ON string_contracts(customer_id);
CREATE INDEX idx_string_contracts_status ON string_contracts(status);
CREATE INDEX idx_string_contracts_instrument ON string_contracts(instrument_id);

CREATE TRIGGER trg_string_contracts_updated_at
  BEFORE UPDATE ON string_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- サイズアップ履歴
-- ============================================================

CREATE TABLE string_contract_size_ups (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id         uuid NOT NULL REFERENCES string_contracts(id) ON DELETE CASCADE,
  old_instrument_id   uuid NOT NULL REFERENCES string_instruments(id),
  new_instrument_id   uuid NOT NULL REFERENCES string_instruments(id),
  old_size            string_size NOT NULL,
  new_size            string_size NOT NULL,
  changed_at          date NOT NULL,
  memo                text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_string_size_ups_contract ON string_contract_size_ups(contract_id);

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE string_instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE string_rental_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE string_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE string_contract_size_ups ENABLE ROW LEVEL SECURITY;

-- string_instruments
CREATE POLICY "string_instruments: owner/staff write"
  ON string_instruments FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "string_instruments: viewer read"
  ON string_instruments FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- string_rental_plans
CREATE POLICY "string_rental_plans: owner write"
  ON string_rental_plans FOR ALL
  USING (get_staff_role(auth.uid()) = 'owner');
CREATE POLICY "string_rental_plans: staff/viewer read"
  ON string_rental_plans FOR SELECT
  USING (get_staff_role(auth.uid()) IN ('staff', 'viewer'));

-- string_contracts
CREATE POLICY "string_contracts: owner/staff write"
  ON string_contracts FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "string_contracts: viewer read"
  ON string_contracts FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- string_contract_size_ups
CREATE POLICY "string_contract_size_ups: owner/staff write"
  ON string_contract_size_ups FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "string_contract_size_ups: viewer read"
  ON string_contract_size_ups FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- ============================================================
-- 初期料金データ（seed）
-- ============================================================

-- スポット（短期）
INSERT INTO string_rental_plans (string_type, size_category, rental_type, period, price, name) VALUES
  -- バイオリン（サイズ区分なし → fractional で統一）
  ('violin', 'fractional', 'spot', '30', 6600, 'バイオリン スポット30日'),
  ('violin', 'fractional', 'spot', '60', 9900, 'バイオリン スポット60日'),
  ('violin', 'fractional', 'spot', '90', 13200, 'バイオリン スポット90日'),
  -- ビオラ
  ('viola', 'fractional', 'spot', '30', 11550, 'ビオラ スポット30日'),
  ('viola', 'fractional', 'spot', '60', 13200, 'ビオラ スポット60日'),
  ('viola', 'fractional', 'spot', '90', 14850, 'ビオラ スポット90日'),
  -- チェロ 分数
  ('cello', 'fractional', 'spot', '30', 13200, 'チェロ（分数）スポット30日'),
  ('cello', 'fractional', 'spot', '60', 22000, 'チェロ（分数）スポット60日'),
  ('cello', 'fractional', 'spot', '90', 26400, 'チェロ（分数）スポット90日'),
  -- チェロ 4/4
  ('cello', 'full', 'spot', '30', 16500, 'チェロ（4/4）スポット30日'),
  ('cello', 'full', 'spot', '60', 27500, 'チェロ（4/4）スポット60日'),
  ('cello', 'full', 'spot', '90', 33000, 'チェロ（4/4）スポット90日');

-- サブスクリプション（長期・月額）
INSERT INTO string_rental_plans (string_type, size_category, rental_type, period, price, name) VALUES
  -- バイオリン
  ('violin', 'fractional', 'subscription', 'monthly', 2750, 'バイオリン 定額（毎月）'),
  ('violin', 'fractional', 'subscription', 'half_year', 2530, 'バイオリン 定額（半年払い）'),
  ('violin', 'fractional', 'subscription', 'yearly', 2200, 'バイオリン 定額（年払い）'),
  -- ビオラ
  ('viola', 'fractional', 'subscription', 'monthly', 3850, 'ビオラ 定額（毎月）'),
  ('viola', 'fractional', 'subscription', 'half_year', 3520, 'ビオラ 定額（半年払い）'),
  ('viola', 'fractional', 'subscription', 'yearly', 3080, 'ビオラ 定額（年払い）'),
  -- チェロ 分数
  ('cello', 'fractional', 'subscription', 'monthly', 4400, 'チェロ（分数）定額（毎月）'),
  ('cello', 'fractional', 'subscription', 'half_year', 3960, 'チェロ（分数）定額（半年払い）'),
  ('cello', 'fractional', 'subscription', 'yearly', 3520, 'チェロ（分数）定額（年払い）'),
  -- チェロ 4/4
  ('cello', 'full', 'subscription', 'monthly', 5500, 'チェロ（4/4）定額（毎月）'),
  ('cello', 'full', 'subscription', 'half_year', 4950, 'チェロ（4/4）定額（半年払い）'),
  ('cello', 'full', 'subscription', 'yearly', 4400, 'チェロ（4/4）定額（年払い）');
