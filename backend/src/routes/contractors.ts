import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware";
import pool from "../db";

const contractorsRouter = Router();
const manageContractor = requireRole("admin", "buyer");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ContractorRow = {
  id: string;
  name: string;
  edrpou: string | null;
  is_active: boolean;
  can_delete: boolean;
};

const managedContractorSelect = `
  SELECT
    contractor.id::text AS id,
    contractor.name,
    contractor.edrpou,
    contractor.is_active,
    NOT EXISTS (
      SELECT 1
      FROM procurement_plan_items plan_item
      WHERE plan_item.prev_contractor_id = contractor.id
    )
    AND NOT EXISTS (
      SELECT 1
      FROM contract_documents document
      WHERE document.contractor_id = contractor.id
    ) AS can_delete
  FROM contractors contractor
`;

function toManagedContractor(row: ContractorRow) {
  return {
    id: row.id,
    name: row.name,
    edrpou: row.edrpou,
    isActive: row.is_active,
    canDelete: row.can_delete,
  };
}

function readContractorId(value: string | string[] | undefined): string | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !UUID_PATTERN.test(raw)) {
    return null;
  }
  return raw;
}

const CONTRACTOR_NAME_PATTERN = /^[\p{L}"«»&\s\-—]+$/u;

function contractorNameError(name: string): string | null {
  if (!CONTRACTOR_NAME_PATTERN.test(name)) {
    return "Дозволені лише літери, лапки, пробіл, тире та &";
  }
  const letters = name.match(/\p{L}/gu);
  if (!letters || letters.length < 2) {
    return "Назва має містити щонайменше 2 літери";
  }
  return null;
}

function readContractorName(
  value: unknown,
): { ok: true; name: string } | { ok: false; message: string } {
  if (typeof value !== "string") {
    return { ok: false, message: "Вкажіть назву контрагента до 512 символів" };
  }
  const name = value.trim();
  if (name.length === 0 || name.length > 512) {
    return { ok: false, message: "Вкажіть назву контрагента до 512 символів" };
  }
  const formatError = contractorNameError(name);
  if (formatError) {
    return { ok: false, message: formatError };
  }
  return { ok: true, name };
}

function readEdrpou(value: unknown): { ok: true; edrpou: string | null } | { ok: false } {
  if (value === undefined || value === null) {
    return { ok: true, edrpou: null };
  }
  if (typeof value !== "string") {
    return { ok: false };
  }
  const edrpou = value.trim();
  if (edrpou.length === 0) {
    return { ok: true, edrpou: null };
  }
  if (!/^\d{8}$|^\d{10}$/.test(edrpou)) {
    return { ok: false };
  }
  return { ok: true, edrpou };
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23503";
}

async function findDuplicate(
  name: string,
  edrpou: string | null,
  exceptId: string | null,
): Promise<"name" | "edrpou" | null> {
  const byName = await pool.query(
    `SELECT 1
     FROM contractors
     WHERE name = $1
       AND ($2::uuid IS NULL OR id <> $2::uuid)
     LIMIT 1`,
    [name, exceptId],
  );
  if ((byName.rowCount ?? 0) > 0) {
    return "name";
  }
  if (!edrpou) {
    return null;
  }
  const byEdrpou = await pool.query(
    `SELECT 1
     FROM contractors
     WHERE edrpou = $1
       AND ($2::uuid IS NULL OR id <> $2::uuid)
     LIMIT 1`,
    [edrpou, exceptId],
  );
  if ((byEdrpou.rowCount ?? 0) > 0) {
    return "edrpou";
  }
  return null;
}

function duplicateMessage(kind: "name" | "edrpou"): string {
  return kind === "name"
    ? "Контрагент з такою назвою вже існує"
    : "Контрагент з таким ЄДРПОУ вже існує";
}

async function loadContractor(id: string): Promise<ContractorRow | undefined> {
  const result = await pool.query<ContractorRow>(
    `${managedContractorSelect}
     WHERE contractor.id = $1::uuid`,
    [id],
  );
  return result.rows[0];
}

contractorsRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT name
     FROM contractors
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

contractorsRouter.post("/", requireAuth, manageContractor, async (req, res) => {
  const name = readContractorName(req.body?.name);
  const edrpou = readEdrpou(req.body?.edrpou);
  if (!name.ok) {
    res.status(400).json({ message: name.message });
    return;
  }
  if (!edrpou.ok) {
    res.status(400).json({ message: "ЄДРПОУ має містити 8 або 10 цифр" });
    return;
  }

  const duplicate = await findDuplicate(name.name, edrpou.edrpou, null);
  if (duplicate) {
    res.status(409).json({ message: duplicateMessage(duplicate) });
    return;
  }

  const inserted = await pool.query<{ id: string }>(
    `INSERT INTO contractors (name, edrpou)
     VALUES ($1, $2)
     RETURNING id::text AS id`,
    [name.name, edrpou.edrpou],
  );
  const id = inserted.rows[0]?.id;
  if (!id) {
    res.status(500).json({ message: "Не вдалося створити контрагента" });
    return;
  }

  const row = await loadContractor(id);
  if (!row) {
    res.status(500).json({ message: "Не вдалося створити контрагента" });
    return;
  }
  res.status(200).json(toManagedContractor(row));
});

contractorsRouter.get("/manage", requireAuth, manageContractor, async (_req, res) => {
  const result = await pool.query<ContractorRow>(
    `${managedContractorSelect}
     ORDER BY contractor.name`,
  );
  res.status(200).json(result.rows.map(toManagedContractor));
});

contractorsRouter.patch("/:id/active", requireAuth, manageContractor, async (req, res) => {
  const id = readContractorId(req.params.id);
  const isActive = req.body?.isActive;
  if (!id || typeof isActive !== "boolean") {
    res.status(400).json({ message: "Некоректний статус контрагента" });
    return;
  }

  const result = await pool.query(
    `UPDATE contractors
     SET is_active = $2
     WHERE id = $1::uuid`,
    [id, isActive],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Контрагента не знайдено" });
    return;
  }

  const row = await loadContractor(id);
  if (!row) {
    res.status(404).json({ message: "Контрагента не знайдено" });
    return;
  }
  res.status(200).json(toManagedContractor(row));
});

contractorsRouter.patch("/:id", requireAuth, manageContractor, async (req, res) => {
  const id = readContractorId(req.params.id);
  const name = readContractorName(req.body?.name);
  const edrpou = readEdrpou(req.body?.edrpou);
  if (!id) {
    res.status(400).json({ message: "Некоректний контрагент" });
    return;
  }
  if (!name.ok) {
    res.status(400).json({ message: name.message });
    return;
  }
  if (!edrpou.ok) {
    res.status(400).json({ message: "ЄДРПОУ має містити 8 або 10 цифр" });
    return;
  }

  const existing = await loadContractor(id);
  if (!existing) {
    res.status(404).json({ message: "Контрагента не знайдено" });
    return;
  }

  const duplicate = await findDuplicate(name.name, edrpou.edrpou, id);
  if (duplicate) {
    res.status(409).json({ message: duplicateMessage(duplicate) });
    return;
  }

  await pool.query(
    `UPDATE contractors
     SET name = $2,
         edrpou = $3
     WHERE id = $1::uuid`,
    [id, name.name, edrpou.edrpou],
  );

  const row = await loadContractor(id);
  if (!row) {
    res.status(404).json({ message: "Контрагента не знайдено" });
    return;
  }
  res.status(200).json(toManagedContractor(row));
});

contractorsRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = readContractorId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний контрагент" });
    return;
  }

  const row = await loadContractor(id);
  if (!row) {
    res.status(404).json({ message: "Контрагента не знайдено" });
    return;
  }
  if (!row.can_delete) {
    res.status(409).json({
      message: "Контрагента не можна видалити, бо він уже використовується",
    });
    return;
  }

  try {
    await pool.query(`DELETE FROM contractors WHERE id = $1::uuid`, [id]);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      res.status(409).json({
        message: "Контрагента не можна видалити, бо він уже використовується",
      });
      return;
    }
    throw error;
  }

  res.status(200).json({ id });
});

export default contractorsRouter;
