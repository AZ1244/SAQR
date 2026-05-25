import { prisma } from '../../config/db';
import { env } from '../../config/env';
import { AppError, UnauthorizedError } from '../../utils/errors';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { Role } from '@prisma/client';

export class AuthService {
  public static async register(data: {
    email: string;
    name: string;
    passwordHash: string;
    role?: Role;
    companyName: string;
  }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email }
    });

    if (existingUser) {
      throw new AppError('A user with this email address already exists', 400, 'USER_EXISTS');
    }

    // 1. Create company first
    const company = await prisma.company.create({
      data: {
        name: data.companyName,
      }
    });

    // 2. Create workspace automatically for the company
    const workspace = await prisma.workspace.create({
      data: {
        name: `${data.companyName} General Projects`,
        companyId: company.id
      }
    });

    // 3. Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        name: data.name,
        passwordHash: data.passwordHash,
        role: data.role || Role.ENGINEER,
        companyId: company.id
      },
      include: {
        company: true
      }
    });

    const token = this.signToken(user.id);

    return { user, token, workspaceId: workspace.id };
  }

  public static async login(email: string, pass: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { company: true }
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(pass, user.passwordHash);
    if (!passwordMatch) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.signToken(user.id);

    return { user, token };
  }

  private static signToken(userId: string): string {
    return jwt.sign({ userId }, env.JWT_SECRET, {
      expiresIn: '7d'
    });
  }
}
