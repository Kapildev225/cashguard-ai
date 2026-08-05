import{Router} from "express";
import {authMiddleware} from "../../middleware/authMiddleware";
import {requireRole} from "../../middleware/requireRole";
import { Role } from "../../generated/prisma/browser";
const router = Router();
router.get("/", authMiddleware, requireRole("ADMIN"), (req, res) => {
  res.status(501).json({ message: "Not implemented yet" });
});

router.get("/:id", authMiddleware, (req, res) => {
  // Enforce that USER role cannot access other users' data
  const requestingUserId = req.user?.id;
  const requestingUserRole = req.user?.role;
  if (requestingUserRole === "USER" && requestingUserId !== req.params.id) {
    return res.status(403).json({ message: "Forbidden: Insufficient role" });
  }
  res.json({ message: `This is a protected route for user with ID: ${req.params.id}` });
});
export default router;