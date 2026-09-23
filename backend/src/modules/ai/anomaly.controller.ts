import { Request, Response } from "express";
import { detectPaymentAnomalies } from "./anomaly.service";

export const getPaymentAnomalies = async (
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

    const anomalies = await detectPaymentAnomalies(userId);

    return res.status(200).json({
      success: true,
      count: anomalies.length,
      data: anomalies,
    });
  } catch (error) {
    console.error("Payment anomaly detection error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to detect payment anomalies",
    });
  }
};