import { Router } from 'express';
import { AnalyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const analyticsController = new AnalyticsController();

router.get(
  '/restaurants/:restaurantId/sales',
  authenticate,
  analyticsController.getSalesData
);

router.get(
  '/restaurants/:restaurantId/metrics',
  authenticate,
  analyticsController.getKeyMetrics
);

router.get(
  '/restaurants/:restaurantId/popular-items',
  authenticate,
  analyticsController.getPopularItems
);

router.get(
  '/restaurants/:restaurantId/peak-times',
  authenticate,
  analyticsController.getPeakTimes
);

export default router;
