import { Router } from "express";
import { authMiddleware } from "../../middleware/authMiddleware";
import { requireRole } from "../../middleware/requireRole";
import { getBusinessHealth } from "./health.controller";

const router = Router();

router.use(authMiddleware, requireRole("OWNER", "ADMIN"));

router.get("/health", getBusinessHealth);

export default router;