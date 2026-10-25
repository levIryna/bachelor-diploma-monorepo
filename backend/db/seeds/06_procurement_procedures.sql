-- Вид процедури закупівлі (людські назви для UI)

BEGIN;

DELETE FROM procurement_procedures
WHERE name_uk NOT IN (
  'Відкриті торги',
  'Відкриті торги з особливостями',
  'Спрощена закупівля',
  'Переговорна процедура'
);

INSERT INTO procurement_procedures (name_uk, is_active) VALUES
  ('Відкриті торги', true),
  ('Відкриті торги з особливостями', true),
  ('Спрощена закупівля', true),
  ('Переговорна процедура', true)
ON CONFLICT (name_uk) DO UPDATE SET is_active = true;

COMMIT;
