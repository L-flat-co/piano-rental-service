-- ============================================================
-- ピアノレンタル管理システム — DB スキーマ
-- Version: 1.0
-- 実行環境: Supabase SQL Editor
-- 実行方法: 上から順に全文をコピーして実行する
-- ============================================================

-- ============================================================
-- ENUM 型定義
-- ============================================================

CREATE TYPE staff_role AS ENUM ('owner', 'staff', 'viewer');
CREATE TYPE service_type AS ENUM ('home_school', 'event');
CREATE TYPE contract_period AS ENUM ('yearly', 'half_year', 'monthly');
CREATE TYPE piano_type AS ENUM ('upright', 'grand', 'digital');
CREATE TYPE piano_status AS ENUM ('rented', 'available', 'maintenance', 'disposed');
CREATE TYPE contract_status AS ENUM ('active', 'suspended', 'terminated');
CREATE TYPE contract_origin AS ENUM ('manual', 'web');
CREATE TYPE event_status AS ENUM ('estimate', 'confirmed', 'completed', 'cancelled');
CREATE TYPE invoice_status AS ENUM ('draft', 'issued', 'paid', 'cancelled');
CREATE TYPE payment_method AS ENUM ('bank_transfer', 'cash', 'card', 'other');
CREATE TYPE document_type AS ENUM ('estimate', 'contract', 'invoice', 'receipt');
CREATE TYPE spot_fee_section AS ENUM ('initial', 'monthly');
CREATE TYPE spot_fee_entry_type AS ENUM ('master', 'custom');
CREATE TYPE customer_status AS ENUM ('active', 'suspended', 'terminated');
CREATE TYPE plan_type AS ENUM ('home', 'school');

-- ============================================================
-- スタッフ（管理者）
-- ============================================================

CREATE TABLE staff (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name            text NOT NULL,
  email           text NOT NULL,
  role            staff_role NOT NULL DEFAULT 'staff',
  is_active       boolean NOT NULL DEFAULT true,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  UNIQUE (auth_user_id),
  UNIQUE (email)
);

-- ============================================================
-- システム設定（1レコード想定）
-- ============================================================

CREATE TABLE system_settings (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name     text NOT NULL DEFAULT '株式会社エルフラット',
  postal_code      text,
  address          text,
  phone            text,
  email            text,
  website          text,
  bank_info        text,       -- 振込先情報（自由テキスト）
  tax_rate         numeric(4,2) NOT NULL DEFAULT 0.10,
  invoice_due_days integer NOT NULL DEFAULT 30,
  logo_url         text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 顧客マスタ
-- ============================================================

CREATE TABLE customers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text NOT NULL,
  name_kana    text,
  company_name text,
  email        text,
  phone        text,
  postal_code  text,
  address      text,
  status       customer_status NOT NULL DEFAULT 'active',
  memo         text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ピアノマスタ（在庫）
-- ============================================================

CREATE TABLE pianos (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  maker            text NOT NULL,
  model            text NOT NULL,
  serial_number    text,
  piano_type       piano_type NOT NULL DEFAULT 'upright',
  is_mute          boolean NOT NULL DEFAULT false,  -- 消音機能付き
  is_white         boolean NOT NULL DEFAULT false,  -- ホワイトモデル
  status           piano_status NOT NULL DEFAULT 'available',
  storage_location text,
  purchase_date    date,
  memo             text,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 料金プランマスタ（ご家庭用・教室用 × 3期間）
-- ============================================================

CREATE TABLE rental_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_type   plan_type NOT NULL,
  period      contract_period NOT NULL,
  name        text NOT NULL,
  monthly_fee integer NOT NULL,   -- 月額（税込）
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (plan_type, period)
);

-- ============================================================
-- 月額オプションマスタ
-- ============================================================

CREATE TABLE rental_options (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  monthly_fee integer NOT NULL,   -- 月額（税込）
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- スポット費用マスタ（調律・時間外等）
-- ============================================================

CREATE TABLE spot_fee_types (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  unit_price  integer NOT NULL,   -- 単価（税込）
  unit        text,               -- 例: "回", "時間"
  description text,
  is_active   boolean NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- ご家庭/教室用 契約
-- ============================================================

CREATE TABLE contracts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type    service_type NOT NULL DEFAULT 'home_school',
  customer_id     uuid NOT NULL REFERENCES customers(id),
  application_id  uuid,            -- 将来: applicationsテーブル参照
  piano_id        uuid NOT NULL REFERENCES pianos(id),
  plan_id         uuid NOT NULL REFERENCES rental_plans(id),
  contract_period contract_period NOT NULL,
  option_ids      uuid[] NOT NULL DEFAULT '{}',  -- 選択中の月額オプションID配列
  status          contract_status NOT NULL DEFAULT 'active',
  origin          contract_origin NOT NULL DEFAULT 'manual',
  start_date      date NOT NULL,
  end_date        date,
  billing_day     integer NOT NULL DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  memo            text,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- イベント用 案件
-- ============================================================

CREATE TABLE event_contracts (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id        uuid NOT NULL REFERENCES customers(id),
  piano_id           uuid REFERENCES pianos(id),
  piano_type         piano_type NOT NULL DEFAULT 'upright',
  event_name         text NOT NULL,
  venue              text,
  delivery_date      date,
  pickup_date        date,
  status             event_status NOT NULL DEFAULT 'estimate',
  cancellation_date  date,
  memo               text,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- スポット費用明細
-- （contracts / event_contracts 両方に紐づく）
-- ============================================================

CREATE TABLE contract_spot_fees (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id    uuid NOT NULL,
  contract_type  service_type NOT NULL,
  fee_type_id    uuid REFERENCES spot_fee_types(id),
  fee_type       spot_fee_entry_type NOT NULL DEFAULT 'master',
  section        spot_fee_section NOT NULL DEFAULT 'initial',
  label          text NOT NULL,
  amount         integer NOT NULL,   -- 金額（税抜）
  quantity       numeric(6,2) NOT NULL DEFAULT 1,
  is_recurring   boolean NOT NULL DEFAULT false,
  occurred_at    date,
  memo           text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 請求書
-- ============================================================

CREATE TABLE invoices (
  id                   uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number       text NOT NULL UNIQUE,   -- 例: INV-202501-001
  contract_id          uuid REFERENCES contracts(id),
  event_contract_id    uuid REFERENCES event_contracts(id),
  customer_id          uuid NOT NULL REFERENCES customers(id),
  billing_month        text,   -- 例: "2025-01"（ご家庭用月次請求）
  issue_date           date NOT NULL DEFAULT CURRENT_DATE,
  due_date             date,
  subtotal             integer NOT NULL DEFAULT 0,  -- 小計（税抜）
  tax_amount           integer NOT NULL DEFAULT 0,  -- 消費税額
  total_amount         integer NOT NULL DEFAULT 0,  -- 合計（税込）
  status               invoice_status NOT NULL DEFAULT 'draft',
  notes                text,
  created_at           timestamptz NOT NULL DEFAULT now(),
  updated_at           timestamptz NOT NULL DEFAULT now(),

  -- 契約またはイベント案件のどちらか一方に紐づく
  CONSTRAINT chk_invoice_source CHECK (
    (contract_id IS NOT NULL AND event_contract_id IS NULL) OR
    (contract_id IS NULL AND event_contract_id IS NOT NULL) OR
    (contract_id IS NULL AND event_contract_id IS NULL)  -- 手動発行の場合
  )
);

-- ============================================================
-- 請求書明細行
-- ============================================================

CREATE TABLE invoice_items (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id   uuid NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
  label        text NOT NULL,
  description  text,
  unit_price   integer NOT NULL,     -- 単価（税抜）
  quantity     numeric(6,2) NOT NULL DEFAULT 1,
  amount       integer NOT NULL,     -- 金額（税抜）= unit_price × quantity
  sort_order   integer NOT NULL DEFAULT 0,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 入金記録
-- ============================================================

CREATE TABLE payments (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id     uuid NOT NULL REFERENCES invoices(id),
  customer_id    uuid NOT NULL REFERENCES customers(id),
  payment_date   date NOT NULL,
  amount         integer NOT NULL,   -- 入金額（税込）
  payment_method payment_method NOT NULL DEFAULT 'bank_transfer',
  notes          text,
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 帳票履歴（PDF保管 + 送信履歴）
-- ============================================================

CREATE TABLE documents (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_type       document_type NOT NULL,
  document_number     text NOT NULL,
  contract_id         uuid REFERENCES contracts(id),
  event_contract_id   uuid REFERENCES event_contracts(id),
  customer_id         uuid NOT NULL REFERENCES customers(id),
  pdf_url             text,
  sent_at             timestamptz,
  sent_to             text,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- インデックス
-- ============================================================

CREATE INDEX idx_contracts_customer ON contracts(customer_id);
CREATE INDEX idx_contracts_status ON contracts(status);
CREATE INDEX idx_contracts_piano ON contracts(piano_id);
CREATE INDEX idx_event_contracts_customer ON event_contracts(customer_id);
CREATE INDEX idx_event_contracts_status ON event_contracts(status);
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_billing_month ON invoices(billing_month);
CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_contract_spot_fees_contract ON contract_spot_fees(contract_id, contract_type);
CREATE INDEX idx_documents_customer ON documents(customer_id);

-- ============================================================
-- updated_at 自動更新トリガー
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_staff_updated_at
  BEFORE UPDATE ON staff FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_system_settings_updated_at
  BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_customers_updated_at
  BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_pianos_updated_at
  BEFORE UPDATE ON pianos FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_rental_plans_updated_at
  BEFORE UPDATE ON rental_plans FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_rental_options_updated_at
  BEFORE UPDATE ON rental_options FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_spot_fee_types_updated_at
  BEFORE UPDATE ON spot_fee_types FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_event_contracts_updated_at
  BEFORE UPDATE ON event_contracts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_invoices_updated_at
  BEFORE UPDATE ON invoices FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Row Level Security (RLS)
-- ============================================================

ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE pianos ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE spot_fee_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_spot_fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

-- スタッフロール取得ヘルパー関数
CREATE OR REPLACE FUNCTION get_staff_role(uid uuid)
RETURNS staff_role AS $$
  SELECT role FROM staff WHERE auth_user_id = uid AND is_active = true LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ◆ staff テーブル（ownerのみ全操作、自分自身は参照可）
CREATE POLICY "staff: owner full access"
  ON staff FOR ALL
  USING (get_staff_role(auth.uid()) = 'owner');

CREATE POLICY "staff: self read"
  ON staff FOR SELECT
  USING (auth_user_id = auth.uid());

-- ◆ system_settings（ownerのみ変更、staff/viewerは参照）
CREATE POLICY "system_settings: owner write"
  ON system_settings FOR ALL
  USING (get_staff_role(auth.uid()) = 'owner');

CREATE POLICY "system_settings: staff/viewer read"
  ON system_settings FOR SELECT
  USING (get_staff_role(auth.uid()) IN ('staff', 'viewer'));

-- ◆ 汎用ポリシー（owner/staffは読み書き、viewerは参照のみ）
-- customers
CREATE POLICY "customers: owner/staff write"
  ON customers FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "customers: viewer read"
  ON customers FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- pianos
CREATE POLICY "pianos: owner/staff write"
  ON pianos FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "pianos: viewer read"
  ON pianos FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- rental_plans
CREATE POLICY "rental_plans: owner write"
  ON rental_plans FOR ALL
  USING (get_staff_role(auth.uid()) = 'owner');
CREATE POLICY "rental_plans: staff/viewer read"
  ON rental_plans FOR SELECT
  USING (get_staff_role(auth.uid()) IN ('staff', 'viewer'));

-- rental_options
CREATE POLICY "rental_options: owner write"
  ON rental_options FOR ALL
  USING (get_staff_role(auth.uid()) = 'owner');
CREATE POLICY "rental_options: staff/viewer read"
  ON rental_options FOR SELECT
  USING (get_staff_role(auth.uid()) IN ('staff', 'viewer'));

-- spot_fee_types
CREATE POLICY "spot_fee_types: owner write"
  ON spot_fee_types FOR ALL
  USING (get_staff_role(auth.uid()) = 'owner');
CREATE POLICY "spot_fee_types: staff/viewer read"
  ON spot_fee_types FOR SELECT
  USING (get_staff_role(auth.uid()) IN ('staff', 'viewer'));

-- contracts
CREATE POLICY "contracts: owner/staff write"
  ON contracts FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "contracts: viewer read"
  ON contracts FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- event_contracts
CREATE POLICY "event_contracts: owner/staff write"
  ON event_contracts FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "event_contracts: viewer read"
  ON event_contracts FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- contract_spot_fees
CREATE POLICY "contract_spot_fees: owner/staff write"
  ON contract_spot_fees FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "contract_spot_fees: viewer read"
  ON contract_spot_fees FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- invoices
CREATE POLICY "invoices: owner/staff write"
  ON invoices FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "invoices: viewer read"
  ON invoices FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- invoice_items
CREATE POLICY "invoice_items: owner/staff write"
  ON invoice_items FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "invoice_items: viewer read"
  ON invoice_items FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- payments
CREATE POLICY "payments: owner/staff write"
  ON payments FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "payments: viewer read"
  ON payments FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');

-- documents
CREATE POLICY "documents: owner/staff write"
  ON documents FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));
CREATE POLICY "documents: viewer read"
  ON documents FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');
