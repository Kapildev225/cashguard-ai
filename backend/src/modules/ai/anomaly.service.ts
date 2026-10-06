import { prisma } from "../../config/prisma";

export type AnomalySeverity = "LOW" | "MEDIUM" | "HIGH";

export interface PaymentAnomaly {
  paymentId: string;
  invoiceId: string;
  invoiceNumber: string;
  clientName: string;
  amount: number;
  severity: AnomalySeverity;
  score: number;
  reasons: string[];
}

export const detectPaymentAnomalies = async (
  userId: string
): Promise<PaymentAnomaly[]> => {
  const payments = await prisma.payment.findMany({
    where: {
      Invoice: {
        userId,
      },
    },
    include: {
      Invoice: {
        include: {
          Client: true,
          Payment: true,
        },
      },
    },
    orderBy: {
      paidAt: "desc",
    },
  });

  const anomalies: PaymentAnomaly[] = [];

  for (const payment of payments) {
    const amount = Number(payment.amount);
    const invoiceTotal = Number(payment.Invoice.total);

    let score = 0;
    const reasons: string[] = [];

    // Rule 1: Payment exceeds invoice total
    if (amount > invoiceTotal) {
      score += 50;
      reasons.push("Payment amount exceeds invoice total");
    }

    // Rule 2: Unusually large payment
    if (invoiceTotal > 0 && amount >= invoiceTotal * 0.9) {
      score += 10;
      reasons.push("Payment is unusually large compared with invoice value");
    }

    // Rule 3: Multiple payments for same invoice
    if (payment.Invoice.Payment.length >= 3) {
      score += 15;
      reasons.push("Invoice has multiple payment transactions");
    }

    // Rule 4: Very large payment
    if (amount >= 100000) {
      score += 15;
      reasons.push("Payment amount is unusually high");
    }

    // Rule 5: Payment exceeds remaining balance
    const paidBefore = payment.Invoice.Payment
      .filter((item) => item.id !== payment.id)
      .reduce((sum, item) => sum + Number(item.amount), 0);

    const remainingBefore = Math.max(invoiceTotal - paidBefore, 0);

    if (amount > remainingBefore) {
      score += 30;
      reasons.push("Payment exceeds the remaining invoice balance");
    }

    score = Math.min(score, 100);

    if (score === 0) {
      continue;
    }

    let severity: AnomalySeverity;

    if (score >= 60) {
      severity = "HIGH";
    } else if (score >= 30) {
      severity = "MEDIUM";
    } else {
      severity = "LOW";
    }

    anomalies.push({
      paymentId: payment.id,
      invoiceId: payment.Invoice.id,
      invoiceNumber: payment.Invoice.invoiceNo,
      clientName: payment.Invoice.Client.name,
      amount,
      severity,
      score,
      reasons,
    });
  }

  return anomalies;
};