// src/services/restaurant.service.ts
import Restaurant from '../models/restaurant.model';
import { IRestaurant } from '../types/restaurant.types';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';

function isTimeWithinRange(currentTime: string, openTime: string, closeTime: string): boolean {
  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };
  const current = parseTime(currentTime);
  const open = parseTime(openTime);
  const close = parseTime(closeTime);
  return current >= open && current <= close;
}

function getCurrentDayAndTime(): { day: string; time: string } {
  const now = new Date();
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const day = days[now.getDay()];
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const time = `${hours}:${minutes}`;
  return { day, time };
}

export class RestaurantService {
  public async getAllRestaurants(query: any = {}): Promise<IRestaurant[]> {
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
    
    const filter: any = { isActive: true };
    
    if (cuisine) {
      filter.cuisine = { $in: Array.isArray(cuisine) ? cuisine : [cuisine] };
    }
    
    if (rating) {
      filter.rating = { $gte: Number(rating) };
    }
    
    if (search) {
      filter.$text = { $search: search };
    }
    
    if (maxDeliveryTime) {
      filter.averageDeliveryTime = { $lte: Number(maxDeliveryTime) };
    }
    
    if (minOrderValue) {
      filter.minimumOrderValue = { $gte: Number(minOrderValue) };
    }
    
    if (lat && lng) {
      const distance = maxDistance ? Number(maxDistance) : 5000;
      filter.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [Number(lng), Number(lat)]
          },
          $maxDistance: distance
        }
      };
    }

    let sortOption: any = { rating: -1 };
    
    if (sortBy) {
      switch (sortBy) {
        case 'rating':
          sortOption = { rating: -1 };
          break;
        case 'deliveryTime':
          sortOption = { averageDeliveryTime: 1 };
          break;
        case 'minOrder':
          sortOption = { minimumOrderValue: 1 };
          break;
        case 'name':
          sortOption = { name: 1 };
          break;
        default:
          sortOption = { rating: -1 };
      }
    }

    let restaurants = await Restaurant.find(filter).sort(sortOption);
    
    if (isOpenNow === 'true') {
      const { day, time } = getCurrentDayAndTime();
      restaurants = restaurants.filter(restaurant => {
        const hours = restaurant.operatingHours[day as keyof typeof restaurant.operatingHours];
        return hours && isTimeWithinRange(time, hours.open, hours.close);
      });
    }
    
    return restaurants;
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
