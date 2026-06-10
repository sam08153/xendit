import { Request, Response, NextFunction } from 'express';
import { LoyaltyService } from '../services/loyalty.service';
import { BadRequestError } from '../utils/errors';

export class LoyaltyController {
  private loyaltyService: LoyaltyService;

  constructor() {
    this.loyaltyService = new LoyaltyService();
  }

  /**
   * Get user's loyalty profile (balance, tier, etc.)
   */
  public getLoyaltyProfile = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new BadRequestError('User ID is required');
      }

      const profile = await this.loyaltyService.getOrCreateUserLoyalty(req.user.userId);

      res.status(200).json({
        status: 'success',
        data: {
          profile
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's point transaction history
   */
  public getPointHistory = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new BadRequestError('User ID is required');
      }

      const history = await this.loyaltyService.getPointHistory(req.user.userId);

      res.status(200).json({
        status: 'success',
        results: history.length,
        data: {
          history
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get all available rewards
   */
  public getAvailableRewards = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      const rewards = await this.loyaltyService.getAvailableRewards();

      res.status(200).json({
        status: 'success',
        results: rewards.length,
        data: {
          rewards
        }
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Redeem points for a reward
   */
  public redeemReward = async (req: any, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user || !req.user.userId) {
        throw new BadRequestError('User ID is required');
      }

      const { rewardId, orderId } = req.body;

      if (!rewardId) {
        throw new BadRequestError('Reward ID is required');
      }

      const result = await this.loyaltyService.redeemPoints(
        req.user.userId,
        rewardId,
        orderId
      );

      res.status(200).json({
        status: 'success',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };
}
