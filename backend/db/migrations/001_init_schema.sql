-- Procurement IS schema (from procurement-is-schema.dbml)
-- PostgreSQL 16+

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ========== Enums ==========

CREATE TYPE procurement_status_enum AS ENUM (
  'planned',
  'in_preparation',
  'procedure',
  'awaiting_contract',
  'contract_signed',
  'completed'
);

CREATE TYPE need_type_enum AS ENUM (
  'annual',
  'one_time'
);

CREATE TYPE item_type_enum AS ENUM (
  'work',
  'service',
  'goods'
);

-- ========== Organization & access ==========

CREATE TABLE departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(255) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email varchar(255) NOT NULL UNIQUE,
  password_hash varchar(255) NOT NULL,
  full_name varchar(255) NOT NULL,
  role varchar(20) NOT NULL,
  department_id uuid REFERENCES departments (id) ON DELETE RESTRICT,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'department_head', 'buyer'))
);

CREATE INDEX users_department_id_idx ON users (department_id);

-- ========== Dictionaries ==========

CREATE TABLE procurement_kinds (
  id serial PRIMARY KEY,
  name_uk varchar(255) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE funding_sources (
  id serial PRIMARY KEY,
  name_uk varchar(255) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE ip_nkrekp_items (
  id serial PRIMARY KEY,
  title varchar(512) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE procurement_categories (
  id serial PRIMARY KEY,
  name_uk varchar(255) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE procurement_procedures (
  id smallserial PRIMARY KEY,
  name_uk varchar(128) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE contract_types (
  id serial PRIMARY KEY,
  name_uk varchar(128) NOT NULL UNIQUE,
  is_active boolean NOT NULL DEFAULT true
);

CREATE TABLE contractors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name varchar(512) NOT NULL,
  edrpou varchar(10),
  is_active boolean NOT NULL DEFAULT true
);

-- ========== RPZ (procurement plan) ==========

CREATE TABLE procurement_plan_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_year smallint NOT NULL,
  line_number int NOT NULL,
  department_id uuid NOT NULL REFERENCES departments (id) ON DELETE RESTRICT,
  initiator_head_name varchar(255),
  executor_name varchar(255),
  subject text NOT NULL,
  need_type need_type_enum NOT NULL,
  procurement_kind_id int REFERENCES procurement_kinds (id) ON DELETE RESTRICT,
  funding_source_id int REFERENCES funding_sources (id) ON DELETE RESTRICT,
  ip_nkrekp_item_id int REFERENCES ip_nkrekp_items (id) ON DELETE RESTRICT,
  event_name varchar(512),
  category_id int REFERENCES procurement_categories (id) ON DELETE RESTRICT,
  expected_cost_thousands numeric(14, 3) NOT NULL,
  prev_contract_end_date date,
  prev_contractor_id uuid REFERENCES contractors (id) ON DELETE RESTRICT,
  planned_contract_date date,
  planned_tz_submit_date date,
  planned_work_start_date date,
  responsible_buyer_id uuid REFERENCES users (id) ON DELETE RESTRICT,
  status procurement_status_enum NOT NULL DEFAULT 'planned',
  created_by uuid REFERENCES users (id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT procurement_plan_items_plan_year_line_number_key UNIQUE (plan_year, line_number)
);

CREATE INDEX procurement_plan_items_plan_year_status_idx ON procurement_plan_items (plan_year, status);
CREATE INDEX procurement_plan_items_department_id_plan_year_idx ON procurement_plan_items (department_id, plan_year);

-- ========== DD (contract documents) ==========

CREATE TABLE contract_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seq_number int,
  plan_item_id uuid NOT NULL REFERENCES procurement_plan_items (id) ON DELETE RESTRICT,
  subject text NOT NULL,
  item_type item_type_enum NOT NULL,
  expected_cost_application_thousands numeric(14, 3),
  procedure_id smallint NOT NULL REFERENCES procurement_procedures (id) ON DELETE RESTRICT,
  initiator_department_id uuid NOT NULL REFERENCES departments (id) ON DELETE RESTRICT,
  tz_responsible_name varchar(255),
  technical_expert_name varchar(255),
  estimator_name varchar(255),
  buyer_name varchar(255),
  actual_application_date date,
  procedure_number varchar(64),
  etm_url varchar(1024),
  contractor_id uuid REFERENCES contractors (id) ON DELETE RESTRICT,
  contract_subject text,
  contract_amount_uah numeric(16, 2),
  contract_date date,
  contract_type_id int REFERENCES contract_types (id) ON DELETE RESTRICT,
  valid_from date,
  valid_to date,
  notes text,
  created_by uuid REFERENCES users (id) ON DELETE RESTRICT,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX contract_documents_plan_item_id_idx ON contract_documents (plan_item_id);
CREATE INDEX contract_documents_procedure_id_idx ON contract_documents (procedure_id);
CREATE INDEX contract_documents_contract_date_idx ON contract_documents (contract_date);

CREATE TABLE contract_amendments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES contract_documents (id) ON DELETE RESTRICT,
  amended_at date NOT NULL,
  description text NOT NULL,
  created_by uuid REFERENCES users (id) ON DELETE RESTRICT
);

CREATE INDEX contract_amendments_contract_id_idx ON contract_amendments (contract_id);

COMMIT;
