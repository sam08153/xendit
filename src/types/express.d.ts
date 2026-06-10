import { UserRole } from './user.types';

/**
 * Extend Express Request interface with user information
 */
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: UserRole;
      };
    }
  }
}

/**
 * Interface for restaurant query parameters
 */
export interface RestaurantQueryParams {
  cuisine?: string | string[];
  rating?: string;
  search?: string;
  lat?: string;
  lng?: string;
  maxDistance?: string;
  isOpenNow?: string;
  maxDeliveryTime?: string;
  minOrderValue?: string;
  sortBy?: string;
}
