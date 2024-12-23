import { Server } from 'socket.io';
import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { logError, logInfo } from '../utils/logger';

export default class WebSocketService {
  private io: Server;
  private userSockets: Map<string, string> = new Map();

  constructor(server: HTTPServer) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CLIENT_URL,
        methods: ['GET', 'POST']
      }
    });

    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          throw new Error('Authentication error');
        }
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { userId: string };
        socket.data.userId = decoded.userId;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket) => {
      const userId = socket.data.userId;
      this.userSockets.set(userId, socket.id);
      
      logInfo('User connected', { userId });

      socket.on('message', this.handleMessage(socket));
      socket.on('typing', this.handleTyping(socket));
      socket.on('disconnect', () => {
        this.userSockets.delete(userId);
        logInfo('User disconnected', { userId });
      });
    });
  }

  private handleMessage(socket: any) {
    return async (data: { chatId: string; content: string; receiverId: string }) => {
      try {
        // Handle message sending logic here
        const receiverSocket = this.userSockets.get(data.receiverId);
        if (receiverSocket) {
          this.io.to(receiverSocket).emit('newMessage', {
            senderId: socket.data.userId,
            ...data
          });
        }
      } catch (error) {
        logError('Error handling message', error);
        socket.emit('error', { message: 'Failed to send message' });
      }
    };
  }

  private handleTyping(socket: any) {
    return (data: { chatId: string; receiverId: string }) => {
      const receiverSocket = this.userSockets.get(data.receiverId);
      if (receiverSocket) {
        this.io.to(receiverSocket).emit('userTyping', {
          chatId: data.chatId,
          userId: socket.data.userId
        });
      }
    };
  }

  public sendToUser(userId: string, event: string, data: any) {
    const socketId = this.userSockets.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }
}

