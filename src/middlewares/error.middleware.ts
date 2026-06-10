// src/middlewares/error.middleware.ts
import { Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: any,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      statusCode: err.statusCode,
      message: err.message,
    });
  } else {
    console.error('Unhandled error:', err);
    res.status(500).json({
      status: 'error',
      statusCode: 500,
      message: 'Internal server error',
    });
  }
};
