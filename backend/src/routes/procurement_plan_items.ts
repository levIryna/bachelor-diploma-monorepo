import { Router, type Request } from "express";
import { resolveDepartmentScope } from "../auth/departmentScope";
import { requireAuth, requireRole } from "../auth/middleware";
import pool from "../db";

type PlanItemRow = {
  id: string;
  year: number;
  line_number: number;
  department: string;
  subject: string;
  expected_cost: string;
  need_type: string;
  status: string;
  buyer: string;
};

type PlanItemDetailRow = {
  year: number;
  line_number: number;
  department: string;
  head_name: string;
  executor_name: string;
  subject: string;
  need_type: string;
  procurement_kind: string;
  category: string;
  funding_source: string;
  ip_item: string;
  event_name: string;
  expected_cost: string;
  completion_date: string;
  counterparty: string;
  planned_tz_submit_date: string;
  planned_contract_date: string;
  planned_work_start_date: string;
  buyer: string;
  status: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const STATUS_BY_LABEL: Record<string, string> = {
  Заплановано: "planned",
  "У підготовці": "in_preparation",
  "Договір укладено": "contract_signed",
  Завершено: "completed",
};

const OPEN_PLAN_YEAR = 2027;

const NEED_TYPE_BY_LABEL: Record<string, string> = {
  Щорічна: "annual",
  Разова: "one_time",
};

const DETAIL_SQL = `SELECT
       p.plan_year AS year,
       p.line_number,
       d.name AS department,
       COALESCE(p.initiator_head_name, '') AS head_name,
       COALESCE(p.executor_name, '') AS executor_name,
       p.subject,
       p.need_type::text AS need_type,
       COALESCE(k.name_uk, '') AS procurement_kind,
       COALESCE(c.name_uk, '') AS category,
       COALESCE(f.name_uk, '') AS funding_source,
       COALESCE(ip.title, '') AS ip_item,
       COALESCE(p.event_name, '') AS event_name,
       p.expected_cost_thousands AS expected_cost,
       COALESCE(to_char(p.prev_contract_end_date, 'YYYY-MM-DD'), '') AS completion_date,
       COALESCE(contractor.name, '') AS counterparty,
       COALESCE(to_char(p.planned_tz_submit_date, 'YYYY-MM-DD'), '') AS planned_tz_submit_date,
       COALESCE(to_char(p.planned_contract_date, 'YYYY-MM-DD'), '') AS planned_contract_date,
       COALESCE(to_char(p.planned_work_start_date, 'YYYY-MM-DD'), '') AS planned_work_start_date,
       COALESCE(buyer.full_name, '') AS buyer,
       p.status::text AS status
     FROM procurement_plan_items p
     JOIN departments d ON d.id = p.department_id
     LEFT JOIN procurement_kinds k ON k.id = p.procurement_kind_id
     LEFT JOIN procurement_categories c ON c.id = p.category_id
     LEFT JOIN funding_sources f ON f.id = p.funding_source_id
     LEFT JOIN ip_nkrekp_items ip ON ip.id = p.ip_nkrekp_item_id
     LEFT JOIN contractors contractor ON contractor.id = p.prev_contractor_id
     LEFT JOIN users buyer ON buyer.id = p.responsible_buyer_id
     WHERE p.id = $1::uuid
       AND ($2::int IS NULL OR p.department_id = $2::int)`;

function planItemId(reqId: string | string[] | undefined): string | null {
  const id = Array.isArray(reqId) ? reqId[0] : reqId;
  if (!id || !UUID_PATTERN.test(id)) {
    return null;
  }
  return id;
}

function mapPlanItemDetail(row: PlanItemDetailRow) {
  return {
    year: Number(row.year),
    lineNumber: Number(row.line_number),
    department: row.department,
    headFullName: row.head_name,
    executorFullName: row.executor_name,
    subject: row.subject,
    needType: row.need_type,
    procurementKind: row.procurement_kind,
    category: row.category,
    fundingSource: row.funding_source,
    ipItem: row.ip_item,
    eventName: row.event_name,
    expectedCost: Number(row.expected_cost),
    completionDate: row.completion_date,
    counterparty: row.counterparty,
    plannedTzSubmitDate: row.planned_tz_submit_date,
    plannedContractDate: row.planned_contract_date,
    plannedWorkStartDate: row.planned_work_start_date,
    buyer: row.buyer,
    status: row.status,
  };
}

async function fetchPlanItemDetail(id: string, departmentId: string | null) {
  const result = await pool.query<PlanItemDetailRow>(DETAIL_SQL, [id, departmentId]);
  const row = result.rows[0];
  return row ? mapPlanItemDetail(row) : null;
}

function readText(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  return typeof value === "string" ? value.trim() : undefined;
}

function isIsoDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

async function lookupOptionalId(
  sql: string,
  name: string,
  notFoundMessage: string,
): Promise<{ ok: true; id: string | number | null } | { ok: false; message: string }> {
  if (!name) {
    return { ok: true, id: null };
  }
  const result = await pool.query<{ id: string | number }>(sql, [name]);
  if (!result.rowCount || !result.rows[0]) {
    return { ok: false, message: notFoundMessage };
  }
  if (result.rowCount > 1) {
    return { ok: false, message: `Знайдено кілька збігів для «${name}»` };
  }
  return { ok: true, id: result.rows[0].id };
}

type PlanItemWrite = {
  departmentId: string | number;
  headFullName: string;
  executorFullName: string;
  subject: string;
  needType: string;
  procurementKindId: string | number | null;
  categoryId: string | number | null;
  fundingSourceId: string | number | null;
  ipItemId: string | number | null;
  eventName: string;
  expectedCost: number;
  completionDate: string;
  contractorId: string | number | null;
  plannedTzSubmitDate: string;
  plannedContractDate: string;
  plannedWorkStartDate: string;
  buyerId: string | number | null;
  status: string;
};

type PlanItemWriteResult =
  | { ok: true; value: PlanItemWrite; departmentScopeId: string | null }
  | { ok: false; status: number; message: string };

async function readPlanItemWrite(
  req: Request,
  record: Record<string, unknown>,
  options?: {
    activeKindOnly?: boolean;
    activeCategoryOnly?: boolean;
    activeFundingOnly?: boolean;
    activeIpOnly?: boolean;
    activeContractorOnly?: boolean;
  },
): Promise<PlanItemWriteResult> {
  const scope = resolveDepartmentScope(req);
  if (!scope.ok) {
    return { ok: false, status: scope.status, message: scope.message };
  }

  const department = readText(record, "department");
  const headFullName = readText(record, "headFullName");
  const executorFullName = readText(record, "executorFullName");
  const subject = readText(record, "subject");
  const needTypeRaw = readText(record, "needType");
  const procurementKind = readText(record, "procurementKind");
  const category = readText(record, "category");
  const fundingSource = readText(record, "fundingSource");
  const ipItem = readText(record, "ipItem");
  const eventName = readText(record, "eventName");
  const completionDate = readText(record, "completionDate");
  const counterparty = readText(record, "counterparty");
  const plannedTzSubmitDate = readText(record, "plannedTzSubmitDate");
  const plannedContractDate = readText(record, "plannedContractDate");
  const plannedWorkStartDate = readText(record, "plannedWorkStartDate");
  const buyer = readText(record, "buyer");
  const statusRaw = readText(record, "status");
  const expectedCost = record.expectedCost;

  if (
    department === undefined ||
    headFullName === undefined ||
    executorFullName === undefined ||
    subject === undefined ||
    needTypeRaw === undefined ||
    procurementKind === undefined ||
    category === undefined ||
    fundingSource === undefined ||
    ipItem === undefined ||
    eventName === undefined ||
    completionDate === undefined ||
    counterparty === undefined ||
    plannedTzSubmitDate === undefined ||
    plannedContractDate === undefined ||
    plannedWorkStartDate === undefined ||
    buyer === undefined ||
    statusRaw === undefined ||
    typeof expectedCost !== "number" ||
    !Number.isFinite(expectedCost) ||
    expectedCost < 0
  ) {
    return { ok: false, status: 400, message: "Некоректні дані" };
  }

  if (!subject) {
    return { ok: false, status: 400, message: "Вкажіть предмет закупівлі" };
  }

  const dates = [completionDate, plannedTzSubmitDate, plannedContractDate, plannedWorkStartDate];
  if (dates.some((value) => value !== "" && !isIsoDate(value))) {
    return { ok: false, status: 400, message: "Некоректна дата" };
  }

  const needType =
    NEED_TYPE_BY_LABEL[needTypeRaw] ??
    (needTypeRaw === "annual" || needTypeRaw === "one_time" ? needTypeRaw : "");
  if (!needType) {
    return { ok: false, status: 400, message: "Некоректна потреба" };
  }

  const status =
    STATUS_BY_LABEL[statusRaw] ??
    (Object.values(STATUS_BY_LABEL).includes(statusRaw) ? statusRaw : "");
  if (!status) {
    return { ok: false, status: 400, message: "Некоректний статус" };
  }

  const departmentLookup = await lookupOptionalId(
    `SELECT id FROM departments WHERE name = $1`,
    department,
    "Підрозділ не знайдено",
  );
  if (!departmentLookup.ok || departmentLookup.id === null) {
    return {
      ok: false,
      status: 400,
      message: departmentLookup.ok ? "Підрозділ не знайдено" : departmentLookup.message,
    };
  }
  if (scope.departmentId && String(departmentLookup.id) !== scope.departmentId) {
    return { ok: false, status: 403, message: "Неможливо змінити підрозділ" };
  }

  const kindLookup = await lookupOptionalId(
    options?.activeKindOnly
      ? `SELECT id FROM procurement_kinds WHERE name_uk = $1 AND is_active = true`
      : `SELECT id FROM procurement_kinds WHERE name_uk = $1`,
    procurementKind,
    options?.activeKindOnly
      ? "Вид закупівлі не знайдено або він пасивний"
      : "Вид закупівлі не знайдено",
  );
  if (!kindLookup.ok) {
    return { ok: false, status: 400, message: kindLookup.message };
  }

  const categoryLookup = await lookupOptionalId(
    options?.activeCategoryOnly
      ? `SELECT id FROM procurement_categories WHERE name_uk = $1 AND is_active = true`
      : `SELECT id FROM procurement_categories WHERE name_uk = $1`,
    category,
    options?.activeCategoryOnly
      ? "Категорію не знайдено або вона пасивна"
      : "Категорію не знайдено",
  );
  if (!categoryLookup.ok) {
    return { ok: false, status: 400, message: categoryLookup.message };
  }

  const fundingLookup = await lookupOptionalId(
    options?.activeFundingOnly
      ? `SELECT id FROM funding_sources WHERE name_uk = $1 AND is_active = true`
      : `SELECT id FROM funding_sources WHERE name_uk = $1`,
    fundingSource,
    options?.activeFundingOnly
      ? "Джерело фінансування не знайдено або воно пасивне"
      : "Джерело фінансування не знайдено",
  );
  if (!fundingLookup.ok) {
    return { ok: false, status: 400, message: fundingLookup.message };
  }

  const ipLookup = await lookupOptionalId(
    options?.activeIpOnly
      ? `SELECT id FROM ip_nkrekp_items WHERE title = $1 AND is_active = true`
      : `SELECT id FROM ip_nkrekp_items WHERE title = $1`,
    ipItem,
    options?.activeIpOnly
      ? "Пункт ІП НКРЕКП не знайдено або він пасивний"
      : "Пункт ІП НКРЕКП не знайдено",
  );
  if (!ipLookup.ok) {
    return { ok: false, status: 400, message: ipLookup.message };
  }

  const contractorLookup = await lookupOptionalId(
    options?.activeContractorOnly
      ? `SELECT id::text AS id FROM contractors WHERE name = $1 AND is_active = true`
      : `SELECT id::text AS id FROM contractors WHERE name = $1`,
    counterparty,
    options?.activeContractorOnly
      ? "Контрагента не знайдено або він пасивний"
      : "Контрагента не знайдено",
  );
  if (!contractorLookup.ok) {
    return { ok: false, status: 400, message: contractorLookup.message };
  }

  const buyerLookup = await lookupOptionalId(
    `SELECT id::text AS id FROM users WHERE full_name = $1`,
    buyer,
    "Закупника не знайдено",
  );
  if (!buyerLookup.ok) {
    return { ok: false, status: 400, message: buyerLookup.message };
  }

  return {
    ok: true,
    departmentScopeId: scope.departmentId,
    value: {
      departmentId: departmentLookup.id,
      headFullName,
      executorFullName,
      subject,
      needType,
      procurementKindId: kindLookup.id,
      categoryId: categoryLookup.id,
      fundingSourceId: fundingLookup.id,
      ipItemId: ipLookup.id,
      eventName,
      expectedCost,
      completionDate,
      contractorId: contractorLookup.id,
      plannedTzSubmitDate,
      plannedContractDate,
      plannedWorkStartDate,
      buyerId: buyerLookup.id,
      status,
    },
  };
}

const procurementPlanItemsRouter = Router();

procurementPlanItemsRouter.get("/", requireAuth, async (req, res) => {
  const year = Number(req.query.year);

  if (!Number.isInteger(year) || year < 1) {
    res.status(400).json({ message: "year must be a positive integer" });
    return;
  }

  const scope = resolveDepartmentScope(req);
  if (!scope.ok) {
    res.status(scope.status).json({ message: scope.message });
    return;
  }

  const rawStatus = req.query.status;
  let status: string | null = null;
  if (rawStatus !== undefined && rawStatus !== "") {
    if (typeof rawStatus !== "string") {
      res.status(400).json({ message: "Некоректний статус" });
      return;
    }

    const knownStatus = await pool.query(
      `SELECT 1
       FROM pg_enum e
       JOIN pg_type t ON e.enumtypid = t.oid
       WHERE t.typname = 'procurement_status_enum'
         AND e.enumlabel = $1`,
      [rawStatus],
    );
    if (!knownStatus.rowCount) {
      res.status(400).json({ message: "Некоректний статус" });
      return;
    }
    status = rawStatus;
  }

  const result = await pool.query<PlanItemRow>(
    `SELECT
       p.id::text AS id,
       p.plan_year AS year,
       p.line_number,
       d.name AS department,
       p.subject,
       p.expected_cost_thousands AS expected_cost,
       p.need_type::text AS need_type,
       p.status::text AS status,
       COALESCE(u.full_name, '') AS buyer
     FROM procurement_plan_items p
     JOIN departments d ON d.id = p.department_id
     LEFT JOIN users u ON u.id = p.responsible_buyer_id
     WHERE p.plan_year = $1
       AND ($2::int IS NULL OR p.department_id = $2::int)
       AND ($3::text IS NULL OR p.status::text = $3)
     ORDER BY p.line_number`,
    [year, scope.departmentId, status],
  );

  res.status(200).json(
    result.rows.map((row) => ({
      id: row.id,
      year: Number(row.year),
      lineNumber: Number(row.line_number),
      department: row.department,
      subject: row.subject,
      expectedCost: Number(row.expected_cost),
      needType: row.need_type,
      status: row.status,
      buyer: row.buyer,
    })),
  );
});

procurementPlanItemsRouter.get("/:id", requireAuth, async (req, res) => {
  const id = planItemId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний ідентифікатор пункту РПЗ" });
    return;
  }

  const scope = resolveDepartmentScope(req);
  if (!scope.ok) {
    res.status(scope.status).json({ message: scope.message });
    return;
  }

  const item = await fetchPlanItemDetail(id, scope.departmentId);
  if (!item) {
    res.status(404).json({ message: "Пункт РПЗ не знайдено" });
    return;
  }

  res.status(200).json(item);
});

procurementPlanItemsRouter.get("/:id/contract_documents", requireAuth, async (req, res) => {
  const id = planItemId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний ідентифікатор пункту РПЗ" });
    return;
  }

  const scope = resolveDepartmentScope(req);
  if (!scope.ok) {
    res.status(scope.status).json({ message: scope.message });
    return;
  }

  const item = await fetchPlanItemDetail(id, scope.departmentId);
  if (!item) {
    res.status(404).json({ message: "Пункт РПЗ не знайдено" });
    return;
  }

  const result = await pool.query<{
    id: string;
    seq_number: number | null;
    subject: string;
    contract_date: string;
    contractor: string;
  }>(
    `SELECT
       cd.id::text AS id,
       cd.seq_number,
       cd.subject,
       COALESCE(to_char(cd.contract_date, 'YYYY-MM-DD'), '') AS contract_date,
       COALESCE(contractor.name, '') AS contractor
     FROM contract_documents cd
     LEFT JOIN contractors contractor ON contractor.id = cd.contractor_id
     WHERE cd.plan_item_id = $1::uuid
     ORDER BY cd.seq_number NULLS LAST, cd.contract_date NULLS LAST, cd.subject`,
    [id],
  );

  res.status(200).json(
    result.rows.map((row) => ({
      id: row.id,
      seqNumber: row.seq_number === null ? null : Number(row.seq_number),
      subject: row.subject,
      contractDate: row.contract_date,
      contractor: row.contractor,
    })),
  );
});

procurementPlanItemsRouter.post("/", requireAuth, async (req, res) => {
  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ message: "Некоректні дані" });
    return;
  }

  const record = body as Record<string, unknown>;
  if (record.year !== OPEN_PLAN_YEAR) {
    res.status(400).json({ message: "Новий пункт можна створити лише для 2027 року" });
    return;
  }

  const parsed = await readPlanItemWrite(req, record, {
    activeKindOnly: true,
    activeCategoryOnly: true,
    activeFundingOnly: true,
    activeIpOnly: true,
    activeContractorOnly: true,
  });
  if (!parsed.ok) {
    res.status(parsed.status).json({ message: parsed.message });
    return;
  }

  const createdBy = req.user?.sub;
  if (!createdBy) {
    res.status(401).json({ message: "Потрібна авторизація" });
    return;
  }

  try {
    const id = await insertPlanItem(OPEN_PLAN_YEAR, parsed.value, createdBy);
    res.status(201).json({ id });
  } catch (error) {
    if (isUniqueViolation(error)) {
      res.status(409).json({ message: "Не вдалося зберегти пункт РПЗ. Спробуйте ще раз." });
      return;
    }
    throw error;
  }
});

procurementPlanItemsRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = planItemId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний ідентифікатор пункту РПЗ" });
    return;
  }

  const body = req.body;
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    res.status(400).json({ message: "Некоректні дані" });
    return;
  }

  const parsed = await readPlanItemWrite(req, body as Record<string, unknown>);
  if (!parsed.ok) {
    res.status(parsed.status).json({ message: parsed.message });
    return;
  }
  const write = parsed.value;

  const current = await pool.query<{ status: string }>(
    `SELECT status::text AS status
     FROM procurement_plan_items
     WHERE id = $1::uuid
       AND ($2::int IS NULL OR department_id = $2::int)`,
    [id, parsed.departmentScopeId],
  );
  if (!current.rowCount) {
    res.status(404).json({ message: "Пункт РПЗ не знайдено" });
    return;
  }
  if (current.rows[0]?.status === "completed" && req.user?.role !== "admin") {
    res.status(403).json({
      message: "Завершену закупівлю може редагувати лише адміністратор",
    });
    return;
  }

  const updated = await pool.query(
    `UPDATE procurement_plan_items
     SET department_id = $2,
         initiator_head_name = NULLIF($3, ''),
         executor_name = NULLIF($4, ''),
         subject = $5,
         need_type = $6::need_type_enum,
         procurement_kind_id = $7,
         category_id = $8,
         funding_source_id = $9,
         ip_nkrekp_item_id = $10,
         event_name = NULLIF($11, ''),
         expected_cost_thousands = $12,
         prev_contract_end_date = NULLIF($13, '')::date,
         prev_contractor_id = $14,
         planned_tz_submit_date = NULLIF($15, '')::date,
         planned_contract_date = NULLIF($16, '')::date,
         planned_work_start_date = NULLIF($17, '')::date,
         responsible_buyer_id = $18,
         status = $19::procurement_status_enum,
         updated_at = now()
     WHERE id = $1::uuid
       AND ($20::int IS NULL OR department_id = $20::int)`,
    [
      id,
      write.departmentId,
      write.headFullName,
      write.executorFullName,
      write.subject,
      write.needType,
      write.procurementKindId,
      write.categoryId,
      write.fundingSourceId,
      write.ipItemId,
      write.eventName,
      write.expectedCost,
      write.completionDate,
      write.contractorId,
      write.plannedTzSubmitDate,
      write.plannedContractDate,
      write.plannedWorkStartDate,
      write.buyerId,
      write.status,
      parsed.departmentScopeId,
    ],
  );

  if (!updated.rowCount) {
    res.status(404).json({ message: "Пункт РПЗ не знайдено" });
    return;
  }

  const item = await fetchPlanItemDetail(id, parsed.departmentScopeId);
  if (!item) {
    res.status(404).json({ message: "Пункт РПЗ не знайдено" });
    return;
  }

  res.status(200).json(item);
});

procurementPlanItemsRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = planItemId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний ідентифікатор пункту РПЗ" });
    return;
  }

  const existing = await pool.query(`SELECT 1 FROM procurement_plan_items WHERE id = $1::uuid`, [id]);
  if (!existing.rowCount) {
    res.status(404).json({ message: "Пункт РПЗ не знайдено" });
    return;
  }

  const linked = await pool.query(
    `SELECT 1 FROM contract_documents WHERE plan_item_id = $1::uuid LIMIT 1`,
    [id],
  );
  if (linked.rowCount) {
    res.status(409).json({
      message: "Неможливо видалити пункт РПЗ: до нього прив’язані договірні документи",
    });
    return;
  }

  try {
    const deleted = await pool.query(`DELETE FROM procurement_plan_items WHERE id = $1::uuid`, [id]);
    if (!deleted.rowCount) {
      res.status(404).json({ message: "Пункт РПЗ не знайдено" });
      return;
    }
  } catch (error) {
    if (isForeignKeyViolation(error)) {
      res.status(409).json({
        message: "Неможливо видалити пункт РПЗ: до нього прив’язані договірні документи",
      });
      return;
    }
    throw error;
  }

  res.status(200).json({ ok: true });
});

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23503";
}

function isUniqueViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23505";
}

async function insertPlanItem(year: number, write: PlanItemWrite, createdBy: string): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1::int, $2::int)", [742001, year]);
    const next = await client.query<{ line_number: number }>(
      `SELECT COALESCE(MAX(line_number), 0) + 1 AS line_number
       FROM procurement_plan_items
       WHERE plan_year = $1`,
      [year],
    );
    const lineNumber = Number(next.rows[0]?.line_number);
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO procurement_plan_items (
         plan_year,
         line_number,
         department_id,
         initiator_head_name,
         executor_name,
         subject,
         need_type,
         procurement_kind_id,
         category_id,
         funding_source_id,
         ip_nkrekp_item_id,
         event_name,
         expected_cost_thousands,
         prev_contract_end_date,
         prev_contractor_id,
         planned_tz_submit_date,
         planned_contract_date,
         planned_work_start_date,
         responsible_buyer_id,
         status,
         created_by
       ) VALUES (
         $1, $2, $3, NULLIF($4, ''), NULLIF($5, ''),
         $6, $7::need_type_enum, $8, $9, $10,
         $11, NULLIF($12, ''), $13, NULLIF($14, '')::date,
         $15, NULLIF($16, '')::date, NULLIF($17, '')::date, NULLIF($18, '')::date,
         $19, $20::procurement_status_enum, $21::uuid
       )
       RETURNING id::text AS id`,
      [
        year,
        lineNumber,
        write.departmentId,
        write.headFullName,
        write.executorFullName,
        write.subject,
        write.needType,
        write.procurementKindId,
        write.categoryId,
        write.fundingSourceId,
        write.ipItemId,
        write.eventName,
        write.expectedCost,
        write.completionDate,
        write.contractorId,
        write.plannedTzSubmitDate,
        write.plannedContractDate,
        write.plannedWorkStartDate,
        write.buyerId,
        write.status,
        createdBy,
      ],
    );
    const id = inserted.rows[0]?.id;
    if (!id) {
      throw new Error("Пункт РПЗ не створено");
    }
    await client.query("COMMIT");
    return id;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default procurementPlanItemsRouter;
