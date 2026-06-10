export enum LoyaltyTier {
  BRONZE = 'bronze',
  SILVER = 'silver',
  GOLD = 'gold',
  PLATINUM = 'platinum'
}

export interface ILoyaltyTierConfig {
  tier: LoyaltyTier;
  minPoints: number;
  multiplier: number; // Points earned per dollar spent
  benefits: string[];
}

export interface ILoyaltyPoints {
  userId: any;
  points: number;
  type: 'earned' | 'redeemed' | 'expired';
  orderId?: any;
  description?: string;
  expiresAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: any;
}

export interface IUserLoyalty {
  userId: any;
  tier: LoyaltyTier;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  currentBalance: number;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: any;
}

export interface IReward {
  name: string;
  description: string;
  pointsCost: number;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  _id?: any;
}

export interface IRedeemRequest {
  rewardId: string;
  orderId?: string;
}
