import { Request, Response, NextFunction } from "express";
import { verifyAccessToken } from "../auth";

export type AuthRole = "OWNER" | "ADMIN" | "STAFF";

export type AuthenticatedRequest = Request & {
  user?: {
    userId: string;
    role: AuthRole;
  };
};

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const auth = req.headers.authorization?.split(" ");
  if (!auth || auth[0] !== "Bearer" || !auth[1]) return res.status(401).json({ error: "unauthorized" });

  try {
    const payload = verifyAccessToken(auth[1]);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: "invalid token" });
  }
}

export function requireRole(...allowedRoles: AuthRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) return res.status(401).json({ error: "unauthorized" });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ error: "forbidden" });
    return next();
  };
}
