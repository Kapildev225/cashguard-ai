import crypto from "crypto";
import { io } from "../server";
import { prisma } from "../config/prisma";

export const sendUserNotification = async (
  userId: string,
  notification: {
    type: string;
    title: string;
    message: string;
    data?: Record<string, unknown>;
  }
) => {
  const savedNotification = await prisma.notification.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      message: notification.message,
    },
  });

  io.to(`user:${userId}`).emit("notification", {
    id: savedNotification.id,
    ...notification,
    createdAt: savedNotification.createdAt.toISOString(),
    read: savedNotification.read,
  });

  console.log(
    `🔔 Notification saved and sent to user ${userId}: ${notification.title}`
  );

  return savedNotification;
};

export const getUserNotifications = async (userId: string) => {
  return prisma.notification.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
};

export const markNotificationAsRead = async (
  userId: string,
  notificationId: string
) => {
  return prisma.notification.updateMany({
    where: {
      id: notificationId,
      userId,
    },
    data: {
      read: true,
    },
  });
};