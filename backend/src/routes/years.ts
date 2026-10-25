import { Router } from "express";
import pool from "../db";

const yearsRouter = Router();

yearsRouter.get("/", async (req, res) => {
  const rawLimit = req.query.limit;
  let limit: number | undefined;

  if (rawLimit !== undefined) {
    limit = Number(rawLimit);
    if (!Number.isInteger(limit) || limit < 1) {
      res.status(400).json({ message: "limit must be a positive integer" });
      return;
    }
  }

  const result = await pool.query<{ plan_year: number }>(
    `SELECT DISTINCT plan_year
     FROM procurement_plan_items
     ORDER BY plan_year DESC
     ${limit === undefined ? "" : "LIMIT $1"}`,
    limit === undefined ? [] : [limit],
  );
  const years = result.rows.map((row) => String(row.plan_year));
  res.status(200).json(years);
});
export default yearsRouter;
