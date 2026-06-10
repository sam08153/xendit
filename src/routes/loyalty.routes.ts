import { Router } from 'express';
import { LoyaltyController } from '../controllers/loyalty.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { UserRole } from '../types/user.types';

const router = Router();
const loyaltyController = new LoyaltyController();

// Protected routes - Customer only
router.get(
  '/profile',
  authenticate,
  authorize(UserRole.CUSTOMER),
  loyaltyController.getLoyaltyProfile
);

router.get(
  '/history',
  authenticate,
  authorize(UserRole.CUSTOMER),
  loyaltyController.getPointHistory
);

router.get(
  '/rewards',
  authenticate,
  loyaltyController.getAvailableRewards
);

router.post(
  '/redeem',
  authenticate,
  authorize(UserRole.CUSTOMER),
  loyaltyController.redeemReward
);

export default router;
