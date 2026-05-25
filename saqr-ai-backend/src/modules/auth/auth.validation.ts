import { z } from 'zod';
import { Role } from '@prisma/client';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    name: z.string().min(2, 'Name must be at least 2 characters long'),
    password: z.string().min(6, 'Password must be at least 6 characters long'),
    role: z.nativeEnum(Role).optional(),
    companyName: z.string().min(2, 'Company name is required for registration')
  })
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address format'),
    password: z.string().min(1, 'Password is required')
  })
});
