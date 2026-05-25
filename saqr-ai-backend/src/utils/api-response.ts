import { Response } from 'express';

export const sendSuccess = (res: Response, data: any = {}, message: string = 'Operation completed successfully', statusCode: number = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    message
  });
};

export const sendError = (res: Response, code: string, message: string, details: any[] = [], statusCode: number = 400) => {
  return res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      details
    }
  });
};
