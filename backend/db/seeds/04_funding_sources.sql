BEGIN;

INSERT INTO funding_sources (name_uk, is_active) VALUES
  ('Операційний бюджет', true),
  ('Спеціальний фонд', true)
ON CONFLICT (name_uk) DO NOTHING;

COMMIT;
