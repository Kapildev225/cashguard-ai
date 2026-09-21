import "dotenv/config";

import { stopWorkers } from "./workers";
import"./config/redis";
import { startWorkers } from "./workers";
import app from "./app";
import "./config/mailer"
import { schedulePaymentReminders } from "./services/reminderScheduler";
const PORT = process.env.PORT || 3000;
app.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  startWorkers();
   await schedulePaymentReminders();
}); 
setInterval(async () => {
  try {
    await schedulePaymentReminders();
  } catch (error) {
    console.error("❌ Reminder scheduler error:", error);
  }
}, 60 * 60 * 1000);

process.on("SIGINT", async () => {
  await stopWorkers();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stopWorkers();
  process.exit(0);
});
