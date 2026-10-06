import { Router } from "express";
import {
  getNotifications,
  markAsRead,
} from "../controllers/notification.controller";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authMiddleware, getNotifications);

router.patch("/:id/read", authMiddleware, markAsRead);

export default router;