import express, { type ErrorRequestHandler } from "express";
import { attachUser } from "./auth/middleware";
import authRouter from "./routes/auth";
import contractDocumentsRouter from "./routes/contract_documents";
import categoryAnalysisRouter from "./routes/category_analysis";
import costAnalysisRouter from "./routes/cost_analysis";
import contractorsRouter from "./routes/contractors";
import departmentsRouter from "./routes/departments";
import dynamicsAnalysisRouter from "./routes/dynamics_analysis";
import kpiCardsRouter from "./routes/kpi_cards";
import procurementDynamicsRouter from "./routes/procurement_dynamics";
import procurementMethodsRouter from "./routes/procurement_methods";
import {
  contractTypesRouter,
  fundingSourcesRouter,
  ipNkrekpItemsRouter,
  procurementCategoriesRouter,
  procurementKindsRouter,
  procurementProceduresRouter,
} from "./routes/procurement_directories";
import procurementPlanItemsRouter from "./routes/procurement_plan_items";
import procurementStatusesRouter from "./routes/procurement_statuses";
import savingsAnalysisRouter from "./routes/savings_analysis";
import usersRouter from "./routes/users";
import yearsRouter from "./routes/years";

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Expose-Headers", "X-Auth-Expired");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());
app.use(attachUser);

app.use("/auth", authRouter);
app.use("/contract_documents", contractDocumentsRouter);
app.use("/category_analysis", categoryAnalysisRouter);
app.use("/cost_analysis", costAnalysisRouter);
app.use("/contractors", contractorsRouter);
app.use("/departments", departmentsRouter);
app.use("/users", usersRouter);
app.use("/years", yearsRouter);
app.use("/kpi_cards", kpiCardsRouter);
app.use("/procurement_statuses", procurementStatusesRouter);
app.use("/savings_analysis", savingsAnalysisRouter);
app.use("/procurement_kinds", procurementKindsRouter);
app.use("/procurement_procedures", procurementProceduresRouter);
app.use("/contract_types", contractTypesRouter);
app.use("/procurement_categories", procurementCategoriesRouter);
app.use("/funding_sources", fundingSourcesRouter);
app.use("/ip_nkrekp_items", ipNkrekpItemsRouter);
app.use("/procurement_plan_items", procurementPlanItemsRouter);
app.use("/procurement_dynamics", procurementDynamicsRouter);
app.use("/procurement_methods", procurementMethodsRouter);
app.use("/dynamics_analysis", dynamicsAnalysisRouter);

const handleError: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
};

app.use(handleError);

export default app;
