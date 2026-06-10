import { 
  LoyaltyPoints, 
  UserLoyalty, 
  Reward 
} from '../models/loyalty.model';
import { 
  IReward, 
  LoyaltyTier, 
  ILoyaltyTierConfig 
} from '../types/loyalty.types';
import { NotFoundError, BadRequestError } from '../utils/errors';

// Loyalty tier configuration
const LOYALTY_TIER_CONFIGS: ILoyaltyTierConfig[] = [
  {
    tier: LoyaltyTier.BRONZE,
    minPoints: 0,
    multiplier: 1,
    benefits: ['1 point per $1 spent']
  },
  {
    tier: LoyaltyTier.SILVER,
    minPoints: 500,
    multiplier: 1.5,
    benefits: ['1.5 points per $1 spent', 'Free delivery on orders over $30']
  },
  {
    tier: LoyaltyTier.GOLD,
    minPoints: 1500,
    multiplier: 2,
    benefits: ['2 points per $1 spent', 'Free delivery on all orders', 'Priority customer support']
  },
  {
    tier: LoyaltyTier.PLATINUM,
    minPoints: 5000,
    multiplier: 3,
    benefits: ['3 points per $1 spent', 'Free delivery on all orders', 'Priority customer support', 'Exclusive monthly rewards']
  }
];

// Point expiration config (30 days by default)
const POINTS_EXPIRATION_DAYS = 30;

export class LoyaltyService {
  /**
   * Get or create user loyalty profile
   */
  public async getOrCreateUserLoyalty(userId: string): Promise<any> {
    let userLoyalty = await UserLoyalty.findOne({ userId });
    
    if (!userLoyalty) {
      userLoyalty = await UserLoyalty.create({
        userId,
        tier: LoyaltyTier.BRONZE,
        totalPointsEarned: 0,
        totalPointsRedeemed: 0,
        currentBalance: 0
      });
    }
    
    return userLoyalty;
  }

  /**
   * Calculate points earned for an order
   */
  public calculatePointsEarned(orderTotal: number, tier: LoyaltyTier): number {
    const config = LOYALTY_TIER_CONFIGS.find(c => c.tier === tier) || LOYALTY_TIER_CONFIGS[0];
    return Math.floor(orderTotal * config.multiplier);
  }

  /**
   * Award points to a user for an order
   */
  public async awardPoints(userId: string, orderId: string, orderTotal: number): Promise<any> {
    const userLoyalty = await this.getOrCreateUserLoyalty(userId);
    const pointsEarned = this.calculatePointsEarned(orderTotal, userLoyalty.tier);
    
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + POINTS_EXPIRATION_DAYS);
    
    const transaction = await LoyaltyPoints.create({
      userId,
      points: pointsEarned,
      type: 'earned',
      orderId,
      description: `Points earned for order ${orderId}`,
      expiresAt
    });
    
    // Update user loyalty
    userLoyalty.totalPointsEarned += pointsEarned;
    userLoyalty.currentBalance += pointsEarned;
    
    // Check for tier upgrade
    userLoyalty.tier = this.determineTier(userLoyalty.totalPointsEarned);
    
    await userLoyalty.save();
    
    return transaction;
  }

  /**
   * Determine user's tier based on total points earned
   */
  private determineTier(totalPointsEarned: number): LoyaltyTier {
    let tier = LoyaltyTier.BRONZE;
    
    for (const config of LOYALTY_TIER_CONFIGS) {
      if (totalPointsEarned >= config.minPoints) {
        tier = config.tier;
      }
    }
    
    return tier;
  }

  /**
   * Get all available active rewards
   */
  public async getAvailableRewards(): Promise<IReward[]> {
    return Reward.find({ isActive: true });
  }

  /**
   * Redeem points for a reward
   */
  public async redeemPoints(userId: string, rewardId: string, orderId?: string): Promise<any> {
    const userLoyalty = await this.getOrCreateUserLoyalty(userId);
    const reward = await Reward.findById(rewardId);
    
    if (!reward) {
      throw new NotFoundError('Reward not found');
    }
    
    if (!reward.isActive) {
      throw new BadRequestError('Reward is no longer active');
    }
    
    if (userLoyalty.currentBalance < reward.pointsCost) {
      throw new BadRequestError('Insufficient points');
    }
    
    // Create redemption transaction
    const transaction = await LoyaltyPoints.create({
      userId,
      points: -reward.pointsCost,
      type: 'redeemed',
      orderId,
      description: `Redeemed ${reward.name}`
    });
    
    // Update user loyalty
    userLoyalty.totalPointsRedeemed += reward.pointsCost;
    userLoyalty.currentBalance -= reward.pointsCost;
    
    await userLoyalty.save();
    
    return { transaction, reward };
  }

  /**
   * Get user's loyalty point history
   */
  public async getPointHistory(userId: string): Promise<any[]> {
    return LoyaltyPoints.find({ userId }).sort({ createdAt: -1 });
  }

  /**
   * Expire points that are past their expiration date
   */
  public async expirePoints(): Promise<void> {
    const now = new Date();
    
    // Find all earned points that have expired and haven't been processed yet
    const expiredPoints = await LoyaltyPoints.find({
      type: 'earned',
      expiresAt: { $lt: now }
    });
    
    for (const points of expiredPoints) {
      // Mark as expired
      points.type = 'expired';
      await points.save();
      
      // Update user's balance
      const userLoyalty = await UserLoyalty.findOne({ userId: points.userId });
      if (userLoyalty) {
        userLoyalty.currentBalance -= Math.abs(points.points);
        await userLoyalty.save();
      }
    }
  }
}
