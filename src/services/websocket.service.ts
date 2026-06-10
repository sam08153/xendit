import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { environment } from '../config/environment';
import { INotification } from '../types/notification.types';

export class WebSocketService {
  private static instance: WebSocketService;
  private io?: Server;

  private constructor() {}

  public static getInstance(): WebSocketService {
    if (!WebSocketService.instance) {
      WebSocketService.instance = new WebSocketService();
    }
    return WebSocketService.instance;
  }

  public init(httpServer: HttpServer): void {
    this.io = new Server(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token as string, environment.jwtSecret) as any;
        (socket as any).userId = decoded.userId;
        (socket as any).userRole = decoded.role;
        
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const userId = (socket as any).userId;
      
      // Join a room specific to the user
      socket.join(`user:${userId}`);

      console.log(`User ${userId} connected`);

      socket.on('disconnect', () => {
        console.log(`User ${userId} disconnected`);
      });
    });
  }

  /**
   * Send notification to a specific user
   */
  public sendToUser(userId: string, notification: INotification): void {
    if (this.io) {
      this.io.to(`user:${userId}`).emit('notification', notification);
    }
  }

  /**
   * Send notification to multiple users
   */
  public sendToUsers(userIds: string[], notification: INotification): void {
    userIds.forEach(userId => {
      this.sendToUser(userId, notification);
    });
  }

  /**
   * Broadcast notification to all connected clients
   */
  public broadcast(notification: INotification): void {
    if (this.io) {
      this.io.emit('notification', notification);
    }
  }
}
