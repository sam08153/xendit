import mongoose, { Schema, Document } from 'mongoose';
import { 
  ILoyaltyPoints, 
  IUserLoyalty, 
  IReward, 
  LoyaltyTier 
} from '../types/loyalty.types';

// Loyalty Points Transaction Schema
const loyaltyPointsSchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    points: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      enum: ['earned', 'redeemed', 'expired'],
      required: true,
    },
    orderId: {
      type: Schema.Types.ObjectId,
      ref: 'Order',
    },
    description: {
      type: String,
    },
    expiresAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

loyaltyPointsSchema.index({ userId: 1, createdAt: -1 });
loyaltyPointsSchema.index({ expiresAt: 1, type: 1 });

// User Loyalty Schema
const userLoyaltySchema: Schema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    tier: {
      type: String,
      enum: Object.values(LoyaltyTier),
      default: LoyaltyTier.BRONZE,
    },
    totalPointsEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    totalPointsRedeemed: {
      type: Number,
      default: 0,
      min: 0,
    },
    currentBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

userLoyaltySchema.index({ userId: 1 });
userLoyaltySchema.index({ tier: 1 });

// Reward Schema
const rewardSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    pointsCost: {
      type: Number,
      required: true,
      min: 0,
    },
    discountType: {
      type: String,
      enum: ['percentage', 'fixed'],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

rewardSchema.index({ isActive: 1 });

export const LoyaltyPoints = mongoose.model<ILoyaltyPoints & Document>('LoyaltyPoints', loyaltyPointsSchema);
export const UserLoyalty = mongoose.model<IUserLoyalty & Document>('UserLoyalty', userLoyaltySchema);
export const Reward = mongoose.model<IReward & Document>('Reward', rewardSchema);
