import { Router } from "express";
import pool from "../db";

const STATUSES = [
  "planned",
  "in_preparation",
  "procedure",
  "awaiting_contract",
  "contract_signed",
  "completed",
] as const;

const procurementStatusesRouter = Router();

procurementStatusesRouter.get("/", async (req, res) => {
  const year = Number(req.query.year);

  if (!Number.isInteger(year) || year < 1) {
    res.status(400).json({ message: "year must be a positive integer" });
    return;
  }

  const result = await pool.query<{ status: string; count: string }>(
    `SELECT status::text AS status, COUNT(*)::int AS count
     FROM procurement_plan_items
     WHERE plan_year = $1
     GROUP BY status`,
    [year],
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
