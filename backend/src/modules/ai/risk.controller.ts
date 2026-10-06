import { Request, Response } from "express";
import { predictInvoiceRisk } from "./risk.service";
import { getClientRiskReport } from "./risk.service";

export const getInvoiceRisk = async (
  req: Request,
  res: Response
) => {
  try {
    const invoiceId = req.params.invoiceId as string;

    if (!invoiceId) {
      return res.status(400).json({
        message: "Invoice ID is required",
      });
    }

    const prediction = await predictInvoiceRisk(invoiceId);

    return res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    console.error("Risk prediction error:", error);

    if (error instanceof Error && error.message === "Invoice not found") {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to predict invoice risk",
    });
  }
};
export const getClientRisk = async (
  req: Request,
  res: Response
) => {
  try {
    const clientId = req.params.clientId as string;

    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
      });
    }

    const report = await getClientRiskReport(clientId);

    return res.status(200).json({
      success: true,
      data: report,
    });
  } catch (error) {
    console.error("Client risk report error:", error);

    if (error instanceof Error && error.message === "Client not found") {
      return res.status(404).json({
        success: false,
        message: "Client not found",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to generate client risk report",
    });
  }
};