import { Router } from "express";
import { resolveDepartmentScope } from "../auth/departmentScope";
import { requireAuth } from "../auth/middleware";
import pool from "../db";

type CostAnalysisRow = {
  id: string;
  line_number: number;
  subject: string;
  planned: string;
  actual: string | null;
};

const costAnalysisRouter = Router();

costAnalysisRouter.get("/", requireAuth, async (req, res) => {
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

  const result = await pool.query<CostAnalysisRow>(
    `SELECT
       p.id::text AS id,
       p.line_number,
       p.subject,
       p.expected_cost_thousands::text AS planned,
       SUM(cd.contract_amount_uah)::text AS actual
     FROM procurement_plan_items p
     LEFT JOIN contract_documents cd ON cd.plan_item_id = p.id
     WHERE p.plan_year = $1
       AND ($2::int IS NULL OR p.department_id = $2::int)
     GROUP BY p.id, p.line_number, p.subject, p.expected_cost_thousands
     ORDER BY p.line_number`,
    [year, scope.departmentId],
  );

  let plannedTotal = 0;
  let actualTotal = 0;
  let hasActual = false;
  const items = result.rows.map((row) => {
    const planned = Number(row.planned);
    const actual = row.actual === null ? null : Number(row.actual);
    plannedTotal += planned;
    if (actual !== null) {
      hasActual = true;
      actualTotal += actual;
    }
    return {
      id: row.id,
      lineNumber: Number(row.line_number),
      subject: row.subject,
      planned,
      actual,
    };
  });

  res.status(200).json({
    plannedTotal,
    actualTotal: hasActual ? actualTotal : null,
    items,
  });
});

export default costAnalysisRouter;
