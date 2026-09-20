import { Worker, Job } from "bullmq";
import { bullmqConnection } from "../config/bullmq";
import { PAYMENT_REMINDER_QUEUE } from "../queues/paymentReminder.queue";
import { PaymentReminderJobData } from "../queues/paymentReminder.types";

export const paymentReminderWorker = new Worker<PaymentReminderJobData>(
  PAYMENT_REMINDER_QUEUE,
  async (job: Job<PaymentReminderJobData>) => {
    console.log("📨 Processing payment reminder job:", job.id);

    console.log({
      invoiceId: job.data.invoiceId,
      clientEmail: job.data.clientEmail,
      invoiceNumber: job.data.invoiceNumber,
      amountDue: job.data.amountDue,
      reminderType: job.data.reminderType,
    });

    // Actual reminder/email processing will be implemented on Day 6.

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