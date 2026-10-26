-- РПЗ має лише чотири статуси. procedure та awaiting_contract більше не використовуються.

BEGIN;

UPDATE procurement_plan_items
SET status = 'in_preparation',
    updated_at = now()
WHERE status::text IN ('procedure', 'awaiting_contract');

CREATE TYPE procurement_status_enum_new AS ENUM (
  'planned',
  'in_preparation',
  'contract_signed',
  'completed'
);

ALTER TABLE procurement_plan_items
  ALTER COLUMN status DROP DEFAULT;

ALTER TABLE procurement_plan_items
  ALTER COLUMN status TYPE procurement_status_enum_new
  USING status::text::procurement_status_enum_new;

ALTER TABLE procurement_plan_items
  ALTER COLUMN status SET DEFAULT 'planned';

DROP TYPE procurement_status_enum;

ALTER TYPE procurement_status_enum_new RENAME TO procurement_status_enum;

COMMIT;
