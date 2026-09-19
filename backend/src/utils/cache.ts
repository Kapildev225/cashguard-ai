import {redis } from "../config/redis";

export const getCache = async <T>(key: string): Promise<T | null> => {
  const cached = await redis.get(key);

  if (!cached) {
    return null;
  }

  return JSON.parse(cached) as T;
}
export const setCache = async (
  key: string,
  value: unknown,
  ttlSeconds = 300
): Promise<void> => {
  await redis.set(
    key,
    JSON.stringify(value),
    "EX",
    ttlSeconds
  );
};

export const deleteCache = async (key: string): Promise<void> => {
  await redis.del(key);
};
export const deleteInvoiceCache = async (userId: string): Promise<void> => {
  const pattern = `invoices:${userId}:*`;

  const keys = await redis.keys(pattern);

  if (keys.length > 0) {
    await redis.del(...keys);
    console.log(`🗑️ Deleted ${keys.length} invoice cache key(s)`);
  }
};