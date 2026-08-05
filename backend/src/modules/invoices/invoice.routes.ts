import {Router} from "express";         
// import {getAllUsers, getUserById, createUser, updateUser, deleteUser} from "./user.controller";
import {authMiddleware} from "../../middleware/authMiddleware";
import {requireRole} from "../../middleware/requireRole";
// import {Role} from "../../generated/prisma/client";
import {
  createInvoiceHandler,
  getInvoicesHandler,
  getInvoiceByIdHandler,
  updateInvoiceHandler,
  deleteInvoiceHandler,
} from "./invoice.controller";
const router = Router();
router.use(authMiddleware);

router.delete("/:id", requireRole("ADMIN", "OWNER"), deleteInvoiceHandler);
router.put("/:id", requireRole("ADMIN", "OWNER"), updateInvoiceHandler);
router.get("/:id", getInvoiceByIdHandler);
router.get("/", getInvoicesHandler);
router.post("/", createInvoiceHandler);
  // Since invoices are not implemented, return 404 to simulate not-found
  // return res.status(404).json({ message: "Not implemented yet" }); // all roles         


// router.post("/", (req, res) => res.status(501).json({ message: "Not implemented yet" })); // all roles

export default router;