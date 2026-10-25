BEGIN;

INSERT INTO procurement_kinds (name_uk, is_active) VALUES
  ('Товари', true),
  ('Послуги', true)
ON CONFLICT (name_uk) DO NOTHING;

COMMIT;
