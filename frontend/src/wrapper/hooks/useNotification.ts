import { useState, useEffect, useCallback } from "react";


export interface Notification {
  id: string;
  message: string;
  title?: string;
  type?: "info" | "warning" | "success" | "error";
  read?: boolean;
  createdAt?: string;
}






const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:5000/api"
).replace(/\/$/, "");

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/notifications`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to load notifications (${response.status})`);
      }

      const result = await response.json();

      const data = Array.isArray(result)
        ? result
        : Array.isArray(result.data)
          ? result.data
          : [];

      setNotifications(data);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Unable to load notifications";

      setError(message);
      console.error("Notification error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setError("Authentication token not found.");
        return false;
      }

      try {
        const response = await fetch(
          `${API_URL}/notifications/${encodeURIComponent(id)}/read`,
          {
            method: "PATCH",
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error(`Failed to mark notification as read (${response.status})`);
        }

        setNotifications((previous) =>
          previous.map((notification) =>
            notification.id === id
              ? { ...notification, read: true }
              : notification
          )
        );

        return true;
      } catch (err) {
        console.error("Mark notification as read failed:", err);
        setError(
          err instanceof Error
            ? err.message
            : "Unable to update notification"
        );
        return false;
      }
    },
    []
  );

  const unreadCount = notifications.filter(
    (notification) => !notification.read
  ).length;

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  return {
    notifications,
    loading,
    error,
    unreadCount,
    markAsRead,
    refetch: fetchNotifications,
  };
};