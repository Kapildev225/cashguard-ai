import "dotenv/config";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

pool.query("SELECT 1")
  .then((r) => console.log("✅ Connection OK:", r.rows))
  .catch((e) => console.error("❌ Connection FAILED:", e))
  .finally(() => pool.end());