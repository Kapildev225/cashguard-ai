import { Request, Response, NextFunction } from 'express';
import {logger} from "../config/logger";
import {sendError} from "../utils/apiResponse";
// AppError: lightweight error wrapper carrying an HTTP status code
// Note: constructor accepts (statusCode, message) so existing throw sites like
// `throw new AppError(400, 'msg')` remain valid.
export class AppError extends Error {
  public statusCode: number;
  public status: string;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    this.status = String(statusCode).startsWith('4') ? 'fail' : 'error';
  }
}

// Express error handler
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err?.statusCode ?? 500;
  const status = err?.status ?? 'error';

  // Handle Zod validation errors specifically
  if (err && err.name === 'ZodError') {
    const message = err.errors?.map((e: any) => e.message).join(', ') ?? 'Validation error';
    return sendError(res, message, 400);
  }

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  logger.error(err);
  return sendError(res, err?.message ?? 'Internal Server Error', statusCode);
};