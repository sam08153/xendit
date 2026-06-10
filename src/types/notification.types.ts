export enum NotificationType {
  ORDER_CREATED = 'order.created',
  ORDER_STATUS_UPDATED = 'order.status_updated',
  ORDER_DELIVERY_UPDATED = 'order.delivery_updated',
  RESTAURANT_NOTIFICATION = 'restaurant.notification',
  DELIVERY_NOTIFICATION = 'delivery.notification',
  CUSTOMER_NOTIFICATION = 'customer.notification'
}

export interface INotification {
  _id?: string;
  userId?: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
