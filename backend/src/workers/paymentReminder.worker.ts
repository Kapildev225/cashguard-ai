import { Worker, Job } from "bullmq";
import { bullmqConnection } from "../config/bullmq";
import { PAYMENT_REMINDER_QUEUE } from "../queues/paymentReminder.queue";
import { PaymentReminderJobData } from "../queues/paymentReminder.types";
import { sendPaymentReminderEmail } from "../modules/reminders/reminder.email";
import { prisma } from "../config/prisma";

export const paymentReminderWorker = new Worker<PaymentReminderJobData>(
  PAYMENT_REMINDER_QUEUE,
  async (job: Job<PaymentReminderJobData>) => {
  console.log("📨 Processing payment reminder job:", job.id);

  const {
    invoiceId,
    clientEmail,
    clientName,
    invoiceNumber,
    amountDue,
    currency,
    dueDate,
    reminderType,
  } = job.data;

  await sendPaymentReminderEmail({
    to: clientEmail,
    clientName,
    invoiceNumber,
    amountDue,
    currency,
    dueDate,
    reminderType,
  });

  await prisma.reminder.updateMany({
    where: {
      invoiceId,
      sent: false,
    },
    data: {
      sent: true,
    },
  });

  console.log(`✅ Reminder email sent for ${invoiceNumber}`);

  return {
    success: true,
    processedAt: new Date().toISOString(),
  };
},

  {
    connection: bullmqConnection,
    concurrency: 5,
  }
);

paymentReminderWorker.on("completed", (job) => {
  console.log(`✅ Payment reminder job completed: ${job.id}`);
});

paymentReminderWorker.on("failed", (job, error) => {
  console.error(
    `❌ Payment reminder job failed: ${job?.id}`,
    error
  );
});

paymentReminderWorker.on("error", (error) => {
  console.error("❌ Payment reminder worker error:", error);
});