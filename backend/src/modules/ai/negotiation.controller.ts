import { Request, Response } from "express";
import { generateNegotiationAdvice } from "./negotiation.service";

export const negotiationAssistant = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = (req as any).user?.userId;
    const { invoiceId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User authentication required",
      });
    }

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Invoice ID is required",
      });
    }

    const result = await generateNegotiationAdvice(
      userId,
      invoiceId
    );

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Negotiation Assistant error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to generate negotiation advice",
    });
  }
};