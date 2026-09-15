import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth";
import { clientsRouter } from "./routes/clients";
import { requireAuth, requireRole } from "./middleware/auth";

dotenv.config({ override: true });

const app = express();
const PORT = process.env["PORT"] ?? 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Convenience root route so visiting http://localhost:3000/ returns the same
// health JSON as /api/health. This makes it easier to quickly confirm the
// server is running in the browser without remembering the /api prefix.
app.get("/", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use("/api/auth", authRouter);
app.use("/api/clients", clientsRouter);

app.get("/api/me", requireAuth, (req: any, res) => {
  res.json({ user: req.user });
});

app.get("/api/admin/check", requireAuth, requireRole("ADMIN"), (_req, res) => {
  res.json({ ok: true });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);

  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    return res.status(409).json({ error: "a record with this unique value already exists" });
  }

  return res.status(500).json({ error: "internal server error" });
});

app.listen(PORT, () => {
  console.log(`CashGuard AI backend listening on http://localhost:${PORT}`);
});
