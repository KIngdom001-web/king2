import express from 'express';
import { sendMessage, getMessages } from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, sendMessage);
router.get('/:chatId', authenticate, getMessages);

export default router;

