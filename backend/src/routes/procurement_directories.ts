import { Router } from "express";
import { requireAuth, requireRole } from "../auth/middleware";
import pool from "../db";
import { directoryNameError } from "../validation/directoryName";

const procurementKindsRouter = Router();
const procurementCategoriesRouter = Router();
const fundingSourcesRouter = Router();
const ipNkrekpItemsRouter = Router();
const procurementProceduresRouter = Router();
const contractTypesRouter = Router();

type ProcurementKindRow = {
  id: string;
  name: string;
  is_active: boolean;
  can_delete: boolean;
};

const managedProcurementKindSelect = `
  SELECT
    k.id::text AS id,
    k.name_uk AS name,
    k.is_active,
    NOT EXISTS (
      SELECT 1
      FROM procurement_plan_items item
      WHERE item.procurement_kind_id = k.id
    ) AS can_delete
  FROM procurement_kinds k
`;

function toManagedProcurementKind(row: ProcurementKindRow) {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    canDelete: row.can_delete,
  };
}

function readPositiveId(
  value: string | string[] | undefined,
  max: number,
): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || !/^\d+$/.test(raw)) {
    return null;
  }
  const id = Number(raw);
  if (!Number.isInteger(id) || id < 1 || id > max) {
    return null;
  }
  return id;
}

function readProcurementKindId(value: string | string[] | undefined): number | null {
  return readPositiveId(value, 2147483647);
}

function readSmallDirectoryId(value: string | string[] | undefined): number | null {
  return readPositiveId(value, 32767);
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23503";
}

const manageProcurementKind = requireRole("admin", "buyer");

procurementKindsRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT name_uk AS name
     FROM procurement_kinds
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

procurementKindsRouter.post("/", requireAuth, manageProcurementKind, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name.length === 0 || name.length > 255) {
    res.status(400).json({ message: "Вкажіть назву виду закупівлі до 255 символів" });
    return;
  }
  const kindFormatError = directoryNameError(name, false);
  if (kindFormatError) {
    res.status(400).json({ message: kindFormatError });
    return;
  }

  let id: number | null = null;
  try {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO procurement_kinds (name_uk)
       VALUES ($1)
       RETURNING id::text AS id`,
      [name],
    );
    id = Number(inserted.rows[0]?.id);
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Вид закупівлі з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  if (id === null || !Number.isInteger(id)) {
    res.status(500).json({ message: "Не вдалося створити вид закупівлі" });
    return;
  }

  const fresh = await pool.query<ProcurementKindRow>(
    `${managedProcurementKindSelect}
     WHERE k.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(500).json({ message: "Не вдалося створити вид закупівлі" });
    return;
  }
  res.status(200).json(toManagedProcurementKind(row));
});

procurementKindsRouter.get("/manage", requireAuth, manageProcurementKind, async (_req, res) => {
  const result = await pool.query<ProcurementKindRow>(
    `${managedProcurementKindSelect}
     ORDER BY k.name_uk`,
  );
  res.status(200).json(result.rows.map(toManagedProcurementKind));
});

procurementKindsRouter.patch("/:id/active", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  const isActive = req.body?.isActive;
  if (id === null || typeof isActive !== "boolean") {
    res.status(400).json({ message: "Некоректний статус виду закупівлі" });
    return;
  }

  const result = await pool.query(
    `UPDATE procurement_kinds
     SET is_active = $2
     WHERE id = $1`,
    [id, isActive],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Вид закупівлі не знайдено" });
    return;
  }

  const fresh = await pool.query<ProcurementKindRow>(
    `${managedProcurementKindSelect}
     WHERE k.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Вид закупівлі не знайдено" });
    return;
  }
  res.status(200).json(toManagedProcurementKind(row));
});

procurementKindsRouter.patch("/:id", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (id === null) {
    res.status(400).json({ message: "Некоректний вид закупівлі" });
    return;
  }
  if (name.length === 0 || name.length > 255) {
    res.status(400).json({ message: "Вкажіть назву виду закупівлі до 255 символів" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE procurement_kinds
       SET name_uk = $2
       WHERE id = $1`,
      [id, name],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ message: "Вид закупівлі не знайдено" });
      return;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Вид закупівлі з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  const fresh = await pool.query<ProcurementKindRow>(
    `${managedProcurementKindSelect}
     WHERE k.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Вид закупівлі не знайдено" });
    return;
  }
  res.status(200).json(toManagedProcurementKind(row));
});

procurementKindsRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "Некоректний вид закупівлі" });
    return;
  }

  const current = await pool.query<ProcurementKindRow>(
    `${managedProcurementKindSelect}
     WHERE k.id = $1`,
    [id],
  );
  const row = current.rows[0];
  if (!row) {
    res.status(404).json({ message: "Вид закупівлі не знайдено" });
    return;
  }
  if (!row.can_delete) {
    res.status(409).json({ message: "Вид закупівлі не можна видалити, бо він уже використовується" });
    return;
  }

  try {
    await pool.query(`DELETE FROM procurement_kinds WHERE id = $1`, [id]);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      res.status(409).json({
        message: "Вид закупівлі не можна видалити, бо він уже використовується",
      });
      return;
    }
    throw error;
  }

  res.status(200).json({ id: String(id) });
});

type ProcurementCategoryRow = {
  id: string;
  name: string;
  is_active: boolean;
  can_delete: boolean;
};

const managedProcurementCategorySelect = `
  SELECT
    c.id::text AS id,
    c.name_uk AS name,
    c.is_active,
    NOT EXISTS (
      SELECT 1
      FROM procurement_plan_items item
      WHERE item.category_id = c.id
    ) AS can_delete
  FROM procurement_categories c
`;

function toManagedProcurementCategory(row: ProcurementCategoryRow) {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    canDelete: row.can_delete,
  };
}

procurementCategoriesRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT name_uk AS name
     FROM procurement_categories
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

procurementCategoriesRouter.post("/", requireAuth, manageProcurementKind, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name.length === 0 || name.length > 255) {
    res.status(400).json({ message: "Вкажіть назву категорії до 255 символів" });
    return;
  }
  const categoryFormatError = directoryNameError(name, false);
  if (categoryFormatError) {
    res.status(400).json({ message: categoryFormatError });
    return;
  }

  let id: number | null = null;
  try {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO procurement_categories (name_uk)
       VALUES ($1)
       RETURNING id::text AS id`,
      [name],
    );
    id = Number(inserted.rows[0]?.id);
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Категорія з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  if (id === null || !Number.isInteger(id)) {
    res.status(500).json({ message: "Не вдалося створити категорію" });
    return;
  }

  const fresh = await pool.query<ProcurementCategoryRow>(
    `${managedProcurementCategorySelect}
     WHERE c.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(500).json({ message: "Не вдалося створити категорію" });
    return;
  }
  res.status(200).json(toManagedProcurementCategory(row));
});

procurementCategoriesRouter.get("/manage", requireAuth, manageProcurementKind, async (_req, res) => {
  const result = await pool.query<ProcurementCategoryRow>(
    `${managedProcurementCategorySelect}
     ORDER BY c.name_uk`,
  );
  res.status(200).json(result.rows.map(toManagedProcurementCategory));
});

procurementCategoriesRouter.patch("/:id/active", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  const isActive = req.body?.isActive;
  if (id === null || typeof isActive !== "boolean") {
    res.status(400).json({ message: "Некоректний статус категорії" });
    return;
  }

  const result = await pool.query(
    `UPDATE procurement_categories
     SET is_active = $2
     WHERE id = $1`,
    [id, isActive],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Категорію не знайдено" });
    return;
  }

  const fresh = await pool.query<ProcurementCategoryRow>(
    `${managedProcurementCategorySelect}
     WHERE c.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Категорію не знайдено" });
    return;
  }
  res.status(200).json(toManagedProcurementCategory(row));
});

procurementCategoriesRouter.patch("/:id", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (id === null) {
    res.status(400).json({ message: "Некоректна категорія" });
    return;
  }
  if (name.length === 0 || name.length > 255) {
    res.status(400).json({ message: "Вкажіть назву категорії до 255 символів" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE procurement_categories
       SET name_uk = $2
       WHERE id = $1`,
      [id, name],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ message: "Категорію не знайдено" });
      return;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Категорія з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  const fresh = await pool.query<ProcurementCategoryRow>(
    `${managedProcurementCategorySelect}
     WHERE c.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Категорію не знайдено" });
    return;
  }
  res.status(200).json(toManagedProcurementCategory(row));
});

procurementCategoriesRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "Некоректна категорія" });
    return;
  }

  const current = await pool.query<ProcurementCategoryRow>(
    `${managedProcurementCategorySelect}
     WHERE c.id = $1`,
    [id],
  );
  const row = current.rows[0];
  if (!row) {
    res.status(404).json({ message: "Категорію не знайдено" });
    return;
  }
  if (!row.can_delete) {
    res.status(409).json({
      message: "Категорію не можна видалити, бо вона вже використовується",
    });
    return;
  }

  try {
    await pool.query(`DELETE FROM procurement_categories WHERE id = $1`, [id]);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      res.status(409).json({
        message: "Категорію не можна видалити, бо вона вже використовується",
      });
      return;
    }
    throw error;
  }

  res.status(200).json({ id: String(id) });
});

type FundingSourceRow = {
  id: string;
  name: string;
  is_active: boolean;
  can_delete: boolean;
};

const managedFundingSourceSelect = `
  SELECT
    f.id::text AS id,
    f.name_uk AS name,
    f.is_active,
    NOT EXISTS (
      SELECT 1
      FROM procurement_plan_items item
      WHERE item.funding_source_id = f.id
    ) AS can_delete
  FROM funding_sources f
`;

function toManagedFundingSource(row: FundingSourceRow) {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    canDelete: row.can_delete,
  };
}

fundingSourcesRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT name_uk AS name
     FROM funding_sources
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

fundingSourcesRouter.post("/", requireAuth, manageProcurementKind, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name.length === 0 || name.length > 255) {
    res.status(400).json({ message: "Вкажіть назву джерела фінансування до 255 символів" });
    return;
  }
  const fundingFormatError = directoryNameError(name, false);
  if (fundingFormatError) {
    res.status(400).json({ message: fundingFormatError });
    return;
  }

  let id: number | null = null;
  try {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO funding_sources (name_uk)
       VALUES ($1)
       RETURNING id::text AS id`,
      [name],
    );
    id = Number(inserted.rows[0]?.id);
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Джерело фінансування з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  if (id === null || !Number.isInteger(id)) {
    res.status(500).json({ message: "Не вдалося створити джерело фінансування" });
    return;
  }

  const fresh = await pool.query<FundingSourceRow>(
    `${managedFundingSourceSelect}
     WHERE f.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(500).json({ message: "Не вдалося створити джерело фінансування" });
    return;
  }
  res.status(200).json(toManagedFundingSource(row));
});

fundingSourcesRouter.get("/manage", requireAuth, manageProcurementKind, async (_req, res) => {
  const result = await pool.query<FundingSourceRow>(
    `${managedFundingSourceSelect}
     ORDER BY f.name_uk`,
  );
  res.status(200).json(result.rows.map(toManagedFundingSource));
});

fundingSourcesRouter.patch("/:id/active", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  const isActive = req.body?.isActive;
  if (id === null || typeof isActive !== "boolean") {
    res.status(400).json({ message: "Некоректний статус джерела фінансування" });
    return;
  }

  const result = await pool.query(
    `UPDATE funding_sources
     SET is_active = $2
     WHERE id = $1`,
    [id, isActive],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Джерело фінансування не знайдено" });
    return;
  }

  const fresh = await pool.query<FundingSourceRow>(
    `${managedFundingSourceSelect}
     WHERE f.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Джерело фінансування не знайдено" });
    return;
  }
  res.status(200).json(toManagedFundingSource(row));
});

fundingSourcesRouter.patch("/:id", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (id === null) {
    res.status(400).json({ message: "Некоректне джерело фінансування" });
    return;
  }
  if (name.length === 0 || name.length > 255) {
    res.status(400).json({ message: "Вкажіть назву джерела фінансування до 255 символів" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE funding_sources
       SET name_uk = $2
       WHERE id = $1`,
      [id, name],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ message: "Джерело фінансування не знайдено" });
      return;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Джерело фінансування з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  const fresh = await pool.query<FundingSourceRow>(
    `${managedFundingSourceSelect}
     WHERE f.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Джерело фінансування не знайдено" });
    return;
  }
  res.status(200).json(toManagedFundingSource(row));
});

fundingSourcesRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "Некоректне джерело фінансування" });
    return;
  }

  const current = await pool.query<FundingSourceRow>(
    `${managedFundingSourceSelect}
     WHERE f.id = $1`,
    [id],
  );
  const row = current.rows[0];
  if (!row) {
    res.status(404).json({ message: "Джерело фінансування не знайдено" });
    return;
  }
  if (!row.can_delete) {
    res.status(409).json({
      message: "Джерело фінансування не можна видалити, бо воно вже використовується",
    });
    return;
  }

  try {
    await pool.query(`DELETE FROM funding_sources WHERE id = $1`, [id]);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      res.status(409).json({
        message: "Джерело фінансування не можна видалити, бо воно вже використовується",
      });
      return;
    }
    throw error;
  }

  res.status(200).json({ id: String(id) });
});

type IpNkrekpItemRow = {
  id: string;
  name: string;
  is_active: boolean;
  can_delete: boolean;
};

const managedIpNkrekpItemSelect = `
  SELECT
    item.id::text AS id,
    item.title AS name,
    item.is_active,
    NOT EXISTS (
      SELECT 1
      FROM procurement_plan_items plan_item
      WHERE plan_item.ip_nkrekp_item_id = item.id
    ) AS can_delete
  FROM ip_nkrekp_items item
`;

function toManagedIpNkrekpItem(row: IpNkrekpItemRow) {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    canDelete: row.can_delete,
  };
}

ipNkrekpItemsRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT title AS name
     FROM ip_nkrekp_items
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

ipNkrekpItemsRouter.post("/", requireAuth, manageProcurementKind, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name.length === 0 || name.length > 512) {
    res.status(400).json({ message: "Вкажіть назву пункту ІП НКРЕКП до 512 символів" });
    return;
  }
  const ipFormatError = directoryNameError(name, true);
  if (ipFormatError) {
    res.status(400).json({ message: ipFormatError });
    return;
  }

  let id: number | null = null;
  try {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO ip_nkrekp_items (title)
       VALUES ($1)
       RETURNING id::text AS id`,
      [name],
    );
    id = Number(inserted.rows[0]?.id);
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Пункт ІП НКРЕКП з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  if (id === null || !Number.isInteger(id)) {
    res.status(500).json({ message: "Не вдалося створити пункт ІП НКРЕКП" });
    return;
  }

  const fresh = await pool.query<IpNkrekpItemRow>(
    `${managedIpNkrekpItemSelect}
     WHERE item.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(500).json({ message: "Не вдалося створити пункт ІП НКРЕКП" });
    return;
  }
  res.status(200).json(toManagedIpNkrekpItem(row));
});

ipNkrekpItemsRouter.get("/manage", requireAuth, manageProcurementKind, async (_req, res) => {
  const result = await pool.query<IpNkrekpItemRow>(
    `${managedIpNkrekpItemSelect}
     ORDER BY item.title`,
  );
  res.status(200).json(result.rows.map(toManagedIpNkrekpItem));
});

ipNkrekpItemsRouter.patch("/:id/active", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  const isActive = req.body?.isActive;
  if (id === null || typeof isActive !== "boolean") {
    res.status(400).json({ message: "Некоректний статус пункту ІП НКРЕКП" });
    return;
  }

  const result = await pool.query(
    `UPDATE ip_nkrekp_items
     SET is_active = $2
     WHERE id = $1`,
    [id, isActive],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Пункт ІП НКРЕКП не знайдено" });
    return;
  }

  const fresh = await pool.query<IpNkrekpItemRow>(
    `${managedIpNkrekpItemSelect}
     WHERE item.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Пункт ІП НКРЕКП не знайдено" });
    return;
  }
  res.status(200).json(toManagedIpNkrekpItem(row));
});

ipNkrekpItemsRouter.patch("/:id", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (id === null) {
    res.status(400).json({ message: "Некоректний пункт ІП НКРЕКП" });
    return;
  }
  if (name.length === 0 || name.length > 512) {
    res.status(400).json({ message: "Вкажіть назву пункту ІП НКРЕКП до 512 символів" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE ip_nkrekp_items
       SET title = $2
       WHERE id = $1`,
      [id, name],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ message: "Пункт ІП НКРЕКП не знайдено" });
      return;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Пункт ІП НКРЕКП з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  const fresh = await pool.query<IpNkrekpItemRow>(
    `${managedIpNkrekpItemSelect}
     WHERE item.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Пункт ІП НКРЕКП не знайдено" });
    return;
  }
  res.status(200).json(toManagedIpNkrekpItem(row));
});

ipNkrekpItemsRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "Некоректний пункт ІП НКРЕКП" });
    return;
  }

  const current = await pool.query<IpNkrekpItemRow>(
    `${managedIpNkrekpItemSelect}
     WHERE item.id = $1`,
    [id],
  );
  const row = current.rows[0];
  if (!row) {
    res.status(404).json({ message: "Пункт ІП НКРЕКП не знайдено" });
    return;
  }
  if (!row.can_delete) {
    res.status(409).json({
      message: "Пункт ІП НКРЕКП не можна видалити, бо він уже використовується",
    });
    return;
  }

  try {
    await pool.query(`DELETE FROM ip_nkrekp_items WHERE id = $1`, [id]);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      res.status(409).json({
        message: "Пункт ІП НКРЕКП не можна видалити, бо він уже використовується",
      });
      return;
    }
    throw error;
  }

  res.status(200).json({ id: String(id) });
});

type ProcurementProcedureRow = {
  id: string;
  name: string;
  is_active: boolean;
  can_delete: boolean;
};

const managedProcurementProcedureSelect = `
  SELECT
    proc.id::text AS id,
    proc.name_uk AS name,
    proc.is_active,
    NOT EXISTS (
      SELECT 1
      FROM contract_documents document
      WHERE document.procedure_id = proc.id
    ) AS can_delete
  FROM procurement_procedures proc
`;

function toManagedProcurementProcedure(row: ProcurementProcedureRow) {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    canDelete: row.can_delete,
  };
}

procurementProceduresRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT name_uk AS name
     FROM procurement_procedures
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

procurementProceduresRouter.post("/", requireAuth, manageProcurementKind, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name.length === 0 || name.length > 128) {
    res.status(400).json({ message: "Вкажіть назву виду процедури до 128 символів" });
    return;
  }
  const procedureFormatError = directoryNameError(name, false);
  if (procedureFormatError) {
    res.status(400).json({ message: procedureFormatError });
    return;
  }

  let id: number | null = null;
  try {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO procurement_procedures (name_uk)
       VALUES ($1)
       RETURNING id::text AS id`,
      [name],
    );
    id = Number(inserted.rows[0]?.id);
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Вид процедури з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  if (id === null || !Number.isInteger(id)) {
    res.status(500).json({ message: "Не вдалося створити вид процедури" });
    return;
  }

  const fresh = await pool.query<ProcurementProcedureRow>(
    `${managedProcurementProcedureSelect}
     WHERE proc.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(500).json({ message: "Не вдалося створити вид процедури" });
    return;
  }
  res.status(200).json(toManagedProcurementProcedure(row));
});

procurementProceduresRouter.get("/manage", requireAuth, manageProcurementKind, async (_req, res) => {
  const result = await pool.query<ProcurementProcedureRow>(
    `${managedProcurementProcedureSelect}
     ORDER BY proc.name_uk`,
  );
  res.status(200).json(result.rows.map(toManagedProcurementProcedure));
});

procurementProceduresRouter.patch("/:id/active", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readSmallDirectoryId(req.params.id);
  const isActive = req.body?.isActive;
  if (id === null || typeof isActive !== "boolean") {
    res.status(400).json({ message: "Некоректний статус виду процедури" });
    return;
  }

  const result = await pool.query(
    `UPDATE procurement_procedures
     SET is_active = $2
     WHERE id = $1`,
    [id, isActive],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Вид процедури не знайдено" });
    return;
  }

  const fresh = await pool.query<ProcurementProcedureRow>(
    `${managedProcurementProcedureSelect}
     WHERE proc.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Вид процедури не знайдено" });
    return;
  }
  res.status(200).json(toManagedProcurementProcedure(row));
});

procurementProceduresRouter.patch("/:id", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readSmallDirectoryId(req.params.id);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (id === null) {
    res.status(400).json({ message: "Некоректний вид процедури" });
    return;
  }
  if (name.length === 0 || name.length > 128) {
    res.status(400).json({ message: "Вкажіть назву виду процедури до 128 символів" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE procurement_procedures
       SET name_uk = $2
       WHERE id = $1`,
      [id, name],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ message: "Вид процедури не знайдено" });
      return;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Вид процедури з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  const fresh = await pool.query<ProcurementProcedureRow>(
    `${managedProcurementProcedureSelect}
     WHERE proc.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Вид процедури не знайдено" });
    return;
  }
  res.status(200).json(toManagedProcurementProcedure(row));
});

procurementProceduresRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = readSmallDirectoryId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "Некоректний вид процедури" });
    return;
  }

  const current = await pool.query<ProcurementProcedureRow>(
    `${managedProcurementProcedureSelect}
     WHERE proc.id = $1`,
    [id],
  );
  const row = current.rows[0];
  if (!row) {
    res.status(404).json({ message: "Вид процедури не знайдено" });
    return;
  }
  if (!row.can_delete) {
    res.status(409).json({
      message: "Вид процедури не можна видалити, бо він уже використовується",
    });
    return;
  }

  try {
    await pool.query(`DELETE FROM procurement_procedures WHERE id = $1`, [id]);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      res.status(409).json({
        message: "Вид процедури не можна видалити, бо він уже використовується",
      });
      return;
    }
    throw error;
  }

  res.status(200).json({ id: String(id) });
});

type ContractTypeRow = {
  id: string;
  name: string;
  is_active: boolean;
  can_delete: boolean;
};

const managedContractTypeSelect = `
  SELECT
    contract_type.id::text AS id,
    contract_type.name_uk AS name,
    contract_type.is_active,
    NOT EXISTS (
      SELECT 1
      FROM contract_documents document
      WHERE document.contract_type_id = contract_type.id
    ) AS can_delete
  FROM contract_types contract_type
`;

function toManagedContractType(row: ContractTypeRow) {
  return {
    id: row.id,
    name: row.name,
    isActive: row.is_active,
    canDelete: row.can_delete,
  };
}

contractTypesRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT name_uk AS name
     FROM contract_types
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

contractTypesRouter.post("/", requireAuth, manageProcurementKind, async (req, res) => {
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (name.length === 0 || name.length > 128) {
    res.status(400).json({ message: "Вкажіть назву типу ДД до 128 символів" });
    return;
  }
  const contractTypeFormatError = directoryNameError(name, false);
  if (contractTypeFormatError) {
    res.status(400).json({ message: contractTypeFormatError });
    return;
  }

  let id: number | null = null;
  try {
    const inserted = await pool.query<{ id: string }>(
      `INSERT INTO contract_types (name_uk)
       VALUES ($1)
       RETURNING id::text AS id`,
      [name],
    );
    id = Number(inserted.rows[0]?.id);
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Тип ДД з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  if (id === null || !Number.isInteger(id)) {
    res.status(500).json({ message: "Не вдалося створити тип ДД" });
    return;
  }

  const fresh = await pool.query<ContractTypeRow>(
    `${managedContractTypeSelect}
     WHERE contract_type.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(500).json({ message: "Не вдалося створити тип ДД" });
    return;
  }
  res.status(200).json(toManagedContractType(row));
});

contractTypesRouter.get("/manage", requireAuth, manageProcurementKind, async (_req, res) => {
  const result = await pool.query<ContractTypeRow>(
    `${managedContractTypeSelect}
     ORDER BY contract_type.name_uk`,
  );
  res.status(200).json(result.rows.map(toManagedContractType));
});

contractTypesRouter.patch("/:id/active", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  const isActive = req.body?.isActive;
  if (id === null || typeof isActive !== "boolean") {
    res.status(400).json({ message: "Некоректний статус типу ДД" });
    return;
  }

  const result = await pool.query(
    `UPDATE contract_types
     SET is_active = $2
     WHERE id = $1`,
    [id, isActive],
  );
  if (result.rowCount === 0) {
    res.status(404).json({ message: "Тип ДД не знайдено" });
    return;
  }

  const fresh = await pool.query<ContractTypeRow>(
    `${managedContractTypeSelect}
     WHERE contract_type.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Тип ДД не знайдено" });
    return;
  }
  res.status(200).json(toManagedContractType(row));
});

contractTypesRouter.patch("/:id", requireAuth, manageProcurementKind, async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  const name = typeof req.body?.name === "string" ? req.body.name.trim() : "";
  if (id === null) {
    res.status(400).json({ message: "Некоректний тип ДД" });
    return;
  }
  if (name.length === 0 || name.length > 128) {
    res.status(400).json({ message: "Вкажіть назву типу ДД до 128 символів" });
    return;
  }

  try {
    const result = await pool.query(
      `UPDATE contract_types
       SET name_uk = $2
       WHERE id = $1`,
      [id, name],
    );
    if (result.rowCount === 0) {
      res.status(404).json({ message: "Тип ДД не знайдено" });
      return;
    }
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Тип ДД з такою назвою вже існує" });
      return;
    }
    throw error;
  }

  const fresh = await pool.query<ContractTypeRow>(
    `${managedContractTypeSelect}
     WHERE contract_type.id = $1`,
    [id],
  );
  const row = fresh.rows[0];
  if (!row) {
    res.status(404).json({ message: "Тип ДД не знайдено" });
    return;
  }
  res.status(200).json(toManagedContractType(row));
});

contractTypesRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = readProcurementKindId(req.params.id);
  if (id === null) {
    res.status(400).json({ message: "Некоректний тип ДД" });
    return;
  }

  const current = await pool.query<ContractTypeRow>(
    `${managedContractTypeSelect}
     WHERE contract_type.id = $1`,
    [id],
  );
  const row = current.rows[0];
  if (!row) {
    res.status(404).json({ message: "Тип ДД не знайдено" });
    return;
  }
  if (!row.can_delete) {
    res.status(409).json({
      message: "Тип ДД не можна видалити, бо він уже використовується",
    });
    return;
  }

  try {
    await pool.query(`DELETE FROM contract_types WHERE id = $1`, [id]);
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      res.status(409).json({
        message: "Тип ДД не можна видалити, бо він уже використовується",
      });
      return;
    }
    throw error;
  }

  res.status(200).json({ id: String(id) });
});

export {
  contractTypesRouter,
  fundingSourcesRouter,
  ipNkrekpItemsRouter,
  procurementCategoriesRouter,
  procurementKindsRouter,
  procurementProceduresRouter,
};
