import express from 'express';
import { handleChatMessage, getConversationHistory } from '../controllers/chatController.js';

const router = express.Router();

router.post('/chat', handleChatMessage);
router.get('/conversations/:conversationId', getConversationHistory);

export default router;
