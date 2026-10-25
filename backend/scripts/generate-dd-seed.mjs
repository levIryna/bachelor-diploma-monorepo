import { execSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../db/seeds/11_contract_documents.sql");

const PSQL = `PGPASSWORD=app_secret psql -h localhost -U app -d procurement -t -A -F'|'`;

const BUYER = "22222222-2222-2222-2222-222222222203";
const ADMIN = "22222222-2222-2222-2222-222222222201";

const PROCEDURE_IDS = [1, 2, 5, 6];

const CONTRACTORS = [
  "33333333-3333-3333-3333-333333333301",
  "33333333-3333-3333-3333-333333333302",
  "33333333-3333-3333-3333-333333333303",
  "33333333-3333-3333-3333-333333333308",
  "33333333-3333-3333-3333-333333333305",
  "33333333-3333-3333-3333-333333333306",
  "33333333-3333-3333-3333-333333333307",
];

function sqlStr(s) {
  return `'${String(s).replace(/'/g, "''")}'`;
}

function itemType(subject) {
  const s = subject.toLowerCase();
  if (s.includes("послуг") || s.includes("навчання") || s.includes("аудит") || s.includes("страхування")) {
    return "service";
  }
  if (s.includes("ремont") || s.includes("ремонт") || s.includes("монтаж")) {
    return "work";
  }
  return "goods";
}

function contractTypeId(itemTypeVal, idx) {
  if (itemTypeVal === "service") return 2;
  if (itemTypeVal === "work") return 3;
  return idx % 2 === 0 ? 1 : 5;
}

const LATE_LINES_2026 = new Set([4, 9, 15, 22, 28, 33]);

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const raw = execSync(
  `${PSQL} -c "SELECT id, plan_year, line_number, department_id, subject, expected_cost_thousands::text, status, planned_contract_date::text, planned_tz_submit_date::text FROM procurement_plan_items WHERE status IN ('contract_signed', 'completed') ORDER BY plan_year, line_number"`,
  { encoding: "utf8" },
);

const items = raw
  .trim()
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const [id, plan_year, line_number, department_id, subject, cost, status, planned_contract_date, planned_tz_submit_date] =
      line.split("|");
    return {
      id,
      plan_year: Number(plan_year),
      line_number: Number(line_number),
      department_id,
      subject,
      cost: Number(cost),
      status,
      planned_contract_date,
      planned_tz_submit_date,
    };
  });

if (items.length === 0) {
  console.error("No RPZ rows with contract_signed/completed. Run RPZ seed first.");
  process.exit(1);
}

const valueRows = [];
let seq = 0;

for (let i = 0; i < items.length; i++) {
  const item = items[i];
  const ddCount = (item.plan_year + item.line_number) % 3 === 0 ? 2 : 1;
  const type = itemType(item.subject);
  const procId = PROCEDURE_IDS[(item.line_number - 1) % PROCEDURE_IDS.length];
  const contractor = CONTRACTORS[i % CONTRACTORS.length];
  const savingYear = item.plan_year === 2025 || item.plan_year === 2026 || item.plan_year === 2027;
  const rate = savingYear ? 0.85 : 0.95 + (i % 5) * 0.02;
  const baseAmount = Math.round(item.cost * rate * 1000) / 1000;

  for (let part = 0; part < ddCount; part++) {
    seq++;
    const suffix = ddCount === 2 && part === 1 ? " (додаткова угода)" : "";
    const subject = item.subject + suffix;
    const contractSubject =
      ddCount === 2 && part === 1
        ? `Додаткова угода до: ${item.subject}`
        : item.subject;
    const month = String(Math.min(12, 3 + ((item.line_number + part) % 9))).padStart(2, "0");
    const day = String(Math.min(28, 5 + (item.line_number % 20))).padStart(2, "0");
    const late = item.plan_year === 2026 && LATE_LINES_2026.has(item.line_number);
    const contractDate = late
      ? addDays(item.planned_contract_date, 45 + part * 15)
      : item.plan_year === 2025 || item.plan_year === 2026
        ? item.planned_contract_date
        : `${item.plan_year}-${month}-${day}`;
    const validFrom = contractDate;
    const validTo =
      item.plan_year === 2025 || item.plan_year === 2026
        ? addDays(contractDate, 365)
        : `${item.plan_year + 1}-${month}-${day}`;
    const appDate = late
      ? addDays(item.planned_tz_submit_date, 30)
      : item.plan_year === 2025 || item.plan_year === 2026
        ? item.planned_tz_submit_date
        : `${item.plan_year}-${String(Math.max(1, Number(month) - 2)).padStart(2, "0")}-10`;
    const procNum = `UA-${item.plan_year}-${String(item.line_number).padStart(2, "0")}-${String(seq).padStart(4, "0")}`;
    const etm = `https://prozorro.gov.ua/tender/${item.plan_year}${item.line_number}${seq}`;
    const ctId = contractTypeId(type, i + part);
    const appCost = (item.cost * (part === 1 ? 0.15 : 0.9)).toFixed(3);
    const extraShare = savingYear ? 0.05 : 0.12;
    const amount = part === 1 ? Math.round(baseAmount * extraShare * 1000) / 1000 : baseAmount;

    valueRows.push(`  (
    gen_random_uuid(),
    ${seq},
    '${item.id}'::uuid,
    ${sqlStr(subject)},
    '${type}'::item_type_enum,
    ${appCost},
    ${procId},
    '${item.department_id}'::uuid,
    ${sqlStr("Коваленко Олег Сергійович")},
    ${sqlStr("Петренко Іван Олександрович")},
    ${sqlStr("Шевченко Єва Андріївна")},
    ${sqlStr("Спеціаліст із Закупівель")},
    '${appDate}'::date,
    ${sqlStr(procNum)},
    ${sqlStr(etm)},
    '${contractor}'::uuid,
    ${sqlStr(contractSubject)},
    ${amount},
    '${contractDate}'::date,
    ${ctId},
    '${validFrom}'::date,
    '${validTo}'::date,
    ${part === 1 ? sqlStr("Додаткова угода за погодженням сторін") : "NULL"},
    '${BUYER}'::uuid
  )`);
  }
}

const sql = `-- ДД для РПЗ зі статусом contract_signed / completed
-- 1 або 2 документи на пункт (${items.length} пунктів → ${valueRows.length} записів ДД)

BEGIN;

DELETE FROM contract_amendments;
DELETE FROM contract_documents;

INSERT INTO contract_documents (
  id,
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
) VALUES
${valueRows.join(",\n")};

COMMIT;
`;

writeFileSync(outPath, sql, "utf8");
console.log(`RPZ items: ${items.length}, DD rows: ${valueRows.length}`);
console.log(`Wrote ${outPath}`);
