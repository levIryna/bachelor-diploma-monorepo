-- Short department ids: 1..5 instead of UUIDs.
-- Safe to run only while departments.id is still uuid.

BEGIN;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_department_id_fkey;
ALTER TABLE procurement_plan_items DROP CONSTRAINT IF EXISTS procurement_plan_items_department_id_fkey;
ALTER TABLE contract_documents DROP CONSTRAINT IF EXISTS contract_documents_initiator_department_id_fkey;

ALTER TABLE departments ADD COLUMN id_new smallint;
UPDATE departments
SET id_new = CASE id::text
  WHEN '11111111-1111-1111-1111-111111111001' THEN 1
  WHEN '11111111-1111-1111-1111-111111111002' THEN 2
  WHEN '11111111-1111-1111-1111-111111111003' THEN 3
  WHEN '11111111-1111-1111-1111-111111111004' THEN 4
  WHEN '11111111-1111-1111-1111-111111111005' THEN 5
END;
ALTER TABLE departments ALTER COLUMN id_new SET NOT NULL;

ALTER TABLE users ADD COLUMN department_id_new smallint;
UPDATE users AS account
SET department_id_new = departments.id_new
FROM departments
WHERE account.department_id = departments.id;

ALTER TABLE procurement_plan_items ADD COLUMN department_id_new smallint;
UPDATE procurement_plan_items AS item
SET department_id_new = departments.id_new
FROM departments
WHERE item.department_id = departments.id;

ALTER TABLE contract_documents ADD COLUMN initiator_department_id_new smallint;
UPDATE contract_documents AS document
SET initiator_department_id_new = departments.id_new
FROM departments
WHERE document.initiator_department_id = departments.id;

ALTER TABLE users DROP COLUMN department_id;
ALTER TABLE users RENAME COLUMN department_id_new TO department_id;

ALTER TABLE procurement_plan_items DROP COLUMN department_id;
ALTER TABLE procurement_plan_items RENAME COLUMN department_id_new TO department_id;
ALTER TABLE procurement_plan_items ALTER COLUMN department_id SET NOT NULL;

ALTER TABLE contract_documents DROP COLUMN initiator_department_id;
ALTER TABLE contract_documents RENAME COLUMN initiator_department_id_new TO initiator_department_id;
ALTER TABLE contract_documents ALTER COLUMN initiator_department_id SET NOT NULL;

ALTER TABLE departments DROP CONSTRAINT departments_pkey;
ALTER TABLE departments DROP COLUMN id;
ALTER TABLE departments RENAME COLUMN id_new TO id;
ALTER TABLE departments ADD PRIMARY KEY (id);

ALTER TABLE users
  ADD CONSTRAINT users_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT;

ALTER TABLE procurement_plan_items
  ADD CONSTRAINT procurement_plan_items_department_id_fkey
  FOREIGN KEY (department_id) REFERENCES departments (id) ON DELETE RESTRICT;

ALTER TABLE contract_documents
  ADD CONSTRAINT contract_documents_initiator_department_id_fkey
  FOREIGN KEY (initiator_department_id) REFERENCES departments (id) ON DELETE RESTRICT;

CREATE INDEX users_department_id_idx ON users (department_id);
CREATE INDEX procurement_plan_items_department_id_plan_year_idx
  ON procurement_plan_items (department_id, plan_year);

COMMIT;
