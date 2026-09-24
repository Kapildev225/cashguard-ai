import { Request, Response } from "express";
import { generateFinanceCopilotResponse } from "./copilot.service";

export const financeCopilot = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    const { question } = req.body;

    if (!question || typeof question !== "string") {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const result = await generateFinanceCopilotResponse(
      userId,
      question
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Finance Copilot error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate Finance Copilot response",
    });
  }
};