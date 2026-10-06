import { Request, Response } from "express";
import { getBusinessHealthReport } from "./health.service";

export const getBusinessHealth = async (
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

    const report = await getBusinessHealthReport(userId);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Business health report error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate business health report",
    });
  }
};