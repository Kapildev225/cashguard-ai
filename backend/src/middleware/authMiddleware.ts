// src/middleware/authMiddleware.ts
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

interface JwtPayload {
  userId: string;
  role: string;
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload & { email?: string };
    // Provide both `id` and `userId` fields on req.user because different modules
    // in the codebase reference either `id` or `userId` for the authenticated user.
    req.user = {
      id: decoded.userId,
      userId: decoded.userId,
      email: decoded.email ?? "",
      role: decoded.role as any,
    } as any;
    next();
  } catch {
    return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
  }
};