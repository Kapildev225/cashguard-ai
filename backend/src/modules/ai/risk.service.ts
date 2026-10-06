import { prisma } from "../../config/prisma";

export type RiskLevel = "LOW" | "MEDIUM" | "HIGH";

export interface RiskPrediction {
  invoiceId: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  riskScore: number;
  riskLevel: RiskLevel;
  factors: string[];
  amountDue: number;
  daysOverdue: number;
}

export const predictInvoiceRisk = async (
  invoiceId: string
): Promise<RiskPrediction> => {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: {
      Client: true,
      Payment: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const total = Number(invoice.total);

  const paidAmount = invoice.Payment.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const amountDue = Math.max(total - paidAmount, 0);

  const now = new Date();
  const dueDate = new Date(invoice.dueDate);

  const daysOverdue =
    now > dueDate
      ? Math.floor(
          (now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      : 0;

  let score = 0;
  const factors: string[] = [];

  // Outstanding amount
  if (amountDue > 0) {
    score += 10;
    factors.push("Outstanding payment exists");
  }

  // Overdue risk
  if (daysOverdue > 0) {
    score += Math.min(daysOverdue * 2, 30);
    factors.push(`Payment is ${daysOverdue} day(s) overdue`);
  }

  // Partial payment behavior
  if (paidAmount > 0 && amountDue > 0) {
    score += 15;
    factors.push("Invoice has a partial payment");
  }

  // Client historical payment behavior
  const clientInvoices = await prisma.invoice.findMany({
    where: {
      clientId: invoice.clientId,
      id: { not: invoice.id },
    },
    include: {
      Payment: true,
    },
  });

  const overdueInvoices = clientInvoices.filter(
    (item) => item.status === "OVERDUE"
  ).length;

  if (overdueInvoices > 0) {
    score += Math.min(overdueInvoices * 10, 30);
    factors.push(
      `${overdueInvoices} previous invoice(s) were marked overdue`
    );
  }

  // Keep score within 0-100
  score = Math.min(score, 100);

  // Save client's latest risk score
  await prisma.client.update({
    where: { id: invoice.clientId },
    data: {
      riskScore: score,
    },
  });

  // Determine risk level
  let riskLevel: RiskLevel;

  if (score >= 60) {
    riskLevel = "HIGH";
  } else if (score >= 30) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNo,
    clientId: invoice.clientId,
    clientName: invoice.Client.name,
    riskScore: score,
    riskLevel,
    factors,
    amountDue,
    daysOverdue,
  };
};

export const getClientRiskReport = async (clientId: string) => {
  const client = await prisma.client.findUnique({
    where: { id: clientId },
    include: {
      Invoice: {
        include: {
          Payment: true,
        },
      },
    },
  });

  if (!client) {
    throw new Error("Client not found");
  }

  let totalInvoiced = 0;
  let totalPaid = 0;
  let overdueInvoices = 0;
  let partiallyPaidInvoices = 0;
  let unpaidInvoices = 0;

  for (const invoice of client.Invoice) {
    const total = Number(invoice.total);

    const paid = invoice.Payment.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    totalInvoiced += total;
    totalPaid += paid;

    if (invoice.status === "OVERDUE") {
      overdueInvoices++;
    }

    if (invoice.status === "PARTIALLY_PAID") {
      partiallyPaidInvoices++;
    }

    if (paid < total && invoice.status !== "CANCELLED") {
      unpaidInvoices++;
    }
  }

  const paymentRate =
    totalInvoiced > 0
      ? Math.round((totalPaid / totalInvoiced) * 100)
      : 100;

  const currentRiskScore = client.riskScore ?? 0;

  let riskLevel: RiskLevel;

  if (currentRiskScore >= 60) {
    riskLevel = "HIGH";
  } else if (currentRiskScore >= 30) {
    riskLevel = "MEDIUM";
  } else {
    riskLevel = "LOW";
  }

  return {
    clientId: client.id,
    clientName: client.name,
    riskScore: currentRiskScore,
    riskLevel,
    totalInvoices: client.Invoice.length,
    totalInvoiced,
    totalPaid,
    paymentRate,
    overdueInvoices,
    partiallyPaidInvoices,
    unpaidInvoices,
  };
};