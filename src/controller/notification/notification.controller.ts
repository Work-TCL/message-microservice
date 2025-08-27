import { Request, Response } from "express";
import { sendCollaborationNotification, sendNotification } from "../../socket";
import { AuthRequest } from "../../types/authRequest";
import { NotificationModel } from "../../database/model";

/**
 * Send real-time notifications to specific users.
 *
 * @param req - Express request object
 * @param res - Express response object
 */
export const sendNotificationFn = async (req: Request, res: Response) => {
  try {
    const { userIds, message, userType, notificationType } = req.body;
console.log("object",userIds, message,userType, notificationType)
    // Trigger real-time notification via socket
    if (notificationType === "collaboration") {
      sendCollaborationNotification(userIds, {
        message,
        notificationType,
        userType,
      });
    } else {
      await sendNotification(userIds, message);
    }

    // Create notification documents for each user
    const notifications = userIds.map((userId: string) => ({
      userId,
      message,
      userType,
      notificationType,
      read: false,
    }));

    // Save all notifications in bulk
    const data = await NotificationModel.insertMany(notifications);

    return res.status(200).json({
      message: "Notification sent successfully",
      data,
    });
  } catch (e) {
    console.error("Error in sending notification", e);
    return res.status(500).json({
      message: "Error in sending notification",
      error: e,
    });
  }
};

/**
 * Fetch the list of notifications for the logged-in user with pagination.
 *
 * @param req - Authenticated request containing user details
 * @param res - Express response object
 */
export const notificationList = async (req: AuthRequest, res: Response) => {
  const { _id, userRole } = req.user;

  try {
    const { page = 1, limit = 10 } = req.query; // Pagination parameters
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;
    /**
     * Fetch notifications for the logged-in user:
     * - Skip records for pagination
     * - Limit the number of records returned
     */
    const notifications = await NotificationModel.find({ userId: _id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber);

    // Count the number of unread notifications
    const unreadCount = await NotificationModel.countDocuments({
      userId: _id,
      read: false,
    });

    // Count the total number of notifications
    const total = await NotificationModel.countDocuments({ userId: _id });
    const unreadCollaborationNotificationsCount =
    await NotificationModel.countDocuments({
      userId: _id,
      read: false,
      notificationType: "collaboration",
    });
    return res.status(200).json({
      message: "Notification list fetched successfully",
      data: notifications,
      unreadCount, // Include unread count in response
      total, // Include total notifications count
      unreadCollaborationNotificationsCount
    });
  } catch (e) {
    console.log("Error in fetching notification list", e);

    return res.status(500).json({
      message: "Error in fetching notification list",
      error: e,
    });
  }
};

/**
 * Fetch unread notifications for the logged-in user.
 *
 * @param req - Authenticated request containing user details
 * @param res - Express response object
 */
export const getUnreadNotifications = async (
  req: AuthRequest,
  res: Response
) => {
  const { _id } = req.user;

  try {
    // Fetch all unread notifications for the user
    const unreadNotificationsCount = await NotificationModel.countDocuments({
      userId: _id,
      read: false,
    });
    const unreadCollaborationNotificationsCount =
      await NotificationModel.countDocuments({
        userId: _id,
        read: false,
        notificationType: "collaboration",
      });

    return res.status(200).json({
      message: "Unread notifications fetched successfully",
      data: { unreadNotificationsCount, unreadCollaborationNotificationsCount },
    });
  } catch (error) {
    console.log("Error fetching unread notifications", error);

    return res.status(500).json({
      message: "Error fetching unread notifications",
      error,
    });
  }
};

/**
 * Mark a specific notification or all notifications as read.
 *
 * @param req - Authenticated request containing user and notification details
 * @param res - Express response object
 */
export const markRead = async (req: AuthRequest, res: Response) => {
  try {
    const { notificationId, readAll = false } = req.body;

    if (readAll) {
      // Mark all unread notifications as read for the logged-in user
      const { _id } = req.user;
      await NotificationModel.updateMany(
        { userId: _id, read: false },
        { read: true }
      );

      return res.status(200).json({
        message: "All notifications marked as read",
      });
    }

    // Mark a single notification as read
    const notification = await NotificationModel.findByIdAndUpdate(
      notificationId,
      { read: true },
      { new: true }
    );

    return res.status(200).json({
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.log("Error in marking notification as read", error);

    return res.status(500).json({
      message: "Error in marking notification as read",
      error: error,
    });
  }
};

export const markCollaborationRead = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { _id } = req.user;

    // Mark all unread collaboration notifications as read for the logged-in user
    await NotificationModel.updateMany(
      { userId: _id, read: false, notificationType: "collaboration" },
      { read: true }
    );

    return res.status(200).json({
      message: "All collaboration notifications marked as read",
    });
  } catch (error) {
    console.log("Error in marking notification as read", error);

    return res.status(500).json({
      message: "Error in marking notification as read",
      error: error,
    });
  }
};
