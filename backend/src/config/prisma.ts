// Ensure environment variables are loaded before constructing the Prisma client.
// This guarantees process.env.DATABASE_URL is available when the adapter is created.
import "dotenv/config";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

console.log("Prisma.ts sees DATABASE_URL:", process.env.DATABASE_URL ? process.env.DATABASE_URL.slice(0, 30) + "..." : "MISSING");


const adapter = new PrismaPg({ connectionString: process.env.DIRECT_URL , });
export const prisma = new PrismaClient({ adapter });
console.log("FULL URL:", JSON.stringify(process.env.DIRECT_URL));