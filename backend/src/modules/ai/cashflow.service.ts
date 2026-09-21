import { prisma } from "../../config/prisma";

export const getCashFlowForecast = async (userId: string) => {
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
    orderBy: {
      dueDate: "asc",
    },
  });

  const now = new Date();

  let totalInvoiced = 0;
  let totalCollected = 0;
  let outstandingAmount = 0;
  let overdueAmount = 0;
  let upcomingAmount = 0;

  const upcomingPayments: Array<{
    invoiceId: string;
    invoiceNumber: string;
    clientName: string;
    amountDue: number;
    dueDate: string;
    daysUntilDue: number;
  }> = [];

  for (const invoice of invoices) {
    const total = Number(invoice.total);

    const paid = invoice.Payment.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const due = Math.max(total - paid, 0);

    totalInvoiced += total;
    totalCollected += paid;
    outstandingAmount += due;

    const dueDate = new Date(invoice.dueDate);

    if (due > 0 && dueDate < now) {
      overdueAmount += due;
    }

    if (due > 0 && dueDate >= now) {
      upcomingAmount += due;

      const daysUntilDue = Math.ceil(
        (dueDate.getTime() - now.getTime()) /
          (1000 * 60 * 60 * 24)
      );

      upcomingPayments.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNo,
        clientName: invoice.Client.name,
        amountDue: due,
        dueDate: dueDate.toISOString(),
        daysUntilDue,
      });
    }
  }

  const collectionRate =
    totalInvoiced > 0
      ? Math.round((totalCollected / totalInvoiced) * 100)
      : 0;

  // Simple 30-day forecast based on currently outstanding invoices.
  const forecast30Days = upcomingPayments
    .filter((payment) => payment.daysUntilDue <= 30)
    .reduce((sum, payment) => sum + payment.amountDue, 0);

  return {
    generatedAt: now.toISOString(),
    currency: "INR",
    summary: {
      totalInvoiced,
      totalCollected,
      outstandingAmount,
      overdueAmount,
      upcomingAmount,
      collectionRate,
      forecast30Days,
    },
    upcomingPayments,
  };
};