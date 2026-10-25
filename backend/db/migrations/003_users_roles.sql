-- Roles: admin, department_head, buyer (only these three)

BEGIN;

UPDATE users SET role = 'department_head' WHERE role = 'manager';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('admin', 'department_head', 'buyer'));

COMMIT;
