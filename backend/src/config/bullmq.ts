import IORedis from "ioredis";

export const bullmqConnection = process.env.REDIS_URL
  ? new IORedis(process.env.REDIS_URL, {
      maxRetriesPerRequest: null,
    })
  : new IORedis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: null,
    });

bullmqConnection.on("connect", () => {
  console.log("BullMQ Redis connected");
});

bullmqConnection.on("error", (error) => {
  console.error("BullMQ Redis connection error:", error.message);
});