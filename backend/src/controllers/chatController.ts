import { Request, Response } from 'express';
import Chat from '../models/Chat';
import { validateChat } from '../utils/validation';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const createChat = async (req: Request, res: Response) => {
  try {
    const { error } = validateChat(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { participants, type, groupName } = req.body;
    const userId = req.user.id;

    if (!participants.includes(userId)) {
      participants.push(userId);
    }

    const newChat = new Chat({
      participants,
      type,
      groupName: type === 'group' ? groupName : undefined,
      groupAdmin: type === 'group' ? userId : undefined
    });

    await newChat.save();

    res.status(201).json(newChat);
  } catch (error) {
    logger.error('Error in createChat:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getChats = async (req: Request, res: Response) => {
  try {
    const userId = req.user.id;

    const chats = await Chat.find({ participants: userId })
      .populate('participants', 'name email')
      .populate('lastMessage')
      .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    logger.error('Error in getChats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

