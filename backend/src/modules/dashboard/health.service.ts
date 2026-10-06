import { prisma } from "../../config/prisma";
import { detectPaymentAnomalies } from "../ai/anomaly.service";

export const getBusinessHealthReport = async (userId: string) => {
  const invoices = await prisma.invoice.findMany({
    where: {
      userId,
      status: {
        notIn: ["DRAFT", "CANCELLED"],
      },
    },
    include: {
      Payment: true,
      Client: true,
    },
  });

  const clients = await prisma.client.findMany({
    where: { userId },
  });

  let totalRevenue = 0;
  let totalCollected = 0;
  let outstanding = 0;
  let overdueAmount = 0;

  let overdueInvoices = 0;
  let paidInvoices = 0;
  let partiallyPaidInvoices = 0;

  for (const invoice of invoices) {
    const total = Number(invoice.total);

    const paid = invoice.Payment.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const due = Math.max(total - paid, 0);

    totalRevenue += total;
    totalCollected += paid;
    outstanding += due;

    if (invoice.status === "PAID") {
      paidInvoices++;
    }

    if (invoice.status === "PARTIALLY_PAID") {
      partiallyPaidInvoices++;
    }

    if (invoice.status === "OVERDUE") {
      overdueInvoices++;
      overdueAmount += due;
    }
  }

  const collectionRate =
    totalRevenue > 0
      ? Math.round((totalCollected / totalRevenue) * 100)
      : 0;

  const overdueRate =
    invoices.length > 0
      ? Math.round((overdueInvoices / invoices.length) * 100)
      : 0;

  const highRiskClients = clients.filter(
    (client) => (client.riskScore ?? 0) >= 60
  ).length;

  const mediumRiskClients = clients.filter(
    (client) =>
      (client.riskScore ?? 0) >= 30 &&
      (client.riskScore ?? 0) < 60
  ).length;

  const anomalies = await detectPaymentAnomalies(userId);

  const healthStatus =
    collectionRate >= 80 && overdueRate < 20
      ? "HEALTHY"
      : collectionRate >= 60 && overdueRate < 40
        ? "WATCH"
        : "AT_RISK";

  // Monthly revenue trend
  const monthlyRevenue: Record<
    string,
    {
      invoiced: number;
      collected: number;
    }
  > = {};

  for (const invoice of invoices) {
    const month = new Date(invoice.createdAt)
      .toISOString()
      .slice(0, 7);

    if (!monthlyRevenue[month]) {
      monthlyRevenue[month] = {
        invoiced: 0,
        collected: 0,
      };
    }

    monthlyRevenue[month].invoiced += Number(invoice.total);

    monthlyRevenue[month].collected += invoice.Payment.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );
  }

  const revenueTrend = Object.entries(monthlyRevenue)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({
      month,
      ...values,
    }));

  return {
    generatedAt: new Date().toISOString(),

    healthStatus,

    revenueTrend,

    summary: {
      totalRevenue,
      totalCollected,
      outstanding,
      overdueAmount,
      collectionRate,
      overdueRate,
    },

    invoices: {
      total: invoices.length,
      paid: paidInvoices,
      partiallyPaid: partiallyPaidInvoices,
      overdue: overdueInvoices,
    },

    clientRisk: {
      totalClients: clients.length,
      highRisk: highRiskClients,
      mediumRisk: mediumRiskClients,
      lowRisk:
        clients.length -
        highRiskClients -
        mediumRiskClients,
    },

    anomalies: {
      total: anomalies.length,
      high: anomalies.filter(
        (item) => item.severity === "HIGH"
      ).length,
      medium: anomalies.filter(
        (item) => item.severity === "MEDIUM"
      ).length,
      low: anomalies.filter(
        (item) => item.severity === "LOW"
      ).length,
    },
  };
}; 