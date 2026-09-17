import { z } from "zod";

export const createPaymentSchema = z.object({
  invoiceId: z.string().min(1, "Invoice ID is required"),

  amount: z
    .number()
    .positive("Payment amount must be greater than 0"),

  paidAt: z
    .string()
    .datetime({ message: "Invalid payment date format" })
    .optional(),

  method: z
    .enum([
      "BANK_TRANSFER",
      "CARD",
      "UPI",
      "CASH",
      "OTHER",
    ])
    .optional(),
});

export type CreatePaymentInput = z.infer<
  typeof createPaymentSchema
>;