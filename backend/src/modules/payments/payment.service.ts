import { AppError } from "../../middleware/errorHandler";
import { PaymentRepository } from "./payment.respository";
import { prisma } from "../../config/prisma";
import type { CreatePaymentInput } from "./payments.validation";

export const createPayment = async (
  userId: string,
  data: CreatePaymentInput
) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: data.invoiceId,
      userId,
    },
    include: {
      Payment: true,
    },
  });

  if (!invoice) {
    throw new AppError(404, "Invoice not found");
  }

  const totalPaid = invoice.Payment.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const invoiceTotal = Number(invoice.total);
  const paymentAmount = data.amount;

  if (paymentAmount > invoiceTotal - totalPaid) {
    throw new AppError(
      400,
      "Payment amount exceeds the remaining invoice balance"
    );
  }

  const payment = await PaymentRepository.create({
    invoiceId: data.invoiceId,
    amount: paymentAmount,
    ...(data.paidAt !== undefined && {
      paidAt: new Date(data.paidAt),
    }),
    ...(data.method !== undefined && {
      method: data.method,
    }),
  });

  const newTotalPaid = totalPaid + paymentAmount;

  let status:
    | "PARTIALLY_PAID"
    | "PAID"
    | "OVERDUE";

  if (newTotalPaid >= invoiceTotal) {
    status = "PAID";
  } else {
    status = "PARTIALLY_PAID";
  }

  await prisma.invoice.update({
    where: { id: invoice.id },
    data: { status },
  });

  return payment;
};

export const getInvoicePayments = async (
  userId: string,
  invoiceId: string
) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId,
    },
  });

  if (!invoice) {
    throw new AppError(404, "Invoice not found");
  }

  return PaymentRepository.findByInvoiceId(invoiceId);
};

export const getPaymentById = async (
  userId: string,
  paymentId: string
) => {
  const payment = await PaymentRepository.findById(paymentId);

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (payment.Invoice.userId !== userId) {
    throw new AppError(403, "Forbidden");
  }

  return payment;
};

export const deletePayment = async (
  userId: string,
  paymentId: string
) => {
  const payment = await PaymentRepository.findById(paymentId);

  if (!payment) {
    throw new AppError(404, "Payment not found");
  }

  if (payment.Invoice.userId !== userId) {
    throw new AppError(403, "Forbidden");
  }

  await PaymentRepository.delete(paymentId);

  return payment;
};