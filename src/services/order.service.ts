// src/services/order.service.ts
import Order from '../models/order.model';
import Restaurant from '../models/restaurant.model';
import MenuItem from '../models/menu.model';
import User from '../models/user.model';
import { IOrder, OrderStatus, PaymentStatus, IOrderItem } from '../types/order.types';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { LoyaltyService } from './loyalty.service';
import { NotificationService } from './notification.service';

function isTimeWithinRange(currentTime: string, openTime: string, closeTime: string): boolean {
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const current = parseTime(currentTime);
  const open = parseTime(openTime);
  const close = parseTime(closeTime);
  return current >= open && current <= close;
}

export class OrderService {
  private loyaltyService: LoyaltyService;
  private notificationService: NotificationService;
  
  constructor() {
    this.loyaltyService = new LoyaltyService();
    this.notificationService = new NotificationService();
  }
  
  public async getAllOrders(userId: string, role: string, filters?: any): Promise<IOrder[]> {
    const filter: any = {};
    
    // Filter orders based on user role
    if (role === 'customer') {
      filter.customerId = userId;
    } else if (role === 'restaurant') {
      // Get all restaurants owned by this user
      const restaurants = await Restaurant.find({ ownerId: userId });
      const restaurantIds = restaurants.map(restaurant => restaurant._id);
      filter.restaurantId = { $in: restaurantIds };
    } else if (role === 'delivery') {
      filter.deliveryPersonId = userId;
    }
    // Admin can see all orders (no role-based filter)
    
    // Apply additional filters
    if (filters?.isScheduled !== undefined) {
      filter.isScheduled = filters.isScheduled;
    }
    
    return Order.find(filter).sort({ createdAt: -1 });
  }
  
  public async getOrderById(id: string, userId: string, role: string): Promise<IOrder> {
    const order = await Order.findById(id);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    // Check if user has permission to view this order
    if (role === 'customer' && order.customerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to view this order');
    } else if (role === 'restaurant') {
      const restaurant = await Restaurant.findById(order.restaurantId);
      if (!restaurant || restaurant.ownerId.toString() !== userId) {
        throw new ForbiddenError('You are not authorized to view this order');
      }
    } else if (role === 'delivery' && order.deliveryPersonId?.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to view this order');
    }
    
    return order;
  }
  
  public async createOrder(orderData: Partial<IOrder>, userId: string): Promise<IOrder> {
    // Validate required fields
    if (!orderData.restaurantId || !orderData.items || orderData.items.length === 0) {
      throw new BadRequestError('Missing required order information');
    }
    
    // Verify restaurant exists
    const restaurant = await Restaurant.findById(orderData.restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    
    let scheduledDeliveryTime: Date | undefined;
    let isScheduled = false;
    
    // Handle scheduling if provided
    if (orderData.scheduledDeliveryTime) {
      scheduledDeliveryTime = new Date(orderData.scheduledDeliveryTime);
      
      // Validate scheduled time is in the future
      if (scheduledDeliveryTime <= new Date()) {
        throw new BadRequestError('Scheduled delivery time must be in the future');
      }
      
      isScheduled = true;
      
      // Validate restaurant is open at scheduled time
      const scheduledDate = new Date(scheduledDeliveryTime);
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[scheduledDate.getDay()];
      const hours = String(scheduledDate.getHours()).padStart(2, '0');
      const minutes = String(scheduledDate.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      const operatingHours = restaurant.operatingHours[dayName as keyof typeof restaurant.operatingHours];
      if (!operatingHours || !isTimeWithinRange(timeString, operatingHours.open, operatingHours.close)) {
        throw new BadRequestError(`Restaurant is not open at scheduled time (${timeString} on ${dayName})`);
      }
    }
    
    // Verify menu items exist and calculate prices
    let subtotal = 0;
    const orderItems: IOrderItem[] = [];
    
    for (const item of orderData.items) {
      const menuItem = await MenuItem.findById(item.menuItemId);
      if (!menuItem) {
        throw new NotFoundError(`Menu item ${item.menuItemId} not found`);
      }
      
      if (!menuItem.isAvailable) {
        throw new BadRequestError(`Menu item ${menuItem.name} is not available`);
      }
      
      // Calculate item price including customizations
      let itemPrice = menuItem.price;
      const customizations = [];
      
      if (item.customizations && item.customizations.length > 0) {
        for (const customization of item.customizations) {
          // Verify customization is valid
          const menuCustomization = menuItem.customizationOptions.find(
            opt => opt.name === customization.name
          );
          
          if (!menuCustomization) {
            throw new BadRequestError(`Invalid customization: ${customization.name}`);
          }
          
          const option = menuCustomization.options.find(
            opt => opt.name === customization.option
          );
          
          if (!option) {
            throw new BadRequestError(`Invalid option: ${customization.option} for ${customization.name}`);
          }
          
          itemPrice += option.price;
          customizations.push({
            name: customization.name,
            option: customization.option,
            price: option.price
          });
        }
      }
      
      const totalItemPrice = itemPrice * item.quantity;
      subtotal += totalItemPrice;
      
      orderItems.push({
        menuItemId: item.menuItemId,
        name: menuItem.name,
        quantity: item.quantity,
        price: itemPrice,
        customizations
      });
      
      // Increment order count for menu item
      menuItem.orderCount = (menuItem.orderCount || 0) + item.quantity;
      await menuItem.save();
    }
    
    // Calculate delivery fee and tax
    const deliveryFee = 2.99; // Fixed delivery fee for simplicity
    const taxRate = 0.08; // 8% tax rate
    const tax = subtotal * taxRate;
    const total = subtotal + deliveryFee + tax;
    
    // Get user address for delivery
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }
    
    // Create the order
    const order = await Order.create({
      customerId: userId,
      restaurantId: orderData.restaurantId,
      items: orderItems,
      subtotal,
      deliveryFee,
      tax,
      total,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      paymentMethod: orderData.paymentMethod || 'credit_card',
      deliveryAddress: orderData.deliveryAddress || user.address,
      specialInstructions: orderData.specialInstructions,
      scheduledDeliveryTime,
      isScheduled,
      estimatedDeliveryTime: isScheduled 
        ? scheduledDeliveryTime 
        : new Date(Date.now() + 45 * 60000) // 45 minutes from now
    });
    
    // Award loyalty points to the customer
    await this.loyaltyService.awardPoints(userId, order._id.toString(), order.total);
    
    // Send notification to restaurant owner about new order
    await this.notificationService.notifyOrderCreated(order);
    
    return order;
  }
  
  public async updateOrderStatus(id: string, status: OrderStatus, userId: string, role: string): Promise<IOrder> {
    const order = await Order.findById(id);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    // Check if user has permission to update this order
    if (role === 'restaurant') {
      const restaurant = await Restaurant.findById(order.restaurantId);
      if (!restaurant || restaurant.ownerId.toString() !== userId) {
        throw new ForbiddenError('You are not authorized to update this order');
      }
      
      // Restaurant can only update to these statuses
      const allowedStatuses = [
        OrderStatus.CONFIRMED,
        OrderStatus.PREPARING,
        OrderStatus.CANCELLED
      ];
      
      if (!allowedStatuses.includes(status)) {
        throw new BadRequestError(`Restaurant cannot set order status to ${status}`);
      }
    } else if (role === 'delivery') {
      if (order.deliveryPersonId?.toString() !== userId) {
        throw new ForbiddenError('You are not authorized to update this order');
      }
      
      // Delivery person can only update to these statuses
      const allowedStatuses = [
        OrderStatus.OUT_FOR_DELIVERY,
        OrderStatus.DELIVERED
      ];
      
      if (!allowedStatuses.includes(status)) {
        throw new BadRequestError(`Delivery person cannot set order status to ${status}`);
      }
    } else if (role === 'customer') {
      if (order.customerId.toString() !== userId) {
        throw new ForbiddenError('You are not authorized to update this order');
      }
      
      // Customer can only cancel the order
      if (status !== OrderStatus.CANCELLED) {
        throw new BadRequestError('Customer can only cancel the order');
      }
      
      // Customer can only cancel if order is still pending or confirmed
      if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
        throw new BadRequestError('Cannot cancel order that is already being prepared or delivered');
      }
    }
    
    // Update order status
    order.status = status;
    
    // If order is delivered, set actual delivery time
    if (status === OrderStatus.DELIVERED) {
      order.actualDeliveryTime = new Date();
    }
    
    await order.save();
    
    // Send notification to customer about status update
    this.notificationService.notifyOrderStatusUpdated(order);
    
    return order;
  }
  
  public async assignDeliveryPerson(id: string, deliveryPersonId: string): Promise<IOrder> {
    const order = await Order.findById(id);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    // Verify delivery person exists and has delivery role
    const deliveryPerson = await User.findById(deliveryPersonId);
    if (!deliveryPerson || deliveryPerson.role !== 'delivery') {
      throw new BadRequestError('Invalid delivery person');
    }
    
    // Assign delivery person
    order.deliveryPersonId = deliveryPersonId;
    await order.save();
    
    return order;
  }
  
  public async cancelOrder(id: string, userId: string, role: string): Promise<void> {
    const order = await Order.findById(id);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    // Check if user has permission to cancel this order
    if (role === 'customer' && order.customerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to cancel this order');
    } else if (role === 'restaurant') {
      const restaurant = await Restaurant.findById(order.restaurantId);
      if (!restaurant || restaurant.ownerId.toString() !== userId) {
        throw new ForbiddenError('You are not authorized to cancel this order');
      }
    }
    
    // Can only cancel if order is still pending or confirmed
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BadRequestError('Cannot cancel order that is already being prepared or delivered');
    }
    
    // Update order status
    order.status = OrderStatus.CANCELLED;
    await order.save();
  }
  
  public async updateScheduledOrder(id: string, updateData: Partial<IOrder>, userId: string, role: string): Promise<IOrder> {
    const order = await Order.findById(id);
    
    if (!order) {
      throw new NotFoundError('Order not found');
    }
    
    // Check permissions
    if (role === 'customer' && order.customerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to update this order');
    }
    
    // Only allow updating scheduled orders that are still pending/confirmed
    if (![OrderStatus.PENDING, OrderStatus.CONFIRMED].includes(order.status)) {
      throw new BadRequestError('Cannot update order that is already being prepared or delivered');
    }
    
    // Handle scheduled delivery time update
    if (updateData.scheduledDeliveryTime) {
      const newScheduledTime = new Date(updateData.scheduledDeliveryTime);
      
      if (newScheduledTime <= new Date()) {
        throw new BadRequestError('Scheduled delivery time must be in the future');
      }
      
      // Validate restaurant is open at new scheduled time
      const restaurant = await Restaurant.findById(order.restaurantId);
      if (!restaurant) {
        throw new NotFoundError('Restaurant not found');
      }
      
      const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const dayName = days[newScheduledTime.getDay()];
      const hours = String(newScheduledTime.getHours()).padStart(2, '0');
      const minutes = String(newScheduledTime.getMinutes()).padStart(2, '0');
      const timeString = `${hours}:${minutes}`;
      
      const operatingHours = restaurant.operatingHours[dayName as keyof typeof restaurant.operatingHours];
      if (!operatingHours || !isTimeWithinRange(timeString, operatingHours.open, operatingHours.close)) {
        throw new BadRequestError(`Restaurant is not open at scheduled time (${timeString} on ${dayName})`);
      }
      
      order.scheduledDeliveryTime = newScheduledTime;
      order.estimatedDeliveryTime = newScheduledTime;
      order.isScheduled = true;
    }
    
    // Update other allowed fields
    if (updateData.specialInstructions) {
      order.specialInstructions = updateData.specialInstructions;
    }
    
    if (updateData.deliveryAddress) {
      order.deliveryAddress = updateData.deliveryAddress;
    }
    
    await order.save();
    return order;
  }
}
