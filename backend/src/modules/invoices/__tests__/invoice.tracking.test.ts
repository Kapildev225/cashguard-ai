import type { Request, Response, NextFunction } from "express";

jest.mock("../../../config/prisma", () => ({
  prisma: {
    invoice: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

jest.mock("../../../middleware/asyncHandler", () => ({
  asyncHandler: (fn: any) => fn,
}));

import { prisma } from "../../../config/prisma";
import { trackInvoiceEmailOpenHandler } from "../invoice.controller";

describe("Invoice email tracking", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("records the first email open and returns a PNG pixel", async () => {
    // Mock invoice lookup
    (prisma.invoice.findUnique as jest.Mock).mockResolvedValue({
      id: "test-invoice-id",
      emailTrackingToken: "test-tracking-token",
      emailOpenedAt: null,
    });

    // Mock emailOpenedAt update
    (prisma.invoice.update as jest.Mock).mockResolvedValue({
      id: "test-invoice-id",
      emailTrackingToken: "test-tracking-token",
      emailOpenedAt: new Date(),
    });

    const req = {
      params: {
        token: "test-tracking-token",
      },
    } as unknown as Request;

    const res = {
      set: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    } as unknown as Response;

    const next = jest.fn() as NextFunction;

    await trackInvoiceEmailOpenHandler(req, res, next);

    // Verify invoice lookup
    expect(prisma.invoice.findUnique).toHaveBeenCalledWith({
      where: {
        emailTrackingToken: "test-tracking-token",
      },
    });

    // Verify first-open timestamp was recorded
    expect(prisma.invoice.update).toHaveBeenCalledTimes(1);

    expect(prisma.invoice.update).toHaveBeenCalledWith({
      where: {
        id: "test-invoice-id",
      },
      data: {
        emailOpenedAt: expect.any(Date),
      },
    });

    // Verify PNG response headers
    expect(res.set).toHaveBeenCalledWith({
      "Content-Type": "image/png",
      "Content-Length": expect.any(String),
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate",
      Pragma: "no-cache",
      Expires: "0",
    });

    // Verify successful response
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.send).toHaveBeenCalled();

    // No Express error
    expect(next).not.toHaveBeenCalled();
  });
});