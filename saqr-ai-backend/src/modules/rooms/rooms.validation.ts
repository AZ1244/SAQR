import { z } from 'zod';

export const createRoomSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Room name must be at least 2 characters long'),
    type: z.string().min(2, 'Room type/use is required'),
    area: z.number().positive('Area must be a positive number'),
    ceilingHeight: z.number().positive('Ceiling height must be a positive number').default(3.0),
    occupancy: z.number().nonnegative('Occupancy cannot be negative').default(1),
    luxTarget: z.number().positive('Lux target must be positive').default(400),
    notes: z.string().optional()
  })
});

export const updateRoomSchema = z.object({
  body: z.object({
    name: z.string().optional(),
    type: z.string().optional(),
    area: z.number().positive().optional(),
    ceilingHeight: z.number().positive().optional(),
    occupancy: z.number().nonnegative().optional(),
    luxTarget: z.number().positive().optional(),
    notes: z.string().optional()
  })
});
