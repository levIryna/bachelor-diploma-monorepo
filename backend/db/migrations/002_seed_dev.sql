-- Dev-only sample data. Do not use default passwords in production.
-- Test login after seed: admin@example.com / password

BEGIN;

INSERT INTO departments (id, name, is_active) VALUES
  ('11111111-1111-1111-1111-111111111101', 'ІТ-підрозділ', true),
  ('11111111-1111-1111-1111-111111111102', 'Юридичний відділ', true);

INSERT INTO procurement_kinds (name_uk) VALUES
  ('Товари'),
  ('Послуги'),
  ('Роботи');

INSERT INTO funding_sources (name_uk) VALUES
  ('Кошти підприємства'),
  ('Державний бюджет');

INSERT INTO procurement_categories (name_uk) VALUES
  ('Категорія A'),
  ('Категорія B');

INSERT INTO procurement_procedures (name_uk) VALUES
  ('ВТЗ'),
  ('ДУ'),
  ('Прямий ДД');

INSERT INTO contract_types (name_uk) VALUES
  ('Договір поставки'),
  ('Договір на послуги');

INSERT INTO ip_nkrekp_items (title) VALUES
  ('Пункт ІП (приклад 1)');

-- bcrypt hash for plaintext: password
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
    'buyer@example.com',
    '$2b$10$Yk5cIKw/cllSbnXFVdvy9eXE6tKjxRquEW39JQ.OGlxSVoGVEUFn2',
    'Шевченко Єва Андріївна',
    'buyer',
    NULL,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222203',
    'head@example.com',
    '$2b$10$Yk5cIKw/cllSbnXFVdvy9eXE6tKjxRquEW39JQ.OGlxSVoGVEUFn2',
    'Коваленко Олег Сергійович',
    'department_head',
    '11111111-1111-1111-1111-111111111101',
    true
  );

COMMIT;
