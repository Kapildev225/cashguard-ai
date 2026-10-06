import {request, response, NextFunction} from 'express';
import {Role} from "../generated/prisma/client";

export const requireRole = (...requiredRoles: Role[]) => {
  return (req: typeof request, res: typeof response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }
    if (!requiredRoles.includes(req.user.role as Role)) {
      return res.status(403).json({ message: 'Forbidden: Insufficient role' });
    }
    next();
  };
};
