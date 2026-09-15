// // Use the runtime @prisma/client import so TypeScript build works with the generated client
// import "dotenv/config";
// import { PrismaClient } from "@prisma/client";
// import { PrismaPg } from "@prisma/adapter-pg";
// import pg from "pg";

// const connectionString = process.env.DATABASE_URL;

// if (!connectionString) {
//   throw new Error("DATABASE_URL is not set in the environment");
// }
// const pool = new pg.Pool({ connectionString });
// const adapter = new PrismaPg(pool);

// export const prisma = new PrismaClient({ adapter });

import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../.env"),
  override: true,
});

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in the environment");
}

const pool = new pg.Pool({
  connectionString,
});

const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({
  adapter,
});