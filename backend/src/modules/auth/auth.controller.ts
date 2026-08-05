//auth.controller.ts → Express request/response handlers
import { Request, Response } from "express";
import { registerUser, loginUser } from "./auth.service";
import { RegisterInput, LoginInput } from "./auth.validation";
import { sendSuccess, sendError } from "../../utils/apiResponse";

export const register = async (req: Request, res: Response) => {
  try {
    const data: RegisterInput = req.body;
    const user = await registerUser(data);
    return sendSuccess(res, user, 201);
  } catch (error) {
    console.error(error);
    return sendError(res, error instanceof Error ? error.message : "Error registering user", 400, { error });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const data: LoginInput = req.body;
    const result = await loginUser(data);
    // result is { user, token }
    return sendSuccess(res, result, 200);
  } catch (error) {
    console.error(error);
    return sendError(res, error instanceof Error ? error.message : "Invalid credentials", 401);
  }
};