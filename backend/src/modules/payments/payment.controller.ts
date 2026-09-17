import { Request, Response } from "express";
import { asyncHandler } from "../../middleware/asyncHandler";
import { AppError } from "../../middleware/errorHandler";
import {
  createPaymentSchema,
} from "./payments.validation";
import {
  createPayment,
  getInvoicePayments,
  getPaymentById,
  deletePayment,
} from "./payment.service";

const getUserId = (req: Request): string => {
  const userId =
    (req as any).user?.userId ??
    (req as any).user?.id;

  if (!userId) {
    throw new AppError(401, "Unauthorized");
  }

  return userId;
};

export const createPaymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    // const validatedData = createPaymentSchema.parse(req.body);

let validatedData;

try {
  validatedData = createPaymentSchema.parse(req.body);
} catch (error) {
  console.log("PAYMENT VALIDATION ERROR:", error);
  throw error;
}
    const payment = await createPayment(
      userId,
      validatedData
    );

    res.status(201).json(payment);
  }
);

export const getInvoicePaymentsHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const { invoiceId } = req.params;

    if (!invoiceId || Array.isArray(invoiceId)) {
      throw new AppError(400, "Invalid invoice ID");
    }

    const payments = await getInvoicePayments(
      userId,
      invoiceId
    );

    res.status(200).json(payments);
  }
);

export const getPaymentByIdHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new AppError(400, "Invalid payment ID");
    }

    const payment = await getPaymentById(
      userId,
      id
    );

    res.status(200).json(payment);
  }
);

export const deletePaymentHandler = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = getUserId(req);

    const { id } = req.params;

    if (!id || Array.isArray(id)) {
      throw new AppError(400, "Invalid payment ID");
    }

    await deletePayment(userId, id);

    res.status(200).json({
      message: "Payment deleted successfully",
    });
  }
);