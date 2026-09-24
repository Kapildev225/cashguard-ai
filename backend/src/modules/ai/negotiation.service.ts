import { prisma } from "../../config/prisma";
import { openai } from "../../config/openai";

export const generateNegotiationAdvice = async (
  userId: string,
  invoiceId: string
) => {
  const invoice = await prisma.invoice.findFirst({
    where: {
      id: invoiceId,
      userId,
    },
    include: {
      Client: true,
      Payment: true,
    },
  });

  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const total = Number(invoice.total);

  const paid = invoice.Payment.reduce(
    (sum, payment) => sum + Number(payment.amount),
    0
  );

  const amountDue = Math.max(total - paid, 0);

  const now = new Date();
  const dueDate = new Date(invoice.dueDate);

  const daysOverdue =
    now > dueDate
      ? Math.floor(
          (now.getTime() - dueDate.getTime()) /
            (1000 * 60 * 60 * 24)
        )
      : 0;

  const context = {
    clientName: invoice.Client.name,
    invoiceNumber: invoice.invoiceNo,
    total,
    paid,
    amountDue,
    daysOverdue,
    currency: invoice.currency ?? "INR",
  };

  const response = await openai.responses.create({
    model: "gpt-5-mini",
    input: [
      {
        role: "system",
        content:
          "You are CashGuard AI Negotiation Assistant. Help a business owner communicate professionally with clients about overdue or outstanding invoices. Suggest practical, polite negotiation strategies. Never invent financial facts.",
      },
      {
        role: "user",
        content: `Invoice negotiation context:
${JSON.stringify(context)}

Create a concise negotiation strategy and a professional message the business owner can send to the client.`,
      },
    ],
  });

  return {
    invoiceId: invoice.id,
    invoiceNumber: invoice.invoiceNo,
    clientName: invoice.Client.name,
    amountDue,
    daysOverdue,
    advice: response.output_text,
  };
};