import { Router } from "express";
import { resolveDepartmentScope } from "../auth/departmentScope";
import pool from "../db";

type KpiCardsRow = {
  planed_sum: string | number | null;
  planed_amount: string | number | null;
  signed_contracts: string | number | null;
  contacts_total_sum: string | number | null;
  total_savings: string | number | null;
  average_savings: string | number | null;
  purchases_in_progress: string | number | null;
  in_risk: string | number | null;
};

const kpiCardsRouter = Router();

kpiCardsRouter.get("/", async (req, res) => {
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

  const result = await pool.query<KpiCardsRow>(
    `WITH plan AS (
      SELECT
        p.id,
        p.expected_cost_thousands,
        p.status,
        p.planned_tz_submit_date,
        p.planned_contract_date,
        COUNT(cd.id) FILTER (WHERE cd.contract_date IS NOT NULL) AS signed_count,
        COALESCE(SUM(cd.contract_amount_uah) FILTER (WHERE cd.contract_date IS NOT NULL), 0) AS signed_amount,
        BOOL_OR(cd.actual_application_date IS NOT NULL) AS has_application,
        BOOL_OR(cd.contract_date IS NOT NULL) AS has_contract,
        BOOL_OR(cd.contract_date > p.planned_contract_date) AS signed_late,
        BOOL_OR(cd.actual_application_date > p.planned_tz_submit_date) AS application_late
      FROM procurement_plan_items p
      LEFT JOIN contract_documents cd ON cd.plan_item_id = p.id
      WHERE p.plan_year = $1
        AND ($2::int IS NULL OR p.department_id = $2::int)
      GROUP BY p.id
    ),
    savings AS (
      SELECT
        expected_cost_thousands - signed_amount AS economy,
        expected_cost_thousands AS expected_uah
      FROM plan
      WHERE expected_cost_thousands > 0
        AND signed_count > 0
    )
    SELECT
      COUNT(*) AS planed_amount,
      ROUND(COALESCE(SUM(plan.expected_cost_thousands), 0)::numeric, 2) AS planed_sum,
      COALESCE(SUM(plan.signed_count), 0) AS signed_contracts,
      ROUND(COALESCE((
        SELECT SUM(cd.contract_amount_uah)
        FROM contract_documents cd
        JOIN procurement_plan_items item ON item.id = cd.plan_item_id
        WHERE cd.contract_date IS NOT NULL
          AND EXTRACT(YEAR FROM cd.contract_date) = $1
          AND ($2::int IS NULL OR item.department_id = $2::int)
      ), 0)::numeric, 2) AS contacts_total_sum,
      COUNT(*) FILTER (WHERE plan.status <> 'completed') AS purchases_in_progress,
      COUNT(*) FILTER (
        WHERE
          (
            plan.status <> 'completed'
            AND (
              (plan.planned_tz_submit_date < CURRENT_DATE AND plan.has_application IS NOT TRUE)
              OR (plan.planned_contract_date < CURRENT_DATE AND plan.has_contract IS NOT TRUE)
            )
          )
          OR plan.signed_late IS TRUE
          OR plan.application_late IS TRUE
      ) AS in_risk,
      ROUND(COALESCE((SELECT SUM(economy) FROM savings), 0)::numeric, 2) AS total_savings,
      ROUND(COALESCE((SELECT AVG(economy / expected_uah * 100) FROM savings), 0)::numeric, 2) AS average_savings
    FROM plan`,
    [year, scope.departmentId],
  );

  const row = result.rows[0];
  res.status(200).json({
    planed_sum: Number(row.planed_sum),
    planed_amount: Number(row.planed_amount),
    signed_contracts: Number(row.signed_contracts),
    contacts_total_sum: Number(row.contacts_total_sum),
    total_savings: Number(row.total_savings),
    average_savings: Number(row.average_savings),
    purchases_in_progress: Number(row.purchases_in_progress),
    in_risk: Number(row.in_risk),
  });
});

export default kpiCardsRouter;
