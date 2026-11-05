import { Router } from "express";
import { resolveDepartmentScope } from "../auth/departmentScope";
import { requireAuth } from "../auth/middleware";
import pool from "../db";

type ProcedureShareRow = {
  item_type: "goods" | "service" | "work";
  procedure: string;
  contracts: number;
};

const KIND_ORDER = ["goods", "service", "work"] as const;

const KIND_LABEL: Record<(typeof KIND_ORDER)[number], string> = {
  goods: "Товар",
  service: "Послуга",
  work: "Робота",
};

const procurementMethodsRouter = Router();

procurementMethodsRouter.get("/", requireAuth, async (req, res) => {
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

  const result = await pool.query<ProcedureShareRow>(
    `SELECT
       cd.item_type,
       proc.name_uk AS procedure,
       COUNT(*)::int AS contracts
     FROM contract_documents cd
     JOIN procurement_plan_items p ON p.id = cd.plan_item_id
     JOIN procurement_procedures proc ON proc.id = cd.procedure_id
     WHERE p.plan_year = $1
       AND ($2::int IS NULL OR p.department_id = $2::int)
     GROUP BY cd.item_type, proc.name_uk`,
    [year, scope.departmentId],
  );

  const byKind = new Map<string, Map<string, number>>();
  for (const row of result.rows) {
    const procedures = byKind.get(row.item_type) ?? new Map<string, number>();
    procedures.set(row.procedure, Number(row.contracts));
    byKind.set(row.item_type, procedures);
  }

  const kinds = KIND_ORDER.filter((type) => byKind.has(type)).map((type) => {
    const procedures = [...(byKind.get(type)?.entries() ?? [])]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => left.name.localeCompare(right.name, "uk"));
    return {
      type,
      label: KIND_LABEL[type],
      total: procedures.reduce((sum, procedure) => sum + procedure.count, 0),
      procedures,
    };
  });

  res.status(200).json({ kinds });
});

export default procurementMethodsRouter;
