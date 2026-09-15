import express from "express";
import { prisma } from "../prisma";
import { AuthenticatedRequest, requireAuth } from "../middleware/auth";

export const clientsRouter = express.Router();

clientsRouter.use(requireAuth);

clientsRouter.get("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const clients = await prisma.client.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: "desc" },
    });

    return res.json({ clients });
  } catch (error) {
    return next(error);
  }
});

clientsRouter.post("/", async (req: AuthenticatedRequest, res, next) => {
  try {
    const { name, email, phone, company, notes } = req.body || {};
    if (!name || !email) return res.status(400).json({ error: "client name and email are required" });

    const client = await prisma.client.create({
      data: {
        name,
        email,
        phone: phone || null,
        company: company || null,
        notes: notes || null,
        userId: req.user!.userId,
      },
    });

    return res.status(201).json({ client });
  } catch (error) {
    return next(error);
  }
});

clientsRouter.put("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const clientId = String(req.params.id);
    const existing = await prisma.client.findFirst({
      where: { id: clientId, userId: req.user!.userId },
    });
    if (!existing) return res.status(404).json({ error: "client not found" });

    const { name, email, phone, company, notes } = req.body || {};
    const client = await prisma.client.update({
      where: { id: existing.id },
      data: {
        name: name ?? existing.name,
        email: email ?? existing.email,
        phone: phone ?? existing.phone,
        company: company ?? existing.company,
        notes: notes ?? existing.notes,
      },
    });

    return res.json({ client });
  } catch (error) {
    return next(error);
  }
});

clientsRouter.delete("/:id", async (req: AuthenticatedRequest, res, next) => {
  try {
    const clientId = String(req.params.id);
    const existing = await prisma.client.findFirst({
      where: { id: clientId, userId: req.user!.userId },
    });
    if (!existing) return res.status(404).json({ error: "client not found" });

    await prisma.client.delete({ where: { id: existing.id } });
    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
});
