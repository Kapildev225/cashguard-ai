import { prisma } from "../../config/prisma";
import { openai } from "../../config/openai";

export const generateFinanceCopilotResponse = async (
  userId: string,
  question: string
) => {
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

  let totalInvoiced = 0;
  let totalPaid = 0;
  let outstanding = 0;
  let overdue = 0;

  for (const invoice of invoices) {
    const total = Number(invoice.total);

    const paid = invoice.Payment.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const due = Math.max(total - paid, 0);

    totalInvoiced += total;
    totalPaid += paid;
    outstanding += due;

    if (due > 0 && new Date(invoice.dueDate) < new Date()) {
      overdue += due;
    }
  }

  const context = {
    totalInvoiced,
    totalPaid,
    outstanding,
    overdue,
    invoiceCount: invoices.length,
  };

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          "You are CashGuard AI Finance Copilot. Give concise, practical financial guidance based only on the provided business data. Do not invent financial numbers.",
      },
      {
        role: "user",
        content: `Business financial data:
${JSON.stringify(context)}

User question:
${question}`,
      },
    ],
  });

  return {
    question,
    answer: response.output_text,
    context,
  };
};