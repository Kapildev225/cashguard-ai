import { Request, Response, NextFunction, RequestHandler } from 'express';

// A typed async handler wrapper. Accepts an async function and returns an Express
// RequestHandler that will forward errors to next().
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>): RequestHandler =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };