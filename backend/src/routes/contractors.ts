import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import pool from "../db";

const contractorsRouter = Router();

contractorsRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT name
     FROM contractors
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

export default contractorsRouter;
