import Order from '../models/order.model';
import Restaurant from '../models/restaurant.model';
import { NotFoundError, ForbiddenError } from '../utils/errors';

export class AnalyticsService {
  /**
   * Get sales data aggregated by day/week/month for a restaurant
   */
  public async getSalesData(
    restaurantId: string, 
    userId: string, 
    userRole: string, 
    period: 'day' | 'week' | 'month' = 'day'
  ) {
    // Verify user has access to this restaurant
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    if (userRole !== 'admin' && restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('Not authorized to access this restaurant\'s analytics');
    }

    const dateFormat = period === 'day' 
      ? '%Y-%m-%d' 
      : period === 'week' 
        ? '%Y-%U' 
        : '%Y-%m';

    const salesData = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: {
              format: dateFormat,
              date: '$createdAt'
            }
          },
          totalSales: { $sum: '$total' },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return salesData;
  }

  /**
   * Get key metrics for a restaurant
   */
  public async getKeyMetrics(restaurantId: string, userId: string, userRole: string) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    if (userRole !== 'admin' && restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('Not authorized to access this restaurant\'s analytics');
    }

    const metrics = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$total' },
          totalOrders: { $sum: 1 },
          averageOrderValue: { $avg: '$total' }
        }
      }
    ]);

    // Calculate customer retention
    const customerData = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $group: {
          _id: '$customerId',
          orderCount: { $sum: 1 }
        }
      },
      {
        $group: {
          _id: null,
          totalCustomers: { $sum: 1 },
          repeatCustomers: {
            $sum: {
              $cond: [{ $gte: ['$orderCount', 2] }, 1, 0]
            }
          }
        }
      }
    ]);

    return {
      totalRevenue: metrics[0]?.totalRevenue || 0,
      totalOrders: metrics[0]?.totalOrders || 0,
      averageOrderValue: metrics[0]?.averageOrderValue || 0,
      totalCustomers: customerData[0]?.totalCustomers || 0,
      repeatCustomers: customerData[0]?.repeatCustomers || 0,
      retentionRate: customerData[0]?.totalCustomers 
        ? (customerData[0].repeatCustomers / customerData[0].totalCustomers) * 100 
        : 0
    };
  }

  /**
   * Get popular menu items (needs MenuItem updates, but we'll return order count data)
   */
  public async getPopularItems(restaurantId: string, userId: string, userRole: string) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    if (userRole !== 'admin' && restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('Not authorized to access this restaurant\'s analytics');
    }

    const popularItems = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $unwind: '$items'
      },
      {
        $group: {
          _id: '$items.menuItemId',
          name: { $first: '$items.name' },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }
        }
      },
      {
        $sort: { totalQuantity: -1 }
      },
      {
        $limit: 10
      }
    ]);

    return popularItems;
  }

  /**
   * Get peak ordering times
   */
  public async getPeakTimes(restaurantId: string, userId: string, userRole: string) {
    const restaurant = await Restaurant.findById(restaurantId);
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }

    if (userRole !== 'admin' && restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('Not authorized to access this restaurant\'s analytics');
    }

    const peakTimes = await Order.aggregate([
      {
        $match: {
          restaurantId: restaurant._id,
          status: { $nin: ['cancelled'] }
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          orderCount: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    return peakTimes;
  }
}
