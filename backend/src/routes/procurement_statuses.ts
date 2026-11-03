import { Router } from "express";
import { resolveDepartmentScope } from "../auth/departmentScope";
import pool from "../db";

const STATUSES = [
  "planned",
  "in_preparation",
  "contract_signed",
  "completed",
] as const;

const procurementStatusesRouter = Router();

procurementStatusesRouter.get("/values", async (_req, res) => {
  const result = await pool.query<{ value: string }>(
    `SELECT e.enumlabel AS value
     FROM pg_type t
     JOIN pg_enum e ON e.enumtypid = t.oid
     WHERE t.typname = 'procurement_status_enum'
     ORDER BY e.enumsortorder`,
  );

  res.status(200).json(result.rows.map((row) => row.value));
});

procurementStatusesRouter.get("/", async (req, res) => {
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

  const result = await pool.query<{ status: string; count: string }>(
    `SELECT status::text AS status, COUNT(*)::int AS count
     FROM procurement_plan_items
     WHERE plan_year = $1
       AND ($2::int IS NULL OR department_id = $2::int)
     GROUP BY status`,
    [year, scope.departmentId],
  );

  const counts = new Map(result.rows.map((row) => [row.status, Number(row.count)]));

  res.status(200).json(
    STATUSES.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    })),
  );
});

export default procurementStatusesRouter;
