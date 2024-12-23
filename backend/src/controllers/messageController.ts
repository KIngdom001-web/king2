import { Request, Response } from 'express';
import Message from '../models/Message';
import Chat from '../models/Chat';
import { validateMessage } from '../utils/validation';
import { AppError } from '../utils/errors';
import logger from '../utils/logger';

export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { error } = validateMessage(req.body);
    if (error) {
      throw new AppError(error.details[0].message, 400);
    }

    const { chatId, content, receiverId } = req.body;
    const senderId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    if (!chat.participants.includes(senderId) || !chat.participants.includes(receiverId)) {
      throw new AppError('Unauthorized to send message in this chat', 403);
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content,
      chatId
    });

    await newMessage.save();

    chat.lastMessage = newMessage._id;
    await chat.save();

    // Emit real-time event
    req.app.get('websocketService').sendToUser(receiverId, 'newMessage', newMessage);

    res.status(201).json(newMessage);
  } catch (error) {
    logger.error('Error in sendMessage:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

export const getMessages = async (req: Request, res: Response) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.id;

    const chat = await Chat.findById(chatId);
    if (!chat) {
      throw new AppError('Chat not found', 404);
    }

    if (!chat.participants.includes(userId)) {
      throw new AppError('Unauthorized to view messages in this chat', 403);
    }

    const messages = await Message.find({ chatId }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    logger.error('Error in getMessages:', error);
    if (error instanceof AppError) {
      res.status(error.statusCode).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
};

