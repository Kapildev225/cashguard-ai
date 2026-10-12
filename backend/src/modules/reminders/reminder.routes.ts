import { Router, Request, Response } from "express";
import crypto from "crypto";

import { prisma } from "../../config/prisma";
import { authMiddleware } from "../../middleware/authMiddleware";
import { asyncHandler } from "../../middleware/asyncHandler";
import { sendSuccess, sendError } from "../../utils/apiResponse";

const router = Router();

// All reminder endpoints require authentication.
router.use(authMiddleware);

/**
 * GET /api/reminders
 * Retrieve reminders belonging to the authenticated user's invoices.
 */
router.get(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId as string | undefined;

    if (!userId) {
      return sendError(res, "Unauthorized", 401);
    }

    const reminders = await prisma.reminder.findMany({
      where: {
        Invoice: {
          is: {
            userId,
          },
        },
      },
      include: {
        Invoice: {
          include: {
            Client: true,
          },
        },
      },
      orderBy: {
        sendAt: "asc",
      },
    });

    return sendSuccess(res, reminders);
  })
);

/**
 * POST /api/reminders
 * Schedule a reminder for an invoice belonging to the authenticated user.
 *
 * Request body:
 * {
 *   "invoiceId": "invoice-id",
 *   "scheduledAt": "2026-10-12T10:00:00.000Z"
 * }
 */
router.post(
  "/",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId as string | undefined;
    const { invoiceId, scheduledAt } = req.body;

    if (!userId) {
      return sendError(res, "Unauthorized", 401);
    }

    if (
      typeof invoiceId !== "string" ||
      !invoiceId.trim() ||
      typeof scheduledAt !== "string" ||
      !scheduledAt.trim()
    ) {
      return sendError(
        res,
        "invoiceId and scheduledAt are required",
        400
      );
    }

    const sendAt = new Date(scheduledAt);

    if (Number.isNaN(sendAt.getTime())) {
      return sendError(res, "Invalid scheduledAt date", 400);
    }

    const invoice = await prisma.invoice.findFirst({
      where: {
        id: invoiceId,
        userId,
      },
    });

    if (!invoice) {
      return sendError(
        res,
        "Invoice not found or you do not have permission to access it",
        404
      );
    }

    const reminder = await prisma.reminder.create({
      data: {
        id: crypto.randomUUID(),
        invoiceId: invoice.id,
        sendAt,
        sent: false,
      },
      include: {
        Invoice: {
          include: {
            Client: true,
          },
        },
      },
    });

    return sendSuccess(res, reminder, 201);
  })
);

/**
 * DELETE /api/reminders/:id
 * Delete a reminder belonging to the authenticated user's invoice.
 */
router.delete(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId as string | undefined;
    const reminderId = String(req.params.id ?? "").trim();

if (!reminderId) {
  return sendError(res, "Invalid reminder ID", 400);
}

    if (!userId) {
      return sendError(res, "Unauthorized", 401);
    }

    const reminder = await prisma.reminder.findFirst({
      where: {
        id: reminderId,
        Invoice: {
          is: {
            userId,
          },
        },
      },
    });

    if (!reminder) {
      return sendError(
        res,
        "Reminder not found or you do not have permission to delete it",
        404
      );
    }

    await prisma.reminder.delete({
      where: {
        id: reminder.id,
      },
    });

    return sendSuccess(res, {
      message: "Reminder deleted successfully",
      id: reminder.id,
    });
  })
);

export default router;