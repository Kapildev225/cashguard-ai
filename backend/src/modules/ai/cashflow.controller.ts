import { Request, Response } from "express";
import { getCashFlowForecast } from "./cashflow.service";

export const getCashFlowForecastController = async (
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

    const forecast = await getCashFlowForecast(userId);

    return res.status(200).json({
      success: true,
      data: forecast,
    });
  } catch (error) {
    console.error("Cash flow forecast error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate cash flow forecast",
    });
  }
};