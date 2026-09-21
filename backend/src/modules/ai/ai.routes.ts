import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
// import { getInvoiceRisk } from "./risk.controller";
import{getInvoiceRisk,getClientRisk} from "./risk.controller";


const router = Router();

router.use(authMiddleware, requireRole("OWNER", "ADMIN"));

router.get("/risk-report", (req, res) =>
  res.status(501).json({ message: "Not implemented yet" })
);

router.get("/risk/invoice/:invoiceId", getInvoiceRisk);
router.get("/risk/client/:clientId", getClientRisk);

export default router;