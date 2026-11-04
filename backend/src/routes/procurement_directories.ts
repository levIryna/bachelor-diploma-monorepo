import { Router } from "express";
import { requireAuth } from "../auth/middleware";
import pool from "../db";

const procurementKindsRouter = Router();
const procurementCategoriesRouter = Router();
const fundingSourcesRouter = Router();
const ipNkrekpItemsRouter = Router();
const procurementProceduresRouter = Router();
const contractTypesRouter = Router();

procurementKindsRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT DISTINCT name_uk AS name
     FROM procurement_kinds
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

procurementCategoriesRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT DISTINCT name_uk AS name
     FROM procurement_categories
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

fundingSourcesRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT DISTINCT name_uk AS name
     FROM funding_sources
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

ipNkrekpItemsRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT DISTINCT title AS name
     FROM ip_nkrekp_items
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

procurementProceduresRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT name_uk AS name
     FROM procurement_procedures
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

contractTypesRouter.get("/", requireAuth, async (_req, res) => {
  const result = await pool.query<{ name: string }>(
    `SELECT name_uk AS name
     FROM contract_types
     WHERE is_active = true
     ORDER BY name`,
  );
  res.status(200).json(result.rows.map((row) => row.name));
});

export {
  contractTypesRouter,
  fundingSourcesRouter,
  ipNkrekpItemsRouter,
  procurementCategoriesRouter,
  procurementKindsRouter,
  procurementProceduresRouter,
};
