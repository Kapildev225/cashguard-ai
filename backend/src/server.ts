import "dotenv/config";

import { createServer } from "http";
import { Server } from "socket.io";

import { stopWorkers, startWorkers } from "./workers";
import "./config/redis";
import app from "./app";
import "./config/mailer";
import { schedulePaymentReminders } from "./services/reminderScheduler";

const PORT = process.env.PORT || 3000;

// Create HTTP server from Express app
const httpServer = createServer(app);

// Initialize Socket.IO
export const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection handling
io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join-user-room", (userId: string) => {
    socket.join(`user:${userId}`);
    console.log(`👤 User ${userId} joined room`);
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, async () => {
  console.log(`Server is running on port ${PORT}`);
  console.log("🔔 Socket.IO server started");

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
  httpServer.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await stopWorkers();
  httpServer.close();
  process.exit(0);
});