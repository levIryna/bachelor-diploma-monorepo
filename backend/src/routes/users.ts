import bcrypt from "bcryptjs";
import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware";
import pool from "../db";

const usersRouter = Router();
const manageUsers = requireRole("admin");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME_PATTERN = /^[\p{L}'’\s-]+$/u;
const ROLES = new Set(["admin", "department_head", "buyer"]);
const MIN_PASSWORD_LENGTH = 8;

type UserRow = {
  id: string;
  email: string;
  full_name: string;
  role: string;
  department_id: string | null;
  department_name: string | null;
  is_active: boolean | null;
  can_delete: boolean;
  created_at: Date | string;
};

const managedUserSelect = `
  SELECT
    account.id::text AS id,
    account.email,
    account.full_name,
    account.role,
    account.department_id::text AS department_id,
    department.name AS department_name,
    account.is_active,
    account.created_at,
    (
      account.role <> 'admin'
      AND NOT EXISTS (
        SELECT 1
        FROM procurement_plan_items plan_item
        WHERE plan_item.responsible_buyer_id = account.id
           OR plan_item.created_by = account.id
      )
      AND NOT EXISTS (
        SELECT 1
        FROM contract_documents document
        WHERE document.created_by = account.id
      )
      AND NOT EXISTS (
        SELECT 1
        FROM contract_amendments amendment
        WHERE amendment.created_by = account.id
      )
    ) AS can_delete
  FROM users account
  LEFT JOIN departments department ON department.id = account.department_id
`;

function toManagedUser(row: UserRow) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    departmentId: row.department_id,
    departmentName: row.department_name,
    isActive: row.is_active !== false,
    canDelete: row.can_delete,
    createdAt: new Date(row.created_at).toISOString(),
  };
}

function readUserId(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !UUID_PATTERN.test(raw)) {
    return null;
  }
  return raw;
}

function readEmail(value: unknown): { ok: true; email: string } | { ok: false; message: string } {
  if (typeof value !== "string") {
    return { ok: false, message: "Вкажіть електронну пошту" };
  }
  const email = value.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 255) {
    return { ok: false, message: "Вкажіть коректну електронну пошту" };
  }
  return { ok: true, email };
}

function readFullName(value: unknown): { ok: true; fullName: string } | { ok: false; message: string } {
  if (typeof value !== "string") {
    return { ok: false, message: "Вкажіть ПІБ" };
  }
  const fullName = value.trim();
  if (fullName.length === 0 || fullName.length > 255) {
    return { ok: false, message: "Вкажіть ПІБ до 255 символів" };
  }
  if (!NAME_PATTERN.test(fullName)) {
    return { ok: false, message: "У ПІБ дозволені лише літери, пробіл, тире та апостроф" };
  }
  const letters = fullName.match(/\p{L}/gu);
  if (!letters || letters.length < 2) {
    return { ok: false, message: "ПІБ має містити щонайменше 2 літери" };
  }
  return { ok: true, fullName };
}

function readRole(value: unknown): { ok: true; role: string } | { ok: false; message: string } {
  if (typeof value !== "string" || !ROLES.has(value)) {
    return { ok: false, message: "Оберіть роль" };
  }
  return { ok: true, role: value };
}

function readPassword(value: unknown): { ok: true; password: string } | { ok: false; message: string } {
  if (typeof value !== "string" || value.length < MIN_PASSWORD_LENGTH || value.length > 72) {
    return { ok: false, message: "Пароль має містити від 8 до 72 символів" };
  }
  return { ok: true, password: value };
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23503";
}

async function loadUser(id: string): Promise<UserRow | undefined> {
  const result = await pool.query<UserRow>(
    `${managedUserSelect}
     WHERE account.id = $1::uuid`,
    [id],
  );
  return result.rows[0];
}

async function readDepartmentId(
  value: unknown,
): Promise<{ ok: true; departmentId: number | null } | { ok: false; message: string }> {
  if (value === null || value === "") {
    return { ok: true, departmentId: null };
  }
  if (typeof value !== "string" || !/^\d+$/.test(value)) {
    return { ok: false, message: "Оберіть підрозділ" };
  }
  const departmentId = Number(value);
  if (!Number.isSafeInteger(departmentId) || departmentId < 1 || departmentId > 32767) {
    return { ok: false, message: "Оберіть підрозділ" };
  }
  const found = await pool.query(
    `SELECT id FROM departments WHERE id = $1 AND is_active = true`,
    [departmentId],
  );
  if ((found.rowCount ?? 0) === 0) {
    return { ok: false, message: "Підрозділ не знайдено або він пасивний" };
  }
  return { ok: true, departmentId };
}

async function countOtherActiveAdmins(userId: string): Promise<number> {
  const result = await pool.query<{ count: string }>(
    `SELECT COUNT(*)::text AS count
     FROM users
     WHERE role = 'admin' AND is_active IS DISTINCT FROM false AND id <> $1::uuid`,
    [userId],
  );
  return Number(result.rows[0]?.count ?? 0);
}

usersRouter.get("/manage", requireAuth, manageUsers, async (_req, res) => {
  const result = await pool.query<UserRow>(
    `${managedUserSelect}
     ORDER BY account.full_name`,
  );
  res.status(200).json(result.rows.map(toManagedUser));
});

usersRouter.get("/:id", requireAuth, manageUsers, async (req, res) => {
  const id = readUserId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний користувач" });
    return;
  }
  const row = await loadUser(id);
  if (!row) {
    res.status(404).json({ message: "Користувача не знайдено" });
    return;
  }
  res.status(200).json(toManagedUser(row));
});

usersRouter.post("/", requireAuth, manageUsers, async (req, res) => {
  const email = readEmail(req.body?.email);
  const fullName = readFullName(req.body?.fullName);
  const role = readRole(req.body?.role);
  const password = readPassword(req.body?.password);
  const department = await readDepartmentId(req.body?.departmentId ?? null);
  if (!email.ok) {
    res.status(400).json({ message: email.message });
    return;
  }
  if (!fullName.ok) {
    res.status(400).json({ message: fullName.message });
    return;
  }
  if (!role.ok) {
    res.status(400).json({ message: role.message });
    return;
  }
  if (!department.ok) {
    res.status(400).json({ message: department.message });
    return;
  }
  if (!password.ok) {
    res.status(400).json({ message: password.message });
    return;
  }
  if (req.body?.password !== req.body?.passwordConfirm) {
    res.status(400).json({ message: "Паролі не збігаються" });
    return;
  }
  if (role.role === "department_head" && department.departmentId === null) {
    res.status(400).json({ message: "Для керівника підрозділу оберіть підрозділ" });
    return;
  }

  const passwordHash = await bcrypt.hash(password.password, 10);
  try {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO users (email, password_hash, full_name, role, department_id, is_active)
       VALUES ($1, $2, $3, $4, $5, true)
       RETURNING id::text AS id`,
      [email.email, passwordHash, fullName.fullName, role.role, department.departmentId],
    );
    const id = inserted.rows[0]?.id;
    if (!id) {
      res.status(500).json({ message: "Не вдалося створити користувача" });
      return;
    }
    const row = await loadUser(id);
    if (!row) {
      res.status(500).json({ message: "Не вдалося створити користувача" });
      return;
    }
    res.status(200).json(toManagedUser(row));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Користувач з такою поштою вже існує" });
      return;
    }
    throw error;
  }
});

usersRouter.patch("/:id", requireAuth, manageUsers, async (req, res) => {
  const id = readUserId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний користувач" });
    return;
  }
  const current = await loadUser(id);
  if (!current) {
    res.status(404).json({ message: "Користувача не знайдено" });
    return;
  }

  const body = req.body ?? {};
  let email = current.email;
  let fullName = current.full_name;
  let role = current.role;
  let departmentId = current.department_id === null ? null : Number(current.department_id);
  let isActive = current.is_active !== false;

  if ("email" in body) {
    const next = readEmail(body.email);
    if (!next.ok) {
      res.status(400).json({ message: next.message });
      return;
    }
    email = next.email;
  }
  if ("fullName" in body) {
    const next = readFullName(body.fullName);
    if (!next.ok) {
      res.status(400).json({ message: next.message });
      return;
    }
    fullName = next.fullName;
  }
  if ("role" in body) {
    const next = readRole(body.role);
    if (!next.ok) {
      res.status(400).json({ message: next.message });
      return;
    }
    role = next.role;
  }
  if ("departmentId" in body) {
    const next = await readDepartmentId(body.departmentId);
    if (!next.ok) {
      res.status(400).json({ message: next.message });
      return;
    }
    departmentId = next.departmentId;
  }
  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      res.status(400).json({ message: "Некоректний статус" });
      return;
    }
    isActive = body.isActive;
  }

  if (role === "department_head" && departmentId === null) {
    res.status(400).json({ message: "Для керівника підрозділу оберіть підрозділ" });
    return;
  }

  const losesAdmin = current.role === "admin" && (role !== "admin" || !isActive);
  if (losesAdmin && (await countOtherActiveAdmins(id)) === 0) {
    res.status(409).json({ message: "Має лишитися хоча б один активний адміністратор" });
    return;
  }

  try {
    await pool.query(
      `UPDATE users
       SET email = $2,
           full_name = $3,
           role = $4,
           department_id = $5,
           is_active = $6
       WHERE id = $1::uuid`,
      [id, email, fullName, role, departmentId, isActive],
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Користувач з такою поштою вже існує" });
      return;
    }
    throw error;
  }

  const row = await loadUser(id);
  if (!row) {
    res.status(404).json({ message: "Користувача не знайдено" });
    return;
  }
  res.status(200).json(toManagedUser(row));
});

usersRouter.patch("/:id/password", requireAuth, manageUsers, async (req, res) => {
  const id = readUserId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний користувач" });
    return;
  }
  const password = readPassword(req.body?.password);
  if (!password.ok) {
    res.status(400).json({ message: password.message });
    return;
  }
  if (req.body?.password !== req.body?.passwordConfirm) {
    res.status(400).json({ message: "Паролі не збігаються" });
    return;
  }
  if (typeof req.body?.adminPassword !== "string" || req.body.adminPassword.length === 0) {
    res.status(400).json({ message: "Вкажіть пароль адміністратора" });
    return;
  }

  const current = await loadUser(id);
  if (!current) {
    res.status(404).json({ message: "Користувача не знайдено" });
    return;
  }
  if (current.role === "admin") {
    res.status(409).json({ message: "Пароль адміністратора не можна змінити" });
    return;
  }

  const adminId = req.user?.sub;
  const admin = await pool.query<{ password_hash: string }>(
    `SELECT password_hash FROM users WHERE id = $1::uuid AND role = 'admin'`,
    [adminId],
  );
  const adminHash = admin.rows[0]?.password_hash;
  const adminMatches = adminHash
    ? await bcrypt.compare(req.body.adminPassword, adminHash)
    : false;
  if (!adminMatches) {
    res.status(403).json({ message: "Невірний пароль адміністратора" });
    return;
  }

  const passwordHash = await bcrypt.hash(password.password, 10);
  await pool.query(`UPDATE users SET password_hash = $2 WHERE id = $1::uuid`, [id, passwordHash]);
  res.status(200).json(toManagedUser(current));
});

usersRouter.delete("/:id", requireAuth, manageUsers, async (req, res) => {
  const id = readUserId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний користувач" });
    return;
  }
  const row = await loadUser(id);
  if (!row) {
    res.status(404).json({ message: "Користувача не знайдено" });
    return;
  }
  if (row.role === "admin") {
    res.status(409).json({ message: "Користувача з роллю адміністратора не можна видалити" });
    return;
  }
  if (!row.can_delete) {
    res.status(409).json({ message: "Користувача не можна видалити, бо він уже використовується" });
    return;
  }

  try {
    await pool.query(`DELETE FROM users WHERE id = $1::uuid`, [id]);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      res.status(409).json({ message: "Користувача не можна видалити, бо він уже використовується" });
      return;
    }
    throw error;
  }
  res.status(200).json({ id });
});

export default usersRouter;
