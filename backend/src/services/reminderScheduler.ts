import crypto from "crypto";
import { prisma } from "../config/prisma";
import { paymentReminderQueue } from "../queues/paymentReminder.queue";

export const schedulePaymentReminders = async () => {
  const now = new Date();

  const invoices = await prisma.invoice.findMany({
    where: {
      status: {
        in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"],
      },
    },
    include: {
      Client: true,
      Payment: true,
    },
  });

  for (const invoice of invoices) {
    const paidAmount = invoice.Payment.reduce(
      (sum, payment) => sum + Number(payment.amount),
      0
    );

    const amountDue = Number(invoice.total) - paidAmount;

    if (amountDue <= 0) continue;

    const dueDate = new Date(invoice.dueDate);
    const threeDaysBefore = new Date(dueDate);
    threeDaysBefore.setDate(threeDaysBefore.getDate() - 3);

    let reminderType: "UPCOMING_DUE" | "OVERDUE";

    if (now >= dueDate) {
      reminderType = "OVERDUE";
    } else if (now >= threeDaysBefore) {
      reminderType = "UPCOMING_DUE";
    } else {
      continue;
    }

    const existingReminder = await prisma.reminder.findFirst({
      where: {
        invoiceId: invoice.id,
        sent: false,
      },
    });

    if (existingReminder) continue;

    await paymentReminderQueue.add(
      `${reminderType}-${invoice.invoiceNo}`,
      {
        invoiceId: invoice.id,
        userId: invoice.userId,
        clientId: invoice.clientId,
        clientName: invoice.Client.name,
        clientEmail: invoice.Client.email,
        invoiceNumber: invoice.invoiceNo,
        amountDue,
        currency: invoice.currency ?? "INR",
        dueDate: invoice.dueDate.toISOString(),
        reminderType,
      }
    );

    await prisma.reminder.create({
      data: {
        id: crypto.randomUUID(),
        invoiceId: invoice.id,
        sendAt: now,
        sent: false,
      },
    });

    console.log(
      `📅 Scheduled ${reminderType} reminder for ${invoice.invoiceNo}`
    );
  }
};