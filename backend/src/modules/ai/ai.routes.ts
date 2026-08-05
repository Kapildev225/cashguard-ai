import {Router} from "express"; 

// import {getAllUsers, getUserById, createUser, updateUser, deleteUser} from "./user.controller";
import {authMiddleware} from "../../middleware/authMiddleware";
import {requireRole} from "../../middleware/requireRole";
// import {Role} from "../../generated/prisma/client";

const router = Router();

router.use(authMiddleware, requireRole("OWNER", "ADMIN"));

router.get("/risk-report", (req, res) => res.status(501).json({ message: "Not implemented yet" }));

export default router;