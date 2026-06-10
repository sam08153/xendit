import { Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';
import { sendSuccessResponse } from '../utils/response';

/**
 * Base controller class with common functionality
 */
export abstract class BaseController {
  /**
   * Validate user authentication and extract user data
   */
  protected validateAuth(req: any) {
    if (!req.user || !req.user.userId) {
      throw new BadRequestError('User ID is required');
    }
    return req.user;
  }

  /**
   * Validate user authentication with role
   */
  protected validateAuthWithRole(req: any) {
    if (!req.user || !req.user.userId || !req.user.role) {
      throw new BadRequestError('User ID and role are required');
    }
    return req.user;
  }

  /**
   * Handle async controller errors
   */
  protected async handleAsync<T>(
    fn: () => Promise<T>,
    res: Response,
    next: NextFunction,
    successStatusCode: number = 200
  ): Promise<void> {
    try {
      const data = await fn();
      sendSuccessResponse(res, data, successStatusCode);
    } catch (error) {
      next(error);
    }
  }
}
