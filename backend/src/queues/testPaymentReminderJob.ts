import { paymentReminderQueue } from "./paymentReminder.queue";

const run = async () => {
  const job = await paymentReminderQueue.add("test-payment-reminder", {
    invoiceId: "test-invoice-001",
    userId: "test-user-001",
    clientId: "test-client-001",
    clientName: "Test Client",
    clientEmail: "test@example.com",
    invoiceNumber: "INV-TEST-001",
    amountDue: 1500,
    currency: "INR",
    dueDate: new Date().toISOString(),
    reminderType: "UPCOMING_DUE",
  });

  console.log("✅ Test job added:", job.id);

  await paymentReminderQueue.close();
};

run().catch((error) => {
  console.error("❌ Failed to add test job:", error);
  process.exit(1);
});