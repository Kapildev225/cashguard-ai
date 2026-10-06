import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";

import {
  createPaymentHandler,
  getInvoicePaymentsHandler,
  getPaymentByIdHandler,
  deletePaymentHandler,
} from "./payment.controller";

const router = Router();

router.use(authMiddleware);

// Create a payment
router.post("/", createPaymentHandler);

// Get all payments for an invoice
router.get("/invoice/:invoiceId", getInvoicePaymentsHandler);

// Get a single payment
router.get("/:id", getPaymentByIdHandler);

// Delete a payment
router.delete("/:id", deletePaymentHandler);

export default router;