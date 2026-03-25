-- ============================================================
-- Phase 4: Web申込フロー — applications テーブル追加
-- ============================================================

CREATE TYPE application_status AS ENUM ('submitted', 'reviewing', 'approved', 'rejected', 'converted');

CREATE TABLE applications (
  id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- 申込者情報
  applicant_name          text NOT NULL,
  applicant_kana          text,
  applicant_email         text NOT NULL,
  applicant_phone         text,
  applicant_postal_code   text,
  applicant_address       text,
  company_name            text,
  -- レンタル希望
  plan_type               plan_type NOT NULL DEFAULT 'home',
  contract_period         contract_period NOT NULL DEFAULT 'monthly',
  piano_type              piano_type NOT NULL DEFAULT 'upright',
  preferred_start_date    date,
  option_ids              uuid[] NOT NULL DEFAULT '{}',
  -- 設置場所
  installation_address    text,
  installation_floor      text,
  installation_elevator   boolean DEFAULT false,
  -- ステータス・管理
  status                  application_status NOT NULL DEFAULT 'submitted',
  admin_memo              text,
  customer_id             uuid REFERENCES customers(id),
  contract_id             uuid REFERENCES contracts(id),
  created_at              timestamptz NOT NULL DEFAULT now(),
  updated_at              timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_email ON applications(applicant_email);

CREATE TRIGGER trg_applications_updated_at
  BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- 公開INSERT（未認証でも申込可能）
CREATE POLICY "applications: public insert"
  ON applications FOR INSERT
  WITH CHECK (true);

-- 管理者は全操作可
CREATE POLICY "applications: owner/staff write"
  ON applications FOR ALL
  USING (get_staff_role(auth.uid()) IN ('owner', 'staff'));

-- 閲覧者は読み取りのみ
CREATE POLICY "applications: viewer read"
  ON applications FOR SELECT
  USING (get_staff_role(auth.uid()) = 'viewer');
