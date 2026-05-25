import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db';
import { logger } from '../utils/logger';

export const logAudit = (action: string) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    // Record audit details asynchronously in background
    if (req.user) {
      const userId = req.user.id;
      const ipAddress = req.ip;
      const details = JSON.stringify({
        method: req.method,
        url: req.originalUrl,
        params: req.params,
        body: req.method !== 'GET' ? req.body : undefined
      });

      prisma.auditLog.create({
        data: {
          userId,
          action,
          details,
          ipAddress
        }
      }).catch(err => {
        logger.error('Failed to write audit log to database', err);
      });
    }

    next();
  };
};
