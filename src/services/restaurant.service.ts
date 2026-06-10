// src/services/restaurant.service.ts
import Restaurant from '../models/restaurant.model';
import { IRestaurant } from '../types/restaurant.types';
import { RestaurantQueryParams } from '../types/express';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import { isTimeWithinRange, getCurrentDayAndTime } from '../utils/datetime';

// Sort option configuration
const SORT_OPTIONS: Record<string, Record<string, 1 | -1>> = {
  rating: { rating: -1 },
  deliveryTime: { averageDeliveryTime: 1 },
  minOrder: { minimumOrderValue: 1 },
  name: { name: 1 }
};

export class RestaurantService {
  public async getAllRestaurants(query: RestaurantQueryParams = {}): Promise<IRestaurant[]> {
    const { 
      cuisine, 
      rating, 
      search,
      lat,
      lng,
      maxDistance,
      isOpenNow,
      maxDeliveryTime,
      minOrderValue,
      sortBy
    } = query;

    // Build filter object
    const filter = this.buildFilter({
      cuisine,
      rating,
      search,
      lat,
      lng,
      maxDistance,
      maxDeliveryTime,
      minOrderValue
    });

    // Get sort option
    const sortOption = this.getSortOption(sortBy);

    // Fetch restaurants
    let restaurants = await Restaurant.find(filter).sort(sortOption);

    // Apply isOpenNow filter
    if (isOpenNow === 'true') {
      restaurants = this.filterOpenRestaurants(restaurants);
    }

    return restaurants;
  }

  /**
   * Build MongoDB filter from query parameters
   */
  private buildFilter(params: {
    cuisine?: string | string[];
    rating?: string;
    search?: string;
    lat?: string;
    lng?: string;
    maxDistance?: string;
    maxDeliveryTime?: string;
    minOrderValue?: string;
  }): any {
    const filter: any = { isActive: true };

    if (params.cuisine) {
      filter.cuisine = { 
        $in: Array.isArray(params.cuisine) ? params.cuisine : [params.cuisine] 
      };
    }

    if (params.rating) {
      filter.rating = { $gte: Number(params.rating) };
    }

    if (params.search) {
      filter.$text = { $search: params.search };
    }

    if (params.maxDeliveryTime) {
      filter.averageDeliveryTime = { $lte: Number(params.maxDeliveryTime) };
    }

    if (params.minOrderValue) {
      filter.minimumOrderValue = { $gte: Number(params.minOrderValue) };
    }

    if (params.lat && params.lng) {
      const distance = params.maxDistance ? Number(params.maxDistance) : 5000;
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(params.lng), Number(params.lat)]
          },
          $maxDistance: distance
        }
      };
    }

    return filter;
  }

  /**
   * Get sort option from query parameter
   */
  private getSortOption(sortBy?: string): any {
    return SORT_OPTIONS[sortBy || ''] || SORT_OPTIONS.rating;
  }

  /**
   * Filter restaurants by current operating hours
   */
  private filterOpenRestaurants(restaurants: any[]): any[] {
    const { day, time } = getCurrentDayAndTime();
    return restaurants.filter(restaurant => {
      const hours = restaurant.operatingHours[day as keyof typeof restaurant.operatingHours];
      return hours && isTimeWithinRange(time, hours.open, hours.close);
    });
  }
  
  public async getRestaurantById(id: string): Promise<IRestaurant> {
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    
    return restaurant;
  }
  
  public async createRestaurant(restaurantData: IRestaurant, userId: string): Promise<IRestaurant> {
    // Set the owner ID to the current user
    restaurantData.ownerId = userId;
    
    // Validate required fields
    if (!restaurantData.name || !restaurantData.description || !restaurantData.address) {
      throw new BadRequestError('Missing required restaurant information');
    }
    
    return Restaurant.create(restaurantData);
  }
  
  public async updateRestaurant(id: string, restaurantData: Partial<IRestaurant>, userId: string): Promise<IRestaurant> {
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    
    // Check if the user is the owner of the restaurant
    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to update this restaurant');
    }
    
    // Update the restaurant
    Object.assign(restaurant, restaurantData);
    await restaurant.save();
    
    return restaurant;
  }
  
  public async deleteRestaurant(id: string, userId: string): Promise<void> {
    const restaurant = await Restaurant.findById(id);
    
    if (!restaurant) {
      throw new NotFoundError('Restaurant not found');
    }
    
    // Check if the user is the owner of the restaurant
    if (restaurant.ownerId.toString() !== userId) {
      throw new ForbiddenError('You are not authorized to delete this restaurant');
    }
    
    await Restaurant.findByIdAndDelete(id);
  }
  
  public async getNearbyRestaurants(lat: number, lng: number, maxDistance: number = 5000): Promise<IRestaurant[]> {
    return Restaurant.find({
      location: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          $maxDistance: maxDistance
        }
      },
      isActive: true
    }).limit(20);
  }
}
