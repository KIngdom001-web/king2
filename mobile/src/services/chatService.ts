import axios from 'axios';
import { Chat, Message, MessageStatus } from '../types/chat';

const API_URL = process.env.REACT_APP_API_URL;

export const chatService = {
  getChats: async (): Promise<Chat[]> => {
    try {
      const response = await axios.get(`${API_URL}/chats`);
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch chats');
    }
  },

  getMessages: async (chatId: string, page: number = 1, limit: number = 20): Promise<Message[]> => {
    try {
      const response = await axios.get(`${API_URL}/messages/${chatId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch messages');
    }
  },

  sendMessage: async (chatId: string, senderId: string, receiverId: string, content: string, type: 'text' | 'image' | 'file'): Promise<Message> => {
    try {
      const response = await axios.post(`${API_URL}/messages`, {
        chatId,
        senderId,
        receiverId,
        content,
        type
      });
      return response.data;
    } catch (error) {
      throw new Error('Failed to send message');
    }
  },

  updateMessageStatus: async (messageId: string, status: MessageStatus): Promise<void> => {
    try {
      await axios.patch(`${API_URL}/messages/${messageId}/status`, { status });
    } catch (error) {
      throw new Error('Failed to update message status');
    }
  },

  markMessageAsRead: async (messageId: string): Promise<void> => {
    try {
      await this.updateMessageStatus(messageId, 'read');
    } catch (error) {
      throw new Error('Failed to mark message as read');
    }
  }
};

