import {Router} from "express"
import {authMiddleware} from "../../../middleware/authMiddleware";
import {requireRole} from "../../../middleware/requireRole";
import {Role} from "../../../generated/prisma/client";
// import {getAllUsers, getUserById, updateUser, deleteUser} from "./user.controller";


const router = Router();

// router.get("/", authMiddleware, getAllUsers);
// router.get("/:id", authMiddleware, getUserById);
// router.put("/:id", authMiddleware, requireRole(Role.ADMIN), updateUser);
// router.delete("/:id", authMiddleware, requireRole(Role.ADMIN), deleteUser);
router.get("/", authMiddleware, requireRole(Role.ADMIN), (req, res) => {
  res.json({ message: "This is a protected route for ADMIN users." });
});
router.get("/:id", authMiddleware, (req, res) => {
  res.json({ message: `This is a protected route for user with ID: ${req.params.id}` });
});

export default router;
