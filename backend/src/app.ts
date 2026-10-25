import express from "express";
import kpiCardsRouter from "./routes/kpi_cards";
import procurementDynamicsRouter from "./routes/procurement_dynamics";
import procurementStatusesRouter from "./routes/procurement_statuses";
import yearsRouter from "./routes/years";

const app = express();

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "http://localhost:5173");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PATCH, DELETE");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

app.use(express.json());

app.use("/years", yearsRouter);
app.use("/kpi_cards", kpiCardsRouter);
app.use("/procurement_statuses", procurementStatusesRouter);
app.use("/procurement_dynamics", procurementDynamicsRouter);

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ message: "Internal server error" });
});

export default app;
