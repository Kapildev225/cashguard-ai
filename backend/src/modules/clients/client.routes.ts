import {Router} from "express";
import {authMiddleware} from "../../middleware/authMiddleware"; 
import { createClientHandler, getClientsHandler, getClientByIdHandler, updateClientHandler, deleteClientHandler } from './client.controller';
const router = Router();
router.use(authMiddleware); // Apply authMiddleware to all routes in this router

// Define your routes here
router.get('/', getClientsHandler);
router.post("/", createClientHandler);
router.get("/:id", getClientByIdHandler);
router.put("/:id", updateClientHandler);
router.delete("/:id", deleteClientHandler);

export default router;


