import { WebSocketService } from './websocket.service';
import { INotification, NotificationType } from '../types/notification.types';
import { IOrder } from '../types/order.types';
import Restaurant from '../models/restaurant.model';

export class NotificationService {
  private wsService: WebSocketService;

  constructor() {
    this.wsService = WebSocketService.getInstance();
  }

  /**
   * Send order created notification to restaurant owner
   */
  public async notifyOrderCreated(order: IOrder): Promise<void> {
    const restaurant = await Restaurant.findById(order.restaurantId);
    
    if (restaurant) {
      const notification: INotification = {
        type: NotificationType.ORDER_CREATED,
        title: 'New Order!',
        message: `You have a new order #${order._id}`,
        data: { orderId: order._id },
        read: false
      };

      this.wsService.sendToUser(restaurant.ownerId.toString(), notification);
    }
  }

  /**
   * Send order status update notification to customer
   */
  public notifyOrderStatusUpdated(order: IOrder): void {
    const notification: INotification = {
      type: NotificationType.ORDER_STATUS_UPDATED,
      title: 'Order Status Updated',
      message: `Your order #${order._id} is now ${order.status}`,
      data: { orderId: order._id, status: order.status },
      read: false
    };

    this.wsService.sendToUser(order.customerId.toString(), notification);
  }

  /**
   * Send delivery update notification to customer
   */
  public notifyDeliveryUpdated(order: IOrder, location?: { lat: number; lng: number }): void {
    const notification: INotification = {
      type: NotificationType.ORDER_DELIVERY_UPDATED,
      title: 'Delivery Update',
      message: 'Your order delivery status has been updated',
      data: { orderId: order._id, location, status: order.status },
      read: false
    };

    this.wsService.sendToUser(order.customerId.toString(), notification);
  }

  /**
   * Send custom notification to a user
   */
  public sendCustomNotification(userId: string, title: string, message: string, data?: Record<string, any>): void {
    const notification: INotification = {
      type: NotificationType.CUSTOMER_NOTIFICATION,
      title,
      message,
      data,
      read: false
    };

    this.wsService.sendToUser(userId, notification);
  }
}
