import { User } from './auth';

export interface Message {
  id: string;
  sender: User;
  content: string;
  type: 'text' | 'image' | 'file';
  status: 'sent' | 'delivered' | 'read';
  createdAt: Date;
  chatId: string;
}

export interface Chat {
  id: string;
  participants: User[];
  type: 'individual' | 'group';
  groupName?: string;
  groupAdmin?: User;
  lastMessage?: Message;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, type: 'text' | 'image' | 'file') => Promise<void>;
  fetchChats: () => Promise<void>;
  fetchMessages: (chatId: string) => Promise<void>;
  setActiveChat: (chat: Chat) => void;
  markAsRead: (messageId: string) => Promise<void>;
  startTyping: () => void;
  stopTyping: () => void;
}

