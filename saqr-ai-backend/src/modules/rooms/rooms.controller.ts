import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/db';
import { sendSuccess } from '../../utils/api-response';
import { NotFoundError, UnauthorizedError, ForbiddenError } from '../../utils/errors';

export class RoomsController {
  
  private static async checkProjectAccess(projectId: string, userCompanyId: string) {
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { workspace: true }
    });
    if (!project) throw new NotFoundError('Project not found');
    if (project.workspace.companyId !== userCompanyId) {
      throw new ForbiddenError('Unauthorized project access');
    }
  }

  private static async checkRoomAccess(roomId: string, userCompanyId: string) {
    const room = await prisma.room.findUnique({
      where: { id: roomId },
      include: { project: { include: { workspace: true } } }
    });
    if (!room) throw new NotFoundError('Room not found');
    if (room.project.workspace.companyId !== userCompanyId) {
      throw new ForbiddenError('Unauthorized room access');
    }
    return room;
  }

  public static list = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const rooms = await prisma.room.findMany({
        where: { projectId },
        include: { calculations: true },
        orderBy: { name: 'asc' }
      });

      return sendSuccess(res, { rooms }, 'Rooms list retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  public static create = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { projectId } = req.params;
      await this.checkProjectAccess(projectId, req.user.companyId);

      const { name, type, area, ceilingHeight, occupancy, luxTarget, notes } = req.body;

      const room = await prisma.room.create({
        data: {
          projectId,
          name,
          type,
          area: parseFloat(area),
          ceilingHeight: parseFloat(ceilingHeight),
          occupancy: parseInt(occupancy || '1'),
          luxTarget: parseInt(luxTarget || '400'),
          notes
        }
      });

      return sendSuccess(res, { room }, 'Room created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  public static update = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { id } = req.params;
      await this.checkRoomAccess(id, req.user.companyId);

      const { name, type, area, ceilingHeight, occupancy, luxTarget, notes } = req.body;

      const room = await prisma.room.update({
        where: { id },
        data: {
          name,
          type,
          area: area ? parseFloat(area) : undefined,
          ceilingHeight: ceilingHeight ? parseFloat(ceilingHeight) : undefined,
          occupancy: occupancy ? parseInt(occupancy) : undefined,
          luxTarget: luxTarget ? parseInt(luxTarget) : undefined,
          notes
        }
      });

      return sendSuccess(res, { room }, 'Room updated successfully');
    } catch (error) {
      next(error);
    }
  };

  public static delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new UnauthorizedError();
      const { id } = req.params;
      await this.checkRoomAccess(id, req.user.companyId);

      await prisma.room.delete({ where: { id } });
      return sendSuccess(res, null, 'Room deleted successfully');
    } catch (error) {
      next(error);
    }
  };
}
