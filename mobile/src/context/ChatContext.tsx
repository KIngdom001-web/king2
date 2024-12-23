import React, { createContext, useContext, useState, useEffect } from 'react';
import { Chat, Message, ChatContextType, MessageStatus } from '../types/chat';
import { useAuth } from './AuthContext';
import { chatService } from '../services/chatService';
import { websocketService } from '../services/websocket';

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC = ({ children }) => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typingUsers, setTypingUsers] = useState<Record<string, string[]>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchChats();
      websocketService.connect(user.id);
      websocketService.onNewMessage(handleNewMessage);
      websocketService.onMessageStatusUpdate(handleMessageStatusUpdate);
      websocketService.onUserTyping(handleUserTyping);
    }

    return () => {
      websocketService.disconnect();
    };
  }, [user]);

  const fetchChats = async () => {
    setIsLoading(true);
    try {
      const fetchedChats = await chatService.getChats();
      setChats(fetchedChats);
    } catch (err) {
      setError('Failed to fetch chats');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string, reset: boolean = false) => {
    setIsLoading(true);
    try {
      const newPage = reset ? 1 : page;
      const fetchedMessages = await chatService.getMessages(chatId, newPage);
      if (reset) {
        setMessages(fetchedMessages);
      } else {
        setMessages(prevMessages => [...prevMessages, ...fetchedMessages]);
      }
      setHasMore(fetchedMessages.length === 20); // Assuming 20 is the page size
      setPage(newPage + 1);

      // Mark fetched messages as read
      fetchedMessages.forEach(message => {
        if (message.sender.id !== user?.id && message.status !== 'read') {
          markMessageAsRead(message.id);
        }
      });
    } catch (err) {
      setError('Failed to fetch messages');
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (chatId: string, content: string, type: 'text' | 'image' | 'file') => {
    if (!user) {
      setError('User not authenticated');
      return;
    }
    try {
      const receiverId = activeChat?.participants.find(p => p.id !== user.id)?.id;
      if (!receiverId) {
        throw new Error('Receiver not found');
      }
      const newMessage = await chatService.sendMessage(chatId, user.id, receiverId, content, type);
      
      // Update message status to "delivered" immediately after sending
      const deliveredMessage = { ...newMessage, status: 'delivered' as MessageStatus };
      setMessages(prevMessages => [deliveredMessage, ...prevMessages]);
      updateChatWithNewMessage(chatId, deliveredMessage);
      
      // Emit message delivered event
      websocketService.emitMessageDelivered(newMessage.id);
    } catch (err) {
      setError('Failed to send message');
    }
  };

  const updateMessageStatus = async (messageId: string, status: MessageStatus) => {
    try {
      await chatService.updateMessageStatus(messageId, status);
      setMessages(prevMessages =>
        prevMessages.map(msg =>
          msg.id === messageId ? { ...msg, status } : msg
        )
      );
      // Emit message status update event
      if (status === 'read') {
        websocketService.emitMessageRead(messageId);
      }
    } catch (err) {
      setError('Failed to update message status');
    }
  };

  const markMessageAsRead = (messageId: string) => {
    updateMessageStatus(messageId, 'read');
  };

  const setActiveChatById = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setActiveChat(chat);
      fetchMessages(chatId, true);
    }
  };

  const startTyping = (chatId: string) => {
    websocketService.emitTyping(chatId);
  };

  const stopTyping = (chatId: string) => {
    websocketService.emitStopTyping(chatId);
  };

  const handleNewMessage = (message: Message) => {
    if (message.chatId === activeChat?.id) {
      setMessages(prevMessages => [message, ...prevMessages]);
      if (message.sender.id !== user?.id) {
        markMessageAsRead(message.id);
      }
    }
    updateChatWithNewMessage(message.chatId, message);
  };

  const handleMessageStatusUpdate = (data: { messageId: string; status: MessageStatus }) => {
    setMessages(prevMessages =>
      prevMessages.map(msg =>
        msg.id === data.messageId ? { ...msg, status: data.status } : msg
      )
    );
  };

  const handleUserTyping = (data: { chatId: string; userId: string }) => {
    setTypingUsers(prevTypingUsers => ({
      ...prevTypingUsers,
      [data.chatId]: [...(prevTypingUsers[data.chatId] || []), data.userId]
    }));

    // Remove typing indicator after 3 seconds
    setTimeout(() => {
      setTypingUsers(prevTypingUsers => ({
        ...prevTypingUsers,
        [data.chatId]: prevTypingUsers[data.chatId]?.filter(id => id !== data.userId) || []
      }));
    }, 3000);
  };

  const updateChatWithNewMessage = (chatId: string, message: Message) => {
    setChats(prevChats =>
      prevChats.map(chat =>
        chat.id === chatId ? { ...chat, lastMessage: message } : chat
      )
    );
  };

  const value: ChatContextType = {
    chats,
    activeChat,
    messages,
    isLoading,
    error,
    hasMore,
    typingUsers,
    sendMessage,
    fetchChats,
    fetchMessages,
    setActiveChatById,
    updateMessageStatus,
    markMessageAsRead,
    startTyping,
    stopTyping,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

