import express from "express";
import { prisma } from "../prisma";
import {
  hashPassword,
  verifyPassword,
  signAccessToken,
  signRefreshToken,
  storeRefreshToken,
  verifyRefreshToken,
  isRefreshTokenValid,
  revokeRefreshToken,
} from "../auth";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

export const authRouter = express.Router();

authRouter.post("/signup", async (req, res, next) => {
  try {
    const { email, name, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });
    if (String(password).length < 8) return res.status(400).json({ error: "password must be at least 8 characters" });

    const normalizedEmail = String(email).toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) return res.status(409).json({ error: "user already exists" });

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name ? String(name) : "",
        passwordHash: hashPassword(String(password)),
        role: "OWNER",
      },
    });
    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    storeRefreshToken(refreshToken);

    return res.status(201).json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ error: "email and password required" });

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
    if (!user) return res.status(401).json({ error: "invalid credentials" });
    if (!verifyPassword(String(password), user.passwordHash)) return res.status(401).json({ error: "invalid credentials" });

    const payload = { userId: user.id, role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    storeRefreshToken(refreshToken);

    return res.json({
      accessToken,
      refreshToken,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    });
  } catch (error) {
    return next(error);
  }
});

authRouter.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
  if (!isRefreshTokenValid(refreshToken)) return res.status(401).json({ error: "invalid refresh token" });

  try {
    const payload = verifyRefreshToken(refreshToken);
    const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });
    return res.json({ accessToken });
  } catch (error) {
    return res.status(401).json({ error: "invalid refresh token" });
  }
});

authRouter.post("/logout", async (req, res) => {
  const { refreshToken } = req.body || {};
  if (!refreshToken) return res.status(400).json({ error: "refreshToken required" });
  revokeRefreshToken(refreshToken);
  return res.json({ ok: true });
});

authRouter.get("/me", requireAuth, async (req: AuthenticatedRequest, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: { id: true, email: true, name: true, role: true, createdAt: true },
    });

    if (!user) return res.status(404).json({ error: "user not found" });
    return res.json({ user });
  } catch (error) {
    return next(error);
  }
});

authRouter.get("/ping", (_req, res) => res.json({ ok: true }));
