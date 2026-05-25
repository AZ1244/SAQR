import { z } from 'zod';
import { SystemCategory, DesignLevel } from '@prisma/client';

export const createTemplateSchema = z.object({
  body: z.object({
    systemType: z.nativeEnum(SystemCategory),
    ruleName: z.string().min(3, 'Rule name must be at least 3 characters'),
    assumptionsJson: z.string().min(2, 'Assumptions JSON must be valid stringified JSON'),
    country: z.string().default('Qatar'),
    projectType: z.string().optional(),
    designLevel: z.nativeEnum(DesignLevel).optional()
  })
});

export const updateTemplateSchema = z.object({
  body: z.object({
    systemType: z.nativeEnum(SystemCategory).optional(),
    ruleName: z.string().optional(),
    assumptionsJson: z.string().optional(),
    country: z.string().optional(),
    projectType: z.string().optional(),
    designLevel: z.nativeEnum(DesignLevel).optional(),
    isActive: z.boolean().optional()
  })
});
