import express from "express";
import cors from "cors";
import helmet from "helmet";
import { hashPassword, verifyPassword } from "./auth";
import { prisma } from "./db";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());

const apiStatus = {
  message: "Frontend and backend are connected",
  status: "ok",
};

app.get("/", (_req, res) => {
  res.status(200).json({
    message: "Backend connected successfully",
    status: "ok",
  });
});

app.get("/api/status", (_req, res) => {
  res.status(200).json(apiStatus);
});

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/api/auth/signup", async (req, res, next) => {
  try {
    const { name, email, password } = req.body as {
      name?: string;
      email?: string;
      password?: string;
    };

    if (!name || !email || !password) {
      res.status(400).json({ message: "Name, email, and password are required" });
      return;
    }

    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        passwordHash: hashPassword(password),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    res.status(201).json({ user });
  } catch (error) {
    next(error);
  }
});

app.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user || !verifyPassword(password, user.passwordHash)) {
      res.status(401).json({ message: "Invalid email or password" });
      return;
    }

    res.status(200).json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
});

app.get("/api/users/:userId/clients", async (req, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.params.userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ clients });
  } catch (error) {
    next(error);
  }
});

app.post("/api/users/:userId/clients", async (req, res, next) => {
  try {
    const { name, email, phone, company, notes } = req.body as {
      name?: string;
      email?: string;
      phone?: string;
      company?: string;
      notes?: string;
    };

    if (!name || !email) {
      res.status(400).json({ message: "Client name and email are required" });
      return;
    }

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        notes: notes || null,
        userId: req.params.userId,
      },
    });

    res.status(201).json({ client });
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(error);

  if (typeof error === "object" && error && "code" in error && error.code === "P2002") {
    res.status(409).json({ message: "A record with this unique value already exists" });
    return;
  }

  res.status(500).json({ message: "Internal server error" });
});

export default app;
