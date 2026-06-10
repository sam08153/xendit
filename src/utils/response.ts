import { Response } from 'express';

/**
 * Standard API response format
 */
interface ApiResponse {
  status: 'success' | 'error';
  results?: number;
  data?: any;
  message?: string;
}

/**
 * Send a success response
 * @param res Express response object
 * @param data Data to send
 * @param statusCode HTTP status code (default 200)
 */
export function sendSuccessResponse(
  res: Response,
  data: any,
  statusCode: number = 200
): void {
  const response: ApiResponse = {
    status: 'success',
    data
  };

  // Add results count - check if data has an array property
  if (data) {
    // Find the first array in the data object
    const arrayProperty = Object.values(data).find((val) => Array.isArray(val)) as any[];
    if (arrayProperty) {
      response.results = arrayProperty.length;
    }
  }

  res.status(statusCode).json(response);
}

/**
 * Send an error response
 * @param res Express response object
 * @param message Error message
 * @param statusCode HTTP status code (default 500)
 */
export function sendErrorResponse(
  res: Response,
  message: string,
  statusCode: number = 500
): void {
  const response: ApiResponse = {
    status: 'error',
    message
  };

  res.status(statusCode).json(response);
}
