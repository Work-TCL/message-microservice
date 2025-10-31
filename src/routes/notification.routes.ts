import { Router } from 'express';
import { commonAuthMiddleware } from '../middlewares/commonAuth.middleware';
import { getUnreadNotifications, markCollaborationRead, markRead, notificationList, sendNotificationFn } from '../controller/notification/notification.controller';

const router = Router();

router.post('/send-notification', sendNotificationFn)

router.get('/list', commonAuthMiddleware, notificationList); // get notifications list

router.get('/unread', commonAuthMiddleware, getUnreadNotifications); // get unread notifications

router.put('/mark-read', commonAuthMiddleware, markRead)//mark read

router.put('/mark-collaboration-read', commonAuthMiddleware, markCollaborationRead)//mark read

export { router as notificationRouter }; 