import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outPath = join(__dirname, "../db/seeds/10_procurement_plan_items.sql");

const YEARS = [2023, 2024, 2025, 2026, 2027];
const LINES_PER_YEAR = {
  2023: 35,
  2024: 22,
  2025: 26,
  2026: 36,
  2027: 20,
};

const DEPTS = [1, 2, 3, 4, 5];

const BUYER = "22222222-2222-2222-2222-222222222203";
const ADMIN = "22222222-2222-2222-2222-222222222201";
const HEAD = "22222222-2222-2222-2222-222222222202";

const CONTRACTORS = [
  "33333333-3333-3333-3333-333333333301",
  "33333333-3333-3333-3333-333333333302",
  "33333333-3333-3333-3333-333333333303",
  "33333333-3333-3333-3333-333333333308",
  "33333333-3333-3333-3333-333333333305",
];

const SUBJECTS = [
  "Офісне обладнання та комп’ютерна техніка",
  "Послуги з аудиту фінансової звітності",
  "Юридичний супровід договорів",
  "Ліцензії на програмне забезпечення",
  "Канцелярські товари та витратні матеріали",
  "Послуги охорони об’єктів",
  "Медичні вироби для медпункту",
  "Навчання персоналу з охорони праці",
  "Ремонт приміщень адміністративної будівлі",
  "Послуги з прибирання приміщень",
  "Паливо та мастильні матеріали для автопарку",
  "Страхування майна підприємства",
  "Рекламні та поліграфічні послуги",
  "Послуги з IT-підтримки та адміністрування мережі",
  "Закупівля серверного обладнання",
  "Консалтинг з енергоефективності",
  "Транспортні послуги (перевезення вантажів)",
  "Оренда складських приміщень",
  "Закупівля меблів для робочих місць",
  "Послуги з дератизації та дезінсекції",
  "Вода питна та кулери",
  "Засоби індивідуального захисту",
  "Послуги з відеоспостереження",
  "Пожежна сигналізація та обслуговування",
  "Клінінгові засоби та хімія",
];

const HEADS = [
  "Коваленко Олег Сергійович",
  "Петренко Іван Олександрович",
  "Мельник Андрій Васильович",
  "Бондаренко Тетяна Ігорівна",
];

const EXECUTORS = [
  "Шевченко Єва Андріївна",
  "Коваль Наталія Сергіївна",
  "Сидоренко Марко Петрович",
  "Литвиненко Оксана Миколаївна",
];

function statusForYear(year, line) {
  if (year <= 2026) return "completed";
  if (line <= 4) return "completed";
  if (line <= 7) return "contract_signed";
  return line % 3 === 0 ? "in_preparation" : "planned";
}

function sqlStr(s) {
  return `'${s.replace(/'/g, "''")}'`;
}

const rows = [];
let globalIdx = 0;

for (const year of YEARS) {
  for (let line = 1; line <= LINES_PER_YEAR[year]; line++) {
    globalIdx++;
    const dept = DEPTS[(line - 1) % DEPTS.length];
    const subject = SUBJECTS[(globalIdx - 1) % SUBJECTS.length];
    const needType = line % 2 === 0 ? "annual" : "one_time";
    const kindId = subject.includes("Послуги") || subject.includes("послуг") ? 2 : line % 2 === 0 ? 2 : 1;
    const fundId = line % 3 === 0 ? 2 : 1;
    const catId = ((globalIdx - 1) % 12) + 1;
    const ipId = ((globalIdx - 1) % 8) + 1;
    const cost = (50 + (globalIdx * 17) % 4500 + line * 3).toFixed(3);
    const status = statusForYear(year, line);
    const createdBy = line % 4 === 0 ? HEAD : ADMIN;
    const headName = HEADS[(line - 1) % HEADS.length];
    const execName = EXECUTORS[(line - 1) % EXECUTORS.length];
    const eventName = `Захід ${year} — пункт ${line}`;
    const tz = `${year}-${String(Math.min(11, 1 + (line % 10))).padStart(2, "0")}-15`;
    const contract = `${year}-${String(Math.min(12, 2 + (line % 9))).padStart(2, "0")}-01`;
    const workStart = `${year}-${String(Math.min(12, 3 + (line % 8))).padStart(2, "0")}-10`;
    const prevEnd =
      line % 5 === 0 ? `'${year - 1}-12-31'` : "NULL";
    const prevContractor =
      line % 5 === 0 ? `'${CONTRACTORS[line % CONTRACTORS.length]}'` : "NULL";

    rows.push(`  (
    gen_random_uuid(),
    ${year},
    ${line},
    ${dept},
    ${sqlStr(headName)},
    ${sqlStr(execName)},
    ${sqlStr(subject)},
    '${needType}'::need_type_enum,
    ${kindId},
    ${fundId},
    ${ipId},
    ${sqlStr(eventName)},
    ${catId},
    ${cost},
    ${prevEnd},
    ${prevContractor === "NULL" ? "NULL" : `${prevContractor}::uuid`},
    '${contract}'::date,
    '${tz}'::date,
    '${workStart}'::date,
    '${BUYER}'::uuid,
    '${status}'::procurement_status_enum,
    '${createdBy}'::uuid
  )`);
  }
}

const yearCounts = YEARS.map((year) => `${year}: ${LINES_PER_YEAR[year]}`).join(", ");
const sql = `-- РПЗ: ${yearCounts} (${rows.length} загалом)
-- Перезапуск: видаляє РПЗ за ці роки (ДД з plan_item_id спочатку треba прибрати вручну, якщо є)

BEGIN;

DELETE FROM contract_amendments
WHERE contract_id IN (
  SELECT id FROM contract_documents
  WHERE plan_item_id IN (
    SELECT id FROM procurement_plan_items WHERE plan_year BETWEEN 2023 AND 2027
  )
);

DELETE FROM contract_documents
WHERE plan_item_id IN (
  SELECT id FROM procurement_plan_items WHERE plan_year BETWEEN 2023 AND 2027
);

DELETE FROM procurement_plan_items WHERE plan_year BETWEEN 2023 AND 2027;

INSERT INTO procurement_plan_items (
  id,
  plan_year,
  line_number,
  department_id,
  initiator_head_name,
  executor_name,
  subject,
  need_type,
  procurement_kind_id,
  funding_source_id,
  ip_nkrekp_item_id,
  event_name,
  category_id,
  expected_cost_thousands,
  prev_contract_end_date,
  prev_contractor_id,
  planned_contract_date,
  planned_tz_submit_date,
  planned_work_start_date,
  responsible_buyer_id,
  status,
  created_by
) VALUES
${rows.join(",\n")};

COMMIT;
`;

writeFileSync(outPath, sql, "utf8");
console.log(`Wrote ${rows.length} rows to ${outPath}`);
