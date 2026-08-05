// auth.validation.ts → Zod schemas (register/login validation)

import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(3,"Name must be at least 3 characters long"),  
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6,"Password must be at least 6 characters long"),
  // role: z.enum(["ADMIN", "USER"], "Role must be either 'ADMIN' or 'USER'"),
  role: z.enum(["ADMIN", "OWNER", "STAFF", "USER"]).optional(),
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address"),
  password: z.string().min(6,"Password must be at least 6 characters long")
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;