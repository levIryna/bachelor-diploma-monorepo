import { Router } from "express";
import { resolveDepartmentScope } from "../auth/departmentScope";
import { requireAuth } from "../auth/middleware";
import pool from "../db";

type DynamicsAnalysisRow = {
  year: number;
  planned: string;
  actual: string;
  savings: string;
};

const dynamicsAnalysisRouter = Router();

dynamicsAnalysisRouter.get("/", requireAuth, async (req, res) => {
  const scope = resolveDepartmentScope(req);
  if (!scope.ok) {
    res.status(scope.status).json({ message: scope.message });
    return;
  }

  const result = await pool.query<DynamicsAnalysisRow>(
    `WITH item_totals AS (
       SELECT
         p.plan_year AS year,
         p.expected_cost_thousands AS planned,
         SUM(cd.contract_amount_uah) AS actual
       FROM procurement_plan_items p
       LEFT JOIN contract_documents cd ON cd.plan_item_id = p.id
       WHERE ($1::int IS NULL OR p.department_id = $1::int)
       GROUP BY p.id, p.plan_year, p.expected_cost_thousands
     )
     SELECT
       year,
       COALESCE(SUM(planned), 0)::text AS planned,
       COALESCE(SUM(actual), 0)::text AS actual,
       COALESCE(
         SUM(planned - actual) FILTER (WHERE actual IS NOT NULL AND planned > 0),
         0
       )::text AS savings
     FROM item_totals
     GROUP BY year
     ORDER BY year`,
    [scope.departmentId],
  );

  res.status(200).json({
    years: result.rows.map((row) => ({
      year: Number(row.year),
      planned: Number(row.planned),
      actual: Number(row.actual),
      savings: Number(row.savings),
    })),
  });
});

export default dynamicsAnalysisRouter;
