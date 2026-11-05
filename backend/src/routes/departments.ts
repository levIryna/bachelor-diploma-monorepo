import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware";
import pool from "../db";
import { directoryNameError } from "../validation/directoryName";

const departmentsRouter = Router();
const manageRoles = requireRole("admin", "buyer");

type DepartmentRow = {
  id: string;
  name: string;
  is_active: boolean;
  can_delete: boolean;
};

const managedDepartmentSelect = `
  SELECT
    d.id::text AS id,
    d.name,
    d.is_active,
    NOT (
      EXISTS (SELECT 1 FROM users account WHERE account.department_id = d.id)
      OR EXISTS (SELECT 1 FROM procurement_plan_items item WHERE item.department_id = d.id)
      OR EXISTS (
        SELECT 1 FROM contract_documents document
        WHERE document.initiator_department_id = d.id
      )
    ) AS can_delete
  FROM departments d
`;

function toManagedDepartment(row: DepartmentRow) {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    canDelete: row.can_delete,
  };
}

function readDepartmentId(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) {
    return null;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1 || id > 32767) {
    return null;
  }
  return id;
}

function isUniqueViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function isForeignKeyViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23503"
  );
}

departmentsRouter.get("/", async (req, res) => {
  if (req.user?.role === "department_head") {
    if (!req.user.departmentId) {
      res.status(200).json([]);
      return;
    }

    const result = await pool.query<{ id: string; name: string }>(
      `SELECT id::text AS id, name
       FROM departments
       WHERE is_active = true AND id = $1::int`,
      [req.user.departmentId],
    );
    res.status(200).json(result.rows);
    return;
  }

  const result = await pool.query<{ id: string; name: string }>(
    `SELECT id::text AS id, name
     FROM departments
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows);
});

departmentsRouter.post("/", requireAuth, manageRoles, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name.length === 0 || name.length > 255) {
    res.status(400).json({ message: "Вкажіть назву підрозділу до 255 символів" });
    return;
  }
  const formatError = directoryNameError(name, false);
  if (formatError) {
    res.status(400).json({ message: formatError });
    return;
  }

  try {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO departments (id, name)
       SELECT COALESCE(MAX(id), 0) + 1, $1
       FROM departments
       RETURNING id::text AS id`,
      [name],
    );
    const id = Number(inserted.rows[0]?.id);
    if (!Number.isInteger(id) || id < 1) {
      res.status(500).json({ message: "Не вдалося створити підрозділ" });
      return;
    }
    const fresh = await pool.query<DepartmentRow>(
      `${managedDepartmentSelect}
       WHERE d.id = $1`,
      [id],
    );
    const row = fresh.rows[0];
    if (!row) {
      res.status(500).json({ message: "Не вдалося створити підрозділ" });
      return;
    }
    res.status(200).json(toManagedDepartment(row));
  } catch (error) {
    if (isUniqueViolation(error)) {
      const constraint =
        typeof error === "object" && error !== null && "constraint" in error
          ? String(error.constraint)
          : "";
      res.status(409).json({
        message:
          constraint === "departments_pkey"
            ? "Не вдалося створити підрозділ"
            : "Підрозділ з такою назвою вже існує",
      });
      return;
    }
    throw error;
  }
});

departmentsRouter.get("/manage", requireAuth, manageRoles, async (_req, res) => {
  const result = await pool.query<DepartmentRow>(
    `${managedDepartmentSelect}
     ORDER BY d.name`,
  );
  res.status(200).json(result.rows.map(toManagedDepartment));
});

departmentsRouter.patch("/:id", requireAuth, manageRoles, async (req, res) => {
  const id = readDepartmentId(req.params.id);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (id === null) {
    res.status(400).json({ message: "Некоректний підрозділ" });
    return;
  }
  if (name.length === 0 || name.length > 255) {
    res.status(400).json({ message: "Вкажіть назву підрозділу до 255 символів" });
    return;
  }

  try {
    const result = await pool.query<DepartmentRow>(
      `UPDATE departments
       SET name = $2
       WHERE id = $1
       RETURNING id::text AS id, name, is_active, false AS can_delete`,
      [id, name],
    );
    const updated = result.rows[0];
    if (!updated) {
      res.status(404).json({ message: "Підрозділ не знайдено" });
      return;
    }
    const fresh = await pool.query<DepartmentRow>(
      `${managedDepartmentSelect}
       WHERE d.id = $1`,
      [id],
    );
    res.status(200).json(toManagedDepartment(fresh.rows[0] ?? updated));
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Підрозділ з такою назвою вже існує" });
      return;
    }
    throw error;
  }
});

departmentsRouter.patch("/:id/active", requireAuth, manageRoles, async (req, res) => {
  const id = readDepartmentId(req.params.id);
  const isActive = req.body?.isActive;
  if (id === null || typeof isActive !== "boolean") {
    res.status(400).json({ message: "Некоректний статус підрозділу" });
    return;
  }

  const result = await pool.query<DepartmentRow>(
    `UPDATE departments
     SET is_active = $2
     WHERE id = $1
     RETURNING id`,
    [id, isActive],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Підрозділ не знайдено" });
    return;
  }

  const fresh = await pool.query<DepartmentRow>(
    `${managedDepartmentSelect}
     WHERE d.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Підрозділ не знайдено" });
    return;
  }
  res.status(200).json(toManagedDepartment(row));
});

departmentsRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = readDepartmentId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "Некоректний підрозділ" });
    return;
  }

  const current = await pool.query<DepartmentRow>(
    `${managedDepartmentSelect}
     WHERE d.id = $1`,
    [id],
  );
  const row = current.rows[0];
  if (!row) {
    res.status(404).json({ message: "Підрозділ не знайдено" });
    return;
  }
  if (!row.can_delete) {
    res.status(409).json({ message: "Підрозділ не можна видалити, бо він уже використовується" });
    return;
  }

  try {
    await pool.query(`DELETE FROM departments WHERE id = $1`, [id]);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      res.status(409).json({ message: "Підрозділ не можна видалити, бо він уже використовується" });
      return;
    }
    throw error;
  }

  res.status(200).json({ id: String(id) });
});

export default departmentsRouter;
