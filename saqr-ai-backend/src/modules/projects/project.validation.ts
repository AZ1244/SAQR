import { z } from 'zod';
import { DesignLevel, SystemCategory } from '@prisma/client';

export const createProjectSchema = z.object({
  body: z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters long'),
    client: z.string().min(2, 'Client name must be at least 2 characters long'),
    country: z.string().default('Qatar'),
    city: z.string().default('Doha'),
    location: z.string().optional(),
    projectType: z.string().default('Office'),
    areaSqm: z.number().positive('Area must be a positive number'),
    ceilingHeight: z.number().positive('Ceiling height must be a positive number').default(3.0),
    designLevel: z.nativeEnum(DesignLevel).default(DesignLevel.STANDARD),
    workspaceId: z.string().uuid('Workspace ID must be a valid UUID')
  })
});

export const updateProjectSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    client: z.string().optional(),
    country: z.string().optional(),
    city: z.string().optional(),
    location: z.string().optional(),
    projectType: z.string().optional(),
    areaSqm: z.number().positive().optional(),
    ceilingHeight: z.number().positive().optional(),
    designLevel: z.nativeEnum(DesignLevel).optional(),
    status: z.string().optional()
  })
});

export const chatSchema = z.object({
  body: z.object({
    question: z.string().min(1, 'Question query is required'),
    conversationId: z.string().uuid().optional()
  })
});

export const createClaimSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Claim title is required'),
    description: z.string().min(5, 'Claim description is required'),
    estimatedValue: z.number().nonnegative('Value must be greater than or equal to zero')
  })
});

export const createAssetSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Asset name is required'),
    modelNumber: z.string().optional(),
    serialNumber: z.string().optional(),
    systemCategory: z.nativeEnum(SystemCategory),
    location: z.string().optional(),
    qrCode: z.string().optional(),
    warrantyProvider: z.string().optional(),
    warrantyDurationMonths: z.number().optional(),
    maintenanceTask: z.string().optional(),
    maintenanceFrequency: z.string().optional()
  })
});
