import {z} from 'zod';

export const clientSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().regex(/^\+?[\d\s\-\(\)]{10,}$/).optional(),
  address: z.string().max(200).optional()
});

export type Client = z.infer<typeof clientSchema>; 
export const clientUpdateSchema = clientSchema.partial().refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update"
});
export type ClientInput = z.infer<typeof clientSchema>; 
export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>; 

// Backwards-compatible aliases for older imports used in controllers
export const createClientSchema = clientSchema;
export const updateClientSchema = clientUpdateSchema;