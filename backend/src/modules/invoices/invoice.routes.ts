import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
import {
  createInvoiceHandler,
  getInvoicesHandler,
  getInvoiceByIdHandler,
  updateInvoiceHandler,
  deleteInvoiceHandler,
  downloadInvoicePdfHandler,
  sendInvoiceHandler,
  trackInvoiceEmailOpenHandler
} from "./invoice.controller";

const router = Router();

//public route for tracking email opens
router.get("/track/:token", trackInvoiceEmailOpenHandler);
router.use(authMiddleware);

// Invoice routes
router.delete("/:id", requireRole("ADMIN", "OWNER"), deleteInvoiceHandler);
router.put("/:id", requireRole("ADMIN", "OWNER","STAFF"), updateInvoiceHandler);
router.get("/:id/pdf", downloadInvoicePdfHandler);
router.post("/:id/send", sendInvoiceHandler);
router.get("/:id", getInvoiceByIdHandler);
router.get("/", getInvoicesHandler);
router.post("/", createInvoiceHandler);

export default router;