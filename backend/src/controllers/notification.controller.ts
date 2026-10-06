import { Request, Response } from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
} from "../services/notification.service";

export const getNotifications = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    const notifications = await getUserNotifications(userId);

    return res.status(200).json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    console.error("❌ Get notifications error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch notifications",
    });
  }
};

export const markAsRead = async (
  req: Request,
  res: Response
) => {
  try {
    const userId = req.user?.id;
    const id = req.params.id;

if (!id || Array.isArray(id)) {
  return res.status(400).json({
    success: false,
    message: "Invalid notification ID",
  });
}

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    await markNotificationAsRead(userId, id);

    return res.status(200).json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("❌ Mark notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to mark notification as read",
    });
  }
};