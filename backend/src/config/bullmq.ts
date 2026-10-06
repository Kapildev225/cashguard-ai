import IORedis from "ioredis";

export const bullmqConnection = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT ? parseInt(process.env.REDIS_PORT, 10) : 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  maxRetriesPerRequest: null, // Crucial for BullMQ
});

bullmqConnection.on("connect", () => {
  console.log("✅ BullMQ Redis connected");
});

bullmqConnection.on("error", (error) => {
  console.error("❌ BullMQ Redis error:", error);
});
