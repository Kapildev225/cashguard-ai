import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL;

export const redis = redisUrl
  ? new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
    })
  : new Redis({
      host: process.env.REDIS_HOST || "127.0.0.1",
      port: Number(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      maxRetriesPerRequest: 3,
    });

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (error) => {
  console.error("Redis connection error:", error.message);
});