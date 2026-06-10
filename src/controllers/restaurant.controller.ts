// src/controllers/restaurant.controller.ts
import { Request, Response, NextFunction } from 'express';
import { RestaurantService } from '../services/restaurant.service';
import { BadRequestError } from '../utils/errors';
import { BaseController } from './base.controller';
import { sendSuccessResponse } from '../utils/response';

export class RestaurantController extends BaseController {
  private restaurantService: RestaurantService;

  constructor() {
    super();
    this.restaurantService = new RestaurantService();
  }

  public getAllRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    this.handleAsync(
      async () => {
        const restaurants = await this.restaurantService.getAllRestaurants(req.query);
        return { restaurants };
      },
      res,
      next
    );
  };

  public getRestaurantById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    this.handleAsync(
      async () => {
        const { id } = req.params;
        const restaurant = await this.restaurantService.getRestaurantById(id);
        return { restaurant };
      },
      res,
      next
    );
  };

  public createRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    this.handleAsync(
      async () => {
        const user = this.validateAuth(req);
        const restaurant = await this.restaurantService.createRestaurant(req.body, user.userId);
        return { restaurant };
      },
      res,
      next,
      201
    );
  };

  public updateRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    this.handleAsync(
      async () => {
        const user = this.validateAuth(req);
        const { id } = req.params;
        const restaurant = await this.restaurantService.updateRestaurant(id, req.body, user.userId);
        return { restaurant };
      },
      res,
      next
    );
  };

  public deleteRestaurant = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    this.handleAsync(
      async () => {
        const user = this.validateAuth(req);
        const { id } = req.params;
        await this.restaurantService.deleteRestaurant(id, user.userId);
        return null;
      },
      res,
      next,
      204
    );
  };

  public getNearbyRestaurants = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    this.handleAsync(
      async () => {
        const { lat, lng, distance } = req.query;
        
        if (!lat || !lng) {
          throw new BadRequestError('Latitude and longitude are required');
        }
        
        const restaurants = await this.restaurantService.getNearbyRestaurants(
          Number(lat), 
          Number(lng), 
          distance ? Number(distance) : undefined
        );
        return { restaurants };
      },
      res,
      next
    );
  };
}
