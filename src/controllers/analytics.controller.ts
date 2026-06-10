import { Request, Response, NextFunction } from 'express';
import { AnalyticsService } from '../services/analytics.service';
import { BadRequestError } from '../utils/errors';

export class AnalyticsController {
  private analyticsService: AnalyticsService;

  constructor() {
    this.analyticsService = new AnalyticsService();
  }

  /**
   * Get sales data for a restaurant
   */
  public getSalesData = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId || !req.user.role) {
        throw new BadRequestError('User authentication required');
      }

      const { restaurantId } = req.params;
      const { period } = req.query;
      
      const salesData = await this.analyticsService.getSalesData(
        restaurantId, 
        req.user.userId, 
        req.user.role, 
        period as 'day' | 'week' | 'month'
      );

      res.status(200).json({
        status: 'success',
        data: salesData
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get key metrics for a restaurant
   */
  public getKeyMetrics = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId || !req.user.role) {
        throw new BadRequestError('User authentication required');
      }

      const { restaurantId } = req.params;
      
      const metrics = await this.analyticsService.getKeyMetrics(
        restaurantId, 
        req.user.userId, 
        req.user.role
      );

      res.status(200).json({
        status: 'success',
        data: metrics
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get popular menu items
   */
  public getPopularItems = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId || !req.user.role) {
        throw new BadRequestError('User authentication required');
      }

      const { restaurantId } = req.params;
      
      const items = await this.analyticsService.getPopularItems(
        restaurantId, 
        req.user.userId, 
        req.user.role
      );

      res.status(200).json({
        status: 'success',
        data: items
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get peak ordering times
   */
  public getPeakTimes = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId || !req.user.role) {
        throw new BadRequestError('User authentication required');
      }

      const { restaurantId } = req.params;
      
      const peakTimes = await this.analyticsService.getPeakTimes(
        restaurantId, 
        req.user.userId, 
        req.user.role
      );

      res.status(200).json({
        status: 'success',
        data: peakTimes
      });
    } catch (error) {
      next(error);
    }
  };
}
