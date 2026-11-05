import { Router } from "express";
import { resolveDepartmentScope } from "../auth/departmentScope";
import { requireAuth } from "../auth/middleware";
import pool from "../db";

type CategoryAnalysisRow = {
  name: string;
  items: number;
  planned: string;
};

const categoryAnalysisRouter = Router();

categoryAnalysisRouter.get("/", requireAuth, async (req, res) => {
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

  const result = await pool.query<CategoryAnalysisRow>(
    `SELECT
       COALESCE(c.name_uk, 'Без категорії') AS name,
       COUNT(*)::int AS items,
       COALESCE(SUM(p.expected_cost_thousands), 0)::text AS planned
     FROM procurement_plan_items p
     LEFT JOIN procurement_categories c ON c.id = p.category_id
     WHERE p.plan_year = $1
       AND ($2::int IS NULL OR p.department_id = $2::int)
     GROUP BY c.name_uk
     ORDER BY SUM(p.expected_cost_thousands) DESC, COALESCE(c.name_uk, 'Без категорії')`,
    [year, scope.departmentId],
  );

  res.status(200).json({
    categories: result.rows.map((row) => ({
      name: row.name,
      items: Number(row.items),
      planned: Number(row.planned),
    })),
  });
});

export default categoryAnalysisRouter;
