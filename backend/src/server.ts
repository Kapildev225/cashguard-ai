import { stopWorkers } from "./workers";
import"./config/redis";
import { startWorkers } from "./workers";
import "dotenv/config";
import app from "./app";
import "./config/mailer"
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  startWorkers();
}); 
process.on("SIGINT", async () => {
  await stopWorkers();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stopWorkers();
  process.exit(0);
});
