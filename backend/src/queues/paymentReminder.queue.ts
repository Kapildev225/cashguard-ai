import { Queue } from "bullmq";
import { bullmqConnection } from "../config/bullmq";

export const PAYMENT_REMINDER_QUEUE = "payment-reminders";

export const paymentReminderQueue = new Queue(
  PAYMENT_REMINDER_QUEUE,
  {
    connection: bullmqConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: "exponential",
        delay: 5000,
      },
      removeOnComplete: { count: 60 * 60 * 1000 }, // Remove completed jobs after 1 hour
      removeOnFail: { count: 60 * 60 * 1000 }, // Remove failed jobs after 1 hour
    },
  }
);