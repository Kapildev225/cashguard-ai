import {Response} from "express";


interface SuccessPayload<T> {
    // success flag kept for consistency across responses
    success: true;
    data: T;
    meta?: Record<string, any> & {
        page?: number;
        limit?: number;
        total?: number;
    };

}
interface ErrorPayload {
    success: false;
    // optional status string retained for human-readable clients
    status?: "error" | string;
    message: string;
    statusCode?: number;
    issues?: unknown;
}
export const sendSuccess = <T>(
  res: Response,
  data: T,
  statusCode = 200,
  meta?: Record<string, unknown>
) => {
  // ensure we only spread an object
  const payload: SuccessPayload<T> = { success: true, data, ...(meta ? { meta } : {}) } as any;
  return res.status(statusCode).json(payload);
};

export const sendError = (
  res: Response,
  message: string,
  statusCode = 500,
  issues?: unknown
) => {
  const payload: ErrorPayload = { success: false, status: "error", message, ...(issues ? { issues } : {}) } as any;
  return res.status(statusCode).json(payload);
};