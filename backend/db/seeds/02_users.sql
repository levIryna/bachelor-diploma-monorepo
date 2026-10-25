-- Three users (dev). Password for all: password
-- bcrypt: $2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

BEGIN;

INSERT INTO users (id, email, password_hash, full_name, role, department_id, is_active) VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    'admin@example.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Іванов Іван Іванович',
    'admin',
    NULL,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'head@example.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Коваленко Олег Сергійович',
    'department_head',
    '11111111-1111-1111-1111-111111111001',
    true
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'buyer@example.com',
    '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'Шевченко Єва Андріївна',
    'buyer',
    NULL,
    true
  )
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department_id = EXCLUDED.department_id,
  is_active = EXCLUDED.is_active;

COMMIT;
