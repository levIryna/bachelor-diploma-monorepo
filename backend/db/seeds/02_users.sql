-- Three users (dev). Password for all: password
-- bcrypt: $2b$10$Yk5cIKw/cllSbnXFVdvy9eXE6tKjxRquEW39JQ.OGlxSVoGVEUFn2

BEGIN;

INSERT INTO users (id, email, password_hash, full_name, role, department_id, is_active) VALUES
  (
    '22222222-2222-2222-2222-222222222201',
    'admin@example.com',
    '$2b$10$Yk5cIKw/cllSbnXFVdvy9eXE6tKjxRquEW39JQ.OGlxSVoGVEUFn2',
    'Іванов Іван Іванович',
    'admin',
    NULL,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222202',
    'head@example.com',
    '$2b$10$Yk5cIKw/cllSbnXFVdvy9eXE6tKjxRquEW39JQ.OGlxSVoGVEUFn2',
    'Коваленко Олег Сергійович',
    'department_head',
    1,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'buyer@example.com',
    '$2b$10$Yk5cIKw/cllSbnXFVdvy9eXE6tKjxRquEW39JQ.OGlxSVoGVEUFn2',
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
