import io, { Socket } from 'socket.io-client';
import { Message, MessageStatus } from '../types/chat';

class WebSocketService {
  private socket: Socket | null = null;
  private connectionState: 'disconnected' | 'connecting' | 'connected' = 'disconnected';

  connect(userId: string) {
    if (this.connectionState === 'connecting' || this.connectionState === 'connected') {
      console.warn('WebSocket connection already in progress or established');
      return;
    }

    this.connectionState = 'connecting';
    this.socket = io(process.env.REACT_APP_WS_URL!, {
      query: { userId },
      transports: ['websocket']
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.connectionState = 'connected';
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      this.connectionState = 'disconnected';
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('WebSocket connection error:', error);
      this.connectionState = 'disconnected';
      this.emitError('Connection failed', error.message);
    });

    this.socket.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
      this.emitError('WebSocket error occurred', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connectionState = 'disconnected';
    }
  }

  onNewMessage(callback: (message: Message) => void) {
    this.socket?.on('newMessage', callback);
  }

  onMessageStatusUpdate(callback: (data: { messageId: string; status: MessageStatus }) => void) {
    this.socket?.on('messageStatusUpdate', callback);
  }

  onUserTyping(callback: (data: { chatId: string; userId: string }) => void) {
    this.socket?.on('userTyping', callback);
  }

  emitTyping(chatId: string) {
    this.emitEvent('typing', { chatId });
  }

  emitStopTyping(chatId: string) {
    this.emitEvent('stopTyping', { chatId });
  }

  emitMessageDelivered(messageId: string) {
    this.emitEvent('messageDelivered', { messageId });
  }

  emitMessageRead(messageId: string) {
    this.emitEvent('messageRead', { messageId });
  }

  private emitEvent(eventName: string, data: any) {
    if (this.connectionState !== 'connected') {
      const errorMessage = `Cannot emit ${eventName}: WebSocket not connected`;
      console.warn(errorMessage);
      this.emitError('Emit failed', errorMessage);
      return;
    }

    try {
      this.socket?.emit(eventName, data);
    } catch (error) {
      const errorMessage = `Failed to emit ${eventName}`;
      console.error(errorMessage, error);
      this.emitError('Emit failed', errorMessage);
    }
  }

  private emitError(type: string, details: string) {
    if (this.socket) {
      this.socket.emit('clientError', { type, details });
    }
  }
}

export const websocketService = new WebSocketService();

