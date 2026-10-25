BEGIN;

INSERT INTO contract_types (name_uk, is_active) VALUES
  ('Договір поставки', true),
  ('Договір на надання послуг', true),
  ('Договір підряду', true),
  ('Договір оренди', true),
  ('Рамкова угода', true)
ON CONFLICT (name_uk) DO NOTHING;

COMMIT;
