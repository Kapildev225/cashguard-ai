import express from "express";
import helmet from "helmet";
import cors from "cors";
import morgan from "morgan";
import { errorHandler } from "./middleware/errorHandler";
import { sendSuccess } from "./utils/apiResponse";
import { morganStream } from "./config/morganStream";
import authRoutes from "./modules/auth/auth.routes";
import userRoutes from "./modules/users/user.routes";
import clientRoutes from "./modules/clients/client.routes";
import invoiceRoutes from "./modules/invoices/invoice.routes";
import aiRoutes from "./modules/ai/ai.routes";


const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev",{ stream: morganStream}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));    
app.get("/health", (req, res) => {
  sendSuccess(res, { status: "OK" }, 200);
});
app.get("/", (req, res) => {
  sendSuccess(res, { message: "Welcome to the CashGuard AI API" }, 200);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/clients", clientRoutes);
app.use("/api/invoices", invoiceRoutes);
app.use("/api/ai", aiRoutes);


app.use(errorHandler);
export default app;