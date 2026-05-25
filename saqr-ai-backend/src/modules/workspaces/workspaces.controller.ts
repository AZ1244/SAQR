import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { sendSuccess } from '../../utils/api-response';
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../utils/errors';

export class WorkspacesController {
  public static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();

      const workspaces = await prisma.workspace.findMany({
        where: { companyId: req.user.companyId }
      });

      return sendSuccess(res, { workspaces }, 'Workspaces list retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  public static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { name } = req.body;

      if (!name) {
        throw new Error('Workspace name parameter is required');
      }

      const workspace = await prisma.workspace.create({
        data: {
          name,
          companyId: req.user.companyId
        }
      });

      return sendSuccess(res, { workspace }, 'Workspace created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public static getById = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { id } = req.params;

      const workspace = await prisma.workspace.findUnique({
        where: { id }
      });

      if (!workspace) {
        throw new NotFoundError('Workspace not found');
      }

      if (workspace.companyId !== req.user.companyId) {
        throw new ForbiddenError('You do not have access to this workspace');
      }

      return sendSuccess(res, { workspace }, 'Workspace retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
