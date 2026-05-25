import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/api-response';
import * as bcrypt from 'bcryptjs';
import { UnauthorizedError } from '../../utils/errors';

export class AuthController {
  public static register = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, name, password, role, companyName } = req.body;
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await AuthService.register({
        email,
        name,
        passwordHash: hashedPassword,
        role,
        companyName
      });

      return sendSuccess(res, result, 'User registration completed successfully', 211); // 201 Created placeholder (or standard 200/201)
    } catch (error) {
      next(error);
    }
  };

  public static login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body;
      const result = await AuthService.login(email, password);
      return sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  public static me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('User profile not found in active session context');
      }
      return sendSuccess(res, { user: req.user }, 'User session profile retrieved');
    } catch (error) {
      next(error);
    }
  };
}
