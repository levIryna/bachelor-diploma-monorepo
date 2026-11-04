import { Router, type Request } from "express";
import { resolveDepartmentScope } from "../auth/departmentScope";
import { requireAuth, requireRole } from "../auth/middleware";
import pool from "../db";

type ContractDocumentRow = {
  id: string;
  seq_number: number | null;
  year: number;
  line_number: number;
  subject: string;
  procedure: string;
  contractor: string;
  amount: string | null;
  contract_date: string;
};

type ContractDocumentDetailRow = {
  seq_number: number | null;
  year: number;
  line_number: number;
  subject: string;
  expected_cost: string | null;
  procedure: string;
  department: string;
  tz_responsible_name: string;
  technical_expert_name: string;
  estimator_name: string;
  buyer_name: string;
  actual_application_date: string;
  procedure_number: string;
  etm_url: string;
  contractor: string;
  contract_subject: string;
  amount: string | null;
  contract_date: string;
  contract_type: string;
  valid_from: string;
  valid_to: string;
  notes: string;
};

type ContractAmendmentRow = {
  amended_at: string;
  description: string;
};

type ContractDocumentWrite = {
  subject: string;
  expectedCostThousands: number | null;
  procedureId: string | number;
  departmentId: string | number;
  tzResponsibleName: string;
  technicalExpertName: string;
  estimatorName: string;
  buyerName: string;
  actualApplicationDate: string;
  procedureNumber: string;
  etmUrl: string;
  contractorId: string | null;
  contractSubject: string;
  contractAmountThousands: number | null;
  contractDate: string;
  contractTypeId: string | number | null;
  validFrom: string;
  validTo: string;
  notes: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const DETAIL_SQL = `SELECT
       cd.seq_number,
       p.plan_year AS year,
       p.line_number,
       cd.subject,
       cd.expected_cost_application_thousands::text AS expected_cost,
       proc.name_uk AS procedure,
       dep.name AS department,
       COALESCE(cd.tz_responsible_name, '') AS tz_responsible_name,
       COALESCE(cd.technical_expert_name, '') AS technical_expert_name,
       COALESCE(cd.estimator_name, '') AS estimator_name,
       COALESCE(cd.buyer_name, '') AS buyer_name,
       COALESCE(to_char(cd.actual_application_date, 'YYYY-MM-DD'), '') AS actual_application_date,
       COALESCE(cd.procedure_number, '') AS procedure_number,
       COALESCE(cd.etm_url, '') AS etm_url,
       COALESCE(contractor.name, '') AS contractor,
       COALESCE(cd.contract_subject, '') AS contract_subject,
       cd.contract_amount_uah::text AS amount,
       COALESCE(to_char(cd.contract_date, 'YYYY-MM-DD'), '') AS contract_date,
       COALESCE(ct.name_uk, '') AS contract_type,
       COALESCE(to_char(cd.valid_from, 'YYYY-MM-DD'), '') AS valid_from,
       COALESCE(to_char(cd.valid_to, 'YYYY-MM-DD'), '') AS valid_to,
       COALESCE(cd.notes, '') AS notes
     FROM contract_documents cd
     JOIN procurement_plan_items p ON p.id = cd.plan_item_id
     JOIN procurement_procedures proc ON proc.id = cd.procedure_id
     JOIN departments dep ON dep.id = cd.initiator_department_id
     LEFT JOIN contractors contractor ON contractor.id = cd.contractor_id
     LEFT JOIN contract_types ct ON ct.id = cd.contract_type_id
     WHERE cd.id = $1::uuid
       AND ($2::int IS NULL OR cd.initiator_department_id = $2::int)`;

const contractDocumentsRouter = Router();

contractDocumentsRouter.get("/", requireAuth, async (req, res) => {
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

  const result = await pool.query<ContractDocumentRow>(
    `SELECT
       cd.id::text AS id,
       cd.seq_number,
       p.plan_year AS year,
       p.line_number,
       cd.subject,
       proc.name_uk AS procedure,
       COALESCE(contractor.name, '') AS contractor,
       cd.contract_amount_uah::text AS amount,
       COALESCE(to_char(cd.contract_date, 'YYYY-MM-DD'), '') AS contract_date
     FROM contract_documents cd
     JOIN procurement_plan_items p ON p.id = cd.plan_item_id
     JOIN procurement_procedures proc ON proc.id = cd.procedure_id
     LEFT JOIN contractors contractor ON contractor.id = cd.contractor_id
     WHERE p.plan_year = $1
       AND ($2::int IS NULL OR cd.initiator_department_id = $2::int)
     ORDER BY cd.seq_number NULLS LAST, cd.contract_date NULLS LAST, cd.subject`,
    [year, scope.departmentId],
  );

  res.status(200).json(
    result.rows.map((row) => ({
      id: row.id,
      number: row.seq_number === null ? null : Number(row.seq_number),
      year: Number(row.year),
      item: Number(row.line_number),
      subject: row.subject,
      procedure: row.procedure,
      counterparty: row.contractor,
      amount: row.amount === null ? null : Number(row.amount),
      date: row.contract_date,
    })),
  );
});

function documentId(reqId: string | string[] | undefined): string | null {
  const id = Array.isArray(reqId) ? reqId[0] : reqId;
  if (!id || !UUID_PATTERN.test(id)) {
    return null;
  }
  return id;
}

function mapDetail(row: ContractDocumentDetailRow, amendments: ContractAmendmentRow[]) {
  return {
    seqNumber: row.seq_number === null ? null : Number(row.seq_number),
    year: Number(row.year),
    lineNumber: Number(row.line_number),
    subject: row.subject,
    expectedCostThousands: row.expected_cost === null ? null : Number(row.expected_cost),
    procedure: row.procedure,
    department: row.department,
    tzResponsibleName: row.tz_responsible_name,
    technicalExpertName: row.technical_expert_name,
    estimatorName: row.estimator_name,
    buyerName: row.buyer_name,
    actualApplicationDate: row.actual_application_date,
    procedureNumber: row.procedure_number,
    etmUrl: row.etm_url,
    contractor: row.contractor,
    contractSubject: row.contract_subject,
    contractAmountThousands: row.amount === null ? null : Number(row.amount),
    contractDate: row.contract_date,
    contractType: row.contract_type,
    validFrom: row.valid_from,
    validTo: row.valid_to,
    notes: row.notes,
    amendments: amendments.map((entry) => ({
      date: entry.amended_at,
      description: entry.description,
    })),
  };
}

async function fetchContractDocument(id: string, departmentId: string | null) {
  const result = await pool.query<ContractDocumentDetailRow>(DETAIL_SQL, [id, departmentId]);
  const row = result.rows[0];
  if (!row) {
    return null;
  }

  const amendments = await pool.query<ContractAmendmentRow>(
    `SELECT to_char(amended_at, 'YYYY-MM-DD') AS amended_at, description
     FROM contract_amendments
     WHERE contract_id = $1::uuid
     ORDER BY amended_at, description`,
    [id],
  );

  return mapDetail(row, amendments.rows);
}

function readText(body: Record<string, unknown>, key: string): string | undefined {
  const value = body[key];
  return typeof value === "string" ? value.trim() : undefined;
}

function readOptionalNumber(value: unknown): number | null | undefined {
  if (value === null) {
    return null;
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  return undefined;
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

function tooLong(value: string, limit: number): boolean {
  return value.length > limit;
}

async function readContractDocumentWrite(
  req: Request,
  record: Record<string, unknown>,
): Promise<
  | { ok: true; value: ContractDocumentWrite; departmentScopeId: string | null }
  | { ok: false; status: number; message: string }
> {
  const scope = resolveDepartmentScope(req);
  if (!scope.ok) {
    return { ok: false, status: scope.status, message: scope.message };
  }

  const subject = readText(record, "subject");
  const procedure = readText(record, "procedure");
  const department = readText(record, "department");
  const tzResponsibleName = readText(record, "tzResponsibleName");
  const technicalExpertName = readText(record, "technicalExpertName");
  const estimatorName = readText(record, "estimatorName");
  const buyerName = readText(record, "buyerName");
  const actualApplicationDate = readText(record, "actualApplicationDate");
  const procedureNumber = readText(record, "procedureNumber");
  const etmUrl = readText(record, "etmUrl");
  const contractor = readText(record, "contractor");
  const contractSubject = readText(record, "contractSubject");
  const contractDate = readText(record, "contractDate");
  const contractType = readText(record, "contractType");
  const validFrom = readText(record, "validFrom");
  const validTo = readText(record, "validTo");
  const notes = readText(record, "notes");
  const expectedCostThousands = readOptionalNumber(record.expectedCostThousands);
  const contractAmountThousands = readOptionalNumber(record.contractAmountThousands);

  if (
    subject === undefined ||
    procedure === undefined ||
    department === undefined ||
    tzResponsibleName === undefined ||
    technicalExpertName === undefined ||
    estimatorName === undefined ||
    buyerName === undefined ||
    actualApplicationDate === undefined ||
    procedureNumber === undefined ||
    etmUrl === undefined ||
    contractor === undefined ||
    contractSubject === undefined ||
    contractDate === undefined ||
    contractType === undefined ||
    validFrom === undefined ||
    validTo === undefined ||
    notes === undefined ||
    expectedCostThousands === undefined ||
    contractAmountThousands === undefined
  ) {
    return { ok: false, status: 400, message: "Некоректні дані" };
  }

  if (!subject) {
    return { ok: false, status: 400, message: "Вкажіть предмет закупівлі" };
  }
  if (!procedure) {
    return { ok: false, status: 400, message: "Оберіть вид процедури" };
  }
  if (!department) {
    return { ok: false, status: 400, message: "Оберіть підрозділ ініціатора" };
  }
  if (
    (expectedCostThousands !== null && expectedCostThousands < 0) ||
    (contractAmountThousands !== null && contractAmountThousands < 0)
  ) {
    return { ok: false, status: 400, message: "Сума не може бути від'ємною" };
  }

  const dates = [actualApplicationDate, contractDate, validFrom, validTo];
  if (dates.some((value) => value !== "" && !isIsoDate(value))) {
    return { ok: false, status: 400, message: "Некоректна дата" };
  }
  if (validFrom && validTo && validFrom > validTo) {
    return { ok: false, status: 400, message: "Початок дії не може бути пізніше за кінець" };
  }
  if (
    tooLong(tzResponsibleName, 255) ||
    tooLong(technicalExpertName, 255) ||
    tooLong(estimatorName, 255) ||
    tooLong(buyerName, 255) ||
    tooLong(procedureNumber, 64) ||
    tooLong(etmUrl, 1024)
  ) {
    return { ok: false, status: 400, message: "Занадто довге значення" };
  }

  const procedureLookup = await lookupOptionalId(
    `SELECT id FROM procurement_procedures WHERE name_uk = $1`,
    procedure,
    "Вид процедури не знайдено",
  );
  if (!procedureLookup.ok || procedureLookup.id === null) {
    return {
      ok: false,
      status: 400,
      message: procedureLookup.ok ? "Вид процедури не знайдено" : procedureLookup.message,
    };
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

  const contractorLookup = await lookupOptionalId(
    `SELECT id::text AS id FROM contractors WHERE name = $1`,
    contractor,
    "Контрагента не знайдено",
  );
  if (!contractorLookup.ok) {
    return { ok: false, status: 400, message: contractorLookup.message };
  }

  const contractTypeLookup = await lookupOptionalId(
    `SELECT id FROM contract_types WHERE name_uk = $1`,
    contractType,
    "Тип договору не знайдено",
  );
  if (!contractTypeLookup.ok) {
    return { ok: false, status: 400, message: contractTypeLookup.message };
  }

  return {
    ok: true,
    departmentScopeId: scope.departmentId,
    value: {
      subject,
      expectedCostThousands,
      procedureId: procedureLookup.id,
      departmentId: departmentLookup.id,
      tzResponsibleName,
      technicalExpertName,
      estimatorName,
      buyerName,
      actualApplicationDate,
      procedureNumber,
      etmUrl,
      contractorId: contractorLookup.id === null ? null : String(contractorLookup.id),
      contractSubject,
      contractAmountThousands,
      contractDate,
      contractTypeId: contractTypeLookup.id,
      validFrom,
      validTo,
      notes,
    },
  };
}

const ITEM_TYPES = new Set(["goods", "service", "work"]);

async function insertContractDocument(
  planItemId: string,
  itemType: string,
  write: ContractDocumentWrite,
  createdBy: string,
): Promise<string> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("SELECT pg_advisory_xact_lock($1::int)", [742002]);
    const next = await client.query<{ seq_number: number }>(
      `SELECT COALESCE(MAX(seq_number), 0) + 1 AS seq_number
       FROM contract_documents`,
    );
    const seqNumber = Number(next.rows[0]?.seq_number);
    const inserted = await client.query<{ id: string }>(
      `INSERT INTO contract_documents (
         seq_number,
         plan_item_id,
         subject,
         item_type,
         expected_cost_application_thousands,
         procedure_id,
         initiator_department_id,
         tz_responsible_name,
         technical_expert_name,
         estimator_name,
         buyer_name,
         actual_application_date,
         procedure_number,
         etm_url,
         contractor_id,
         contract_subject,
         contract_amount_uah,
         contract_date,
         contract_type_id,
         valid_from,
         valid_to,
         notes,
         created_by
       ) VALUES (
         $1, $2::uuid, $3, $4::item_type_enum, $5,
         $6, $7, NULLIF($8, ''), NULLIF($9, ''), NULLIF($10, ''), NULLIF($11, ''),
         NULLIF($12, '')::date, NULLIF($13, ''), NULLIF($14, ''), $15::uuid,
         NULLIF($16, ''), $17, NULLIF($18, '')::date, $19,
         NULLIF($20, '')::date, NULLIF($21, '')::date, NULLIF($22, ''), $23::uuid
       )
       RETURNING id::text AS id`,
      [
        seqNumber,
        planItemId,
        write.subject,
        itemType,
        write.expectedCostThousands,
        write.procedureId,
        write.departmentId,
        write.tzResponsibleName,
        write.technicalExpertName,
        write.estimatorName,
        write.buyerName,
        write.actualApplicationDate,
        write.procedureNumber,
        write.etmUrl,
        write.contractorId,
        write.contractSubject,
        write.contractAmountThousands,
        write.contractDate,
        write.contractTypeId,
        write.validFrom,
        write.validTo,
        write.notes,
        createdBy,
      ],
    );
    const id = inserted.rows[0]?.id;
    if (!id) {
      throw new Error("Договірний документ не створено");
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

contractDocumentsRouter.post("/", requireAuth, async (req, res) => {
  const record = req.body;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    res.status(400).json({ message: "Некоректні дані" });
    return;
  }

  const body = record as Record<string, unknown>;
  const planItemId = readText(body, "planItemId");
  const itemType = readText(body, "itemType");
  if (!planItemId || !UUID_PATTERN.test(planItemId)) {
    res.status(400).json({ message: "Некоректний пункт РПЗ" });
    return;
  }
  if (!itemType || !ITEM_TYPES.has(itemType)) {
    res.status(400).json({ message: "Оберіть тип предмета" });
    return;
  }

  const parsed = await readContractDocumentWrite(req, body);
  if (!parsed.ok) {
    res.status(parsed.status).json({ message: parsed.message });
    return;
  }

  const createdBy = req.user?.sub;
  if (!createdBy) {
    res.status(401).json({ message: "Потрібна авторизація" });
    return;
  }

  const planItem = await pool.query<{ status: string }>(
    `SELECT status::text AS status
     FROM procurement_plan_items
     WHERE id = $1::uuid
       AND ($2::int IS NULL OR department_id = $2::int)`,
    [planItemId, parsed.departmentScopeId],
  );
  const planStatus = planItem.rows[0]?.status;
  if (!planStatus) {
    res.status(404).json({ message: "Пункт РПЗ не знайдено" });
    return;
  }
  if (planStatus === "completed") {
    res.status(400).json({ message: "До завершеної закупівлі не можна додати договір" });
    return;
  }

  const missing = incompleteCreateMessage(parsed.value);
  if (missing) {
    res.status(400).json({ message: missing });
    return;
  }

  const id = await insertContractDocument(planItemId, itemType, parsed.value, createdBy);
  res.status(201).json({ id });
});

contractDocumentsRouter.get("/:id", requireAuth, async (req, res) => {
  const id = documentId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний ідентифікатор" });
    return;
  }

  const scope = resolveDepartmentScope(req);
  if (!scope.ok) {
    res.status(scope.status).json({ message: scope.message });
    return;
  }

  const document = await fetchContractDocument(id, scope.departmentId);
  if (!document) {
    res.status(404).json({ message: "Договірний документ не знайдено" });
    return;
  }

  res.status(200).json(document);
});

contractDocumentsRouter.patch("/:id", requireAuth, async (req, res) => {
  const id = documentId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний ідентифікатор" });
    return;
  }

  const record = req.body;
  if (!record || typeof record !== "object" || Array.isArray(record)) {
    res.status(400).json({ message: "Некоректні дані" });
    return;
  }

  const parsed = await readContractDocumentWrite(req, record as Record<string, unknown>);
  if (!parsed.ok) {
    res.status(parsed.status).json({ message: parsed.message });
    return;
  }

  const write = parsed.value;
  const updated = await pool.query(
    `UPDATE contract_documents
     SET subject = $2,
         expected_cost_application_thousands = $3,
         procedure_id = $4,
         initiator_department_id = $5,
         tz_responsible_name = NULLIF($6, ''),
         technical_expert_name = NULLIF($7, ''),
         estimator_name = NULLIF($8, ''),
         buyer_name = NULLIF($9, ''),
         actual_application_date = NULLIF($10, '')::date,
         procedure_number = NULLIF($11, ''),
         etm_url = NULLIF($12, ''),
         contractor_id = $13::uuid,
         contract_subject = NULLIF($14, ''),
         contract_amount_uah = $15,
         contract_date = NULLIF($16, '')::date,
         contract_type_id = $17,
         valid_from = NULLIF($18, '')::date,
         valid_to = NULLIF($19, '')::date,
         notes = NULLIF($20, ''),
         updated_at = now()
     WHERE id = $1::uuid
       AND ($21::int IS NULL OR initiator_department_id = $21::int)`,
    [
      id,
      write.subject,
      write.expectedCostThousands,
      write.procedureId,
      write.departmentId,
      write.tzResponsibleName,
      write.technicalExpertName,
      write.estimatorName,
      write.buyerName,
      write.actualApplicationDate,
      write.procedureNumber,
      write.etmUrl,
      write.contractorId,
      write.contractSubject,
      write.contractAmountThousands,
      write.contractDate,
      write.contractTypeId,
      write.validFrom,
      write.validTo,
      write.notes,
      parsed.departmentScopeId,
    ],
  );

  if (!updated.rowCount) {
    res.status(404).json({ message: "Договірний документ не знайдено" });
    return;
  }

  const document = await fetchContractDocument(id, parsed.departmentScopeId);
  if (!document) {
    res.status(404).json({ message: "Договірний документ не знайдено" });
    return;
  }

  res.status(200).json(document);
});

function incompleteCreateMessage(write: ContractDocumentWrite): string {
  if (write.expectedCostThousands === null) {
    return "Вкажіть очікувану вартість";
  }
  if (!write.tzResponsibleName) {
    return "Вкажіть ПІБ відповідального за ТЗ";
  }
  if (!write.technicalExpertName) {
    return "Вкажіть ПІБ технічного експерта";
  }
  if (!write.estimatorName) {
    return "Вкажіть ПІБ кошторисника";
  }
  if (!write.buyerName) {
    return "Вкажіть ПІБ закупника";
  }
  if (!write.actualApplicationDate) {
    return "Вкажіть фактичний термін надання заявки";
  }
  if (!write.procedureNumber) {
    return "Вкажіть номер процедури";
  }
  if (!write.etmUrl) {
    return "Вкажіть посилання ЕТМ";
  }
  if (!write.contractorId) {
    return "Оберіть контрагента";
  }
  if (!write.contractSubject) {
    return "Вкажіть предмет договору";
  }
  if (write.contractAmountThousands === null) {
    return "Вкажіть суму договору";
  }
  if (!write.contractDate) {
    return "Вкажіть дату укладання";
  }
  if (write.contractTypeId === null) {
    return "Оберіть тип договору";
  }
  if (!write.validFrom) {
    return "Вкажіть початок дії";
  }
  if (!write.validTo) {
    return "Вкажіть кінець дії";
  }
  if (!write.notes) {
    return "Вкажіть примітки";
  }
  return "";
}

function isForeignKeyViolation(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "23503";
}

contractDocumentsRouter.delete("/:id", requireAuth, requireRole("admin"), async (req, res) => {
  const id = documentId(req.params.id);
  if (!id) {
    res.status(400).json({ message: "Некоректний ідентифікатор" });
    return;
  }

  const existing = await pool.query(`SELECT 1 FROM contract_documents WHERE id = $1::uuid`, [id]);
  if (!existing.rowCount) {
    res.status(404).json({ message: "Договірний документ не знайдено" });
    return;
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM contract_amendments WHERE contract_id = $1::uuid`, [id]);
    const deleted = await client.query(`DELETE FROM contract_documents WHERE id = $1::uuid`, [id]);
    if (!deleted.rowCount) {
      await client.query("ROLLBACK");
      res.status(404).json({ message: "Договірний документ не знайдено" });
      return;
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    if (isForeignKeyViolation(error)) {
      res.status(409).json({ message: "Неможливо видалити договір: на нього є посилання" });
      return;
    }
    throw error;
  } finally {
    client.release();
  }

  res.status(200).json({ ok: true });
});

export default contractDocumentsRouter;
