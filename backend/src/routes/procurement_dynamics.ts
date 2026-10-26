import { Router } from "express";
import { resolveDepartmentScope } from "../auth/departmentScope";
import pool from "../db";

type DynamicsRow = {
  year: number;
  planned: string | number | null;
  actual: string | number | null;
};

const procurementDynamicsRouter = Router();

procurementDynamicsRouter.get("/", async (req, res) => {
  const rawLimit = req.query.limit;
  let limit: number | undefined;

  if (rawLimit !== undefined) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1) {
      res.status(400).json({ message: "limit must be a positive integer" });
      return;
    }
  }

  const scope = resolveDepartmentScope(req);
  if (!scope.ok) {
    res.status(scope.status).json({ message: scope.message });
    return;
  }

  const params: Array<string | number | null> = [scope.departmentId];
  const limitSql = limit === undefined ? "" : "LIMIT $2";
  if (limit !== undefined) {
    params.push(limit);
  }

  const result = await pool.query<DynamicsRow>(
    `WITH available_years AS (
       SELECT plan_year AS year
       FROM procurement_plan_items
       WHERE ($1::int IS NULL OR department_id = $1::int)
       GROUP BY plan_year
       ORDER BY plan_year DESC
       ${limitSql}
     ),
     planned AS (
       SELECT plan_year AS year, COALESCE(SUM(expected_cost_thousands), 0) AS planned
       FROM procurement_plan_items
       WHERE ($1::int IS NULL OR department_id = $1::int)
       GROUP BY plan_year
     ),
     actual AS (
       SELECT EXTRACT(YEAR FROM cd.contract_date)::int AS year,
              COALESCE(SUM(cd.contract_amount_uah), 0) AS actual
       FROM contract_documents cd
       JOIN procurement_plan_items item ON item.id = cd.plan_item_id
       WHERE cd.contract_date IS NOT NULL
         AND ($1::int IS NULL OR item.department_id = $1::int)
       GROUP BY EXTRACT(YEAR FROM cd.contract_date)
     )
     SELECT
       available_years.year,
       COALESCE(planned.planned, 0) AS planned,
       COALESCE(actual.actual, 0) AS actual
     FROM available_years
     LEFT JOIN planned ON planned.year = available_years.year
     LEFT JOIN actual ON actual.year = available_years.year
     ORDER BY available_years.year`,
    params,
  );

  res.status(200).json(
    result.rows.map((row) => ({
      year: Number(row.year),
      planned: Number(row.planned),
      actual: Number(row.actual),
    })),
  );
});

export default procurementDynamicsRouter;
