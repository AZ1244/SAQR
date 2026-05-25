import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { sendSuccess } from '../../utils/api-response';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';
import { SystemCategory, DesignLevel } from '@prisma/client';

export class TemplatesController {
  public static list = async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const templates = await prisma.engineeringTemplate.findMany({
        where: { isActive: true },
        orderBy: { systemType: 'asc' }
      });
      return sendSuccess(res, { templates }, 'Engineering templates list retrieved');
    } catch (error) {
      next(error);
    }
  };

  public static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { systemType, ruleName, assumptionsJson, country, projectType, designLevel } = req.body;

      const template = await prisma.engineeringTemplate.create({
        data: {
          systemType: systemType as SystemCategory,
          ruleName,
          assumptionsJson,
          country,
          projectType,
          designLevel: designLevel as DesignLevel
        }
      });

      return sendSuccess(res, { template }, 'Engineering template created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public static update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { id } = req.params;
      const { systemType, ruleName, assumptionsJson, country, projectType, designLevel, isActive } = req.body;

      const checkTemplate = await prisma.engineeringTemplate.findUnique({ where: { id } });
      if (!checkTemplate) throw new NotFoundError('Template not found');

      const template = await prisma.engineeringTemplate.update({
        where: { id },
        data: {
          systemType: systemType as SystemCategory,
          ruleName,
          assumptionsJson,
          country,
          projectType,
          designLevel: designLevel as DesignLevel,
          isActive
        }
      });

      return sendSuccess(res, { template }, 'Engineering template updated successfully');
    } catch (error) {
      next(error);
    }
  };
}
