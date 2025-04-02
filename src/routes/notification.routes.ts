import { Router } from 'express';
import { commonAuthMiddleware } from '../middlewares/commonAuth.middleware';
import { getUnreadNotifications, markRead, notificationList, sendNotificationFn } from '../controller/notification/notification.controller';

const router = Router();

router.post('/send-notification', sendNotificationFn)

router.get('/list', commonAuthMiddleware, notificationList); // get notifications list

router.get('/unread', commonAuthMiddleware, getUnreadNotifications); // get unread notifications

router.put('/mark-read', commonAuthMiddleware, markRead)//mark read


export { router as notificationRouter }; 