import { Router } from 'express';
import { getCollaborationMessages } from '../controller/collaboration/collaboration.controller';
import { notificationRouter } from './notification.routes';

const router = Router();

router.get('/collaboration/:collaborationId', getCollaborationMessages);

router.use('/notification', notificationRouter)

export { router }