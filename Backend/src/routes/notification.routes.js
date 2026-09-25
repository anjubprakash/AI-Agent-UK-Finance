import { Router } from 'express';
import { getMyNotifications, markAsRead, markAllAsRead } from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js';

const router = Router();

// Get employee notifications
router.get('/', authenticate, getMyNotifications);

// Mark specific notification as read
router.patch('/:id/read', authenticate, markAsRead);

// Mark all notifications as read
router.patch('/read-all', authenticate, markAllAsRead);

export default router;
