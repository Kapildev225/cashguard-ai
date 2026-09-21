import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
// import { getInvoiceRisk } from "./risk.controller";
import{getInvoiceRisk,getClientRisk} from "./risk.controller";
import { getCashFlowForecastController } from "./cashflow.controller";

const router = Router();

router.use(authMiddleware, requireRole("OWNER", "ADMIN"));

router.get("/risk-report", (req, res) =>
  res.status(501).json({ message: "Not implemented yet" })
);

router.get("/risk/invoice/:invoiceId", getInvoiceRisk);
router.get("/risk/client/:clientId", getClientRisk);
router.get("/cashflow-forecast", getCashFlowForecastController);
export default router;