import { Notification } from '../models/notification.model.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { ApiError } from '../utils/apiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Get notifications for current user (including system broadcasts)
export const getMyNotifications = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id.toString();
  const rawNotifications = await Notification.find({
    $or: [{ recipientUserId: req.user._id }, { recipientUserId: null }]
  })
    .populate('ruleDocumentId', 'title authority ruleCode version')
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();

  const notifications = rawNotifications.map((n) => {
    // If it's a broadcast notification, check if current user is in readBy
    const isUserRead = n.recipientUserId
      ? !!n.isRead
      : Array.isArray(n.readBy) && n.readBy.some((uid) => uid.toString() === currentUserId);

    return {
      ...n,
      isRead: isUserRead
    };
  });

  return ApiResponse.success(res, notifications, 'Notifications retrieved successfully');
});

// Mark a single notification as read
export const markAsRead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const currentUserId = req.user._id;

  const notification = await Notification.findById(id);
  if (!notification) {
    throw ApiError.notFound('Notification not found');
  }

  if (notification.recipientUserId) {
    // Direct notification
    notification.isRead = true;
    await notification.save();
  } else {
    // Broadcast notification: add user to readBy set
    await Notification.findByIdAndUpdate(id, {
      $addToSet: { readBy: currentUserId }
    });
  }

  return ApiResponse.success(res, { _id: id, isRead: true }, 'Notification marked as read');
});

// Mark all notifications as read
export const markAllAsRead = asyncHandler(async (req, res) => {
  const currentUserId = req.user._id;

  await Promise.all([
    // Mark direct notifications as read
    Notification.updateMany(
      { recipientUserId: currentUserId },
      { isRead: true }
    ),
    // Mark broadcast notifications as read for current user
    Notification.updateMany(
      { recipientUserId: null },
      { $addToSet: { readBy: currentUserId } }
    )
  ]);

  return ApiResponse.success(res, null, 'All notifications marked as read');
});
