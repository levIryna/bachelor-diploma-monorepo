import { Router } from "express";
import pool from "../db";

const departmentsRouter = Router();

departmentsRouter.get("/", async (req, res) => {
  if (req.user?.role === "department_head") {
    if (!req.user.departmentId) {
      res.status(200).json([]);
      return;
    }

    const result = await pool.query<{ id: string; name: string }>(
      `SELECT id::text AS id, name
       FROM departments
       WHERE is_active = true AND id = $1::int`,
      [req.user.departmentId],
    );
    res.status(200).json(result.rows);
    return;
  }

  const result = await pool.query<{ id: string; name: string }>(
    `SELECT id::text AS id, name
     FROM departments
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows);
});

export default departmentsRouter;
