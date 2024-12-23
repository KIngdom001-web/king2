import express from 'express';
import { createChat, getChats } from '../controllers/chatController';
import { authenticate } from '../middleware/auth';

const router = express.Router();

router.post('/', authenticate, createChat);
router.get('/', authenticate, getChats);

export default router;

