import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { sendSuccess } from '../../utils/api-response';
import { NotFoundError, UnauthorizedError } from '../../utils/errors';

export class CompaniesController {
  public static getMyCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      
      const company = await prisma.company.findUnique({
        where: { id: req.user.companyId }
      });

      if (!company) {
        throw new NotFoundError('Company record associated with active session not found');
      }

      return sendSuccess(res, { company }, 'Company details retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  public static updateMyCompany = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();

      const { name, logoUrl, country } = req.body;

      const company = await prisma.company.update({
        where: { id: req.user.companyId },
        data: {
          name,
          logoUrl,
          country
        }
      });

      return sendSuccess(res, { company }, 'Company details updated successfully');
    } catch (error) {
      next(error);
    }
  };
}
