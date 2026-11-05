import { Router } from "express";
import { resolveDepartmentScope } from "../auth/departmentScope";
import { requireAuth } from "../auth/middleware";
import pool from "../db";

type SavingsRow = {
  department: string;
  planned: string;
  actual: string;
};

const savingsAnalysisRouter = Router();

savingsAnalysisRouter.get("/", requireAuth, async (req, res) => {
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

  const result = await pool.query<SavingsRow>(
    `SELECT
       d.name AS department,
       p.expected_cost_thousands::text AS planned,
       COALESCE(SUM(cd.contract_amount_uah), 0)::text AS actual
     FROM procurement_plan_items p
     JOIN departments d ON d.id = p.department_id
     JOIN contract_documents cd ON cd.plan_item_id = p.id
     WHERE p.plan_year = $1
       AND p.expected_cost_thousands > 0
       AND ($2::int IS NULL OR p.department_id = $2::int)
     GROUP BY p.id, d.name, p.expected_cost_thousands`,
    [year, scope.departmentId],
  );

  const byDepartment = new Map<string, number>();
  let totalSavings = 0;
  let percentSum = 0;

  for (const row of result.rows) {
    const planned = Number(row.planned);
    const actual = Number(row.actual);
    const economy = planned - actual;
    totalSavings += economy;
    percentSum += (economy / planned) * 100;
    byDepartment.set(row.department, (byDepartment.get(row.department) ?? 0) + economy);
  }

  const departments = [...byDepartment.entries()]
    .map(([name, savings]) => ({ name, savings }))
    .sort((left, right) => left.name.localeCompare(right.name, "uk"));

  res.status(200).json({
    totalSavings: result.rowCount ? totalSavings : null,
    averagePercent: result.rowCount ? percentSum / result.rows.length : null,
    departments,
  });
});

export default savingsAnalysisRouter;
