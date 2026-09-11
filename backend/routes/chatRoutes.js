import express from 'express';
import {
  getConversations,
  getUnreadMessageCount,
  startConversation,
  getMessages,
  sendMessage
} from '../controllers/chatController.js';
import { verifyToken } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chat routes require authenticated session
router.use(verifyToken);

router.get('/unread-count', getUnreadMessageCount);
router.get('/conversations', getConversations);
router.post('/start', startConversation);
router.get('/conversations/:id/messages', getMessages);
router.post('/conversations/:id/messages', sendMessage);

export default router;
