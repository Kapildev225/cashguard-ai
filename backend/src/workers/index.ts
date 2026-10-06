import { paymentReminderWorker } from "./paymentReminder.worker";
import { paymentReminderQueue } from "../queues/paymentReminder.queue";
import { bullmqConnection } from "../config/bullmq";

export const startWorkers = () => {
  console.log("🚀 BullMQ workers started");

  return {
    paymentReminderWorker,
  };
};

export const stopWorkers = async () => {
  console.log("🛑 Stopping BullMQ workers...");

  await paymentReminderWorker.close();
  await paymentReminderQueue.close();
  await bullmqConnection.quit();

  console.log("✅ BullMQ workers stopped");
};