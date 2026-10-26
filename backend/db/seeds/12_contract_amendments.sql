-- Додаткові угоди лише для РПЗ зі статусом contract_signed / completed.
-- 1 або 2 записи на пункт, прив’язані до основного договору (не до другої ДД-«додаткової угоди»).
-- Пункти planned / in_preparation не отримують записів.

BEGIN;

DELETE FROM contract_amendments;

INSERT INTO contract_amendments (contract_id, amended_at, description, created_by)
SELECT
  main.contract_id,
  (main.contract_date + (n.amendment_no * INTERVAL '45 days'))::date,
  CASE n.amendment_no
    WHEN 1 THEN
      CASE main.line_number % 4
        WHEN 0 THEN format('Додаткова угода №1: збільшення суми договору щодо «%s»', main.subject)
        WHEN 1 THEN format('Додаткова угода №1: продовження строку дії договору щодо «%s»', main.subject)
        WHEN 2 THEN format('Додаткова угода №1: уточнення специфікації та графіка виконання щодо «%s»', main.subject)
        ELSE format('Додаткова угода №1: зміна обсягу та умов оплати щодо «%s»', main.subject)
      END
    ELSE
      CASE main.line_number % 4
        WHEN 0 THEN format('Додаткова угода №2: коригування ціни щодо «%s»', main.subject)
        WHEN 1 THEN format('Додаткова угода №2: зміна графіка постачання щодо «%s»', main.subject)
        WHEN 2 THEN format('Додаткова угода №2: уточнення переліку робіт щодо «%s»', main.subject)
        ELSE format('Додаткова угода №2: погодження додаткового обсягу щодо «%s»', main.subject)
      END
  END,
  '22222222-2222-2222-2222-222222222203'::uuid
FROM (
  SELECT DISTINCT ON (p.id)
    p.id AS plan_item_id,
    p.plan_year,
    p.line_number,
    p.subject,
    cd.id AS contract_id,
    cd.contract_date
  FROM procurement_plan_items p
  JOIN contract_documents cd ON cd.plan_item_id = p.id
  WHERE p.status IN ('contract_signed', 'completed')
    AND cd.subject NOT LIKE '%(додаткова угода)%'
  ORDER BY p.id, cd.seq_number
) AS main
CROSS JOIN LATERAL generate_series(
  1,
  CASE WHEN (main.plan_year + main.line_number) % 3 = 0 THEN 2 ELSE 1 END
) AS n(amendment_no);

COMMIT;
