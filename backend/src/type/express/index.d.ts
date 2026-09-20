import { role } from "../generated/prisma/models/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        userId: string;
        email: string;
        role: role;
      };
    }
  }
}

export {};