-- Підрозділи-ініціатори (довідник departments)
-- Назви узгоджені з моком списку РПЗ (rpzList).

BEGIN;

INSERT INTO departments (id, name, is_active) VALUES
  (1, 'Відділ закупівель', true),
  (2, 'Фінансовий відділ', true),
  (3, 'Юридичний відділ', true),
  (4, 'ІТ-підрозділ', true),
  (5, 'Відділ кадрів', true)
ON CONFLICT (name) DO NOTHING;

COMMIT;
