import { z } from "zod";
import { optionalPhoneSchema } from "./phone";

export const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Must contain at least one uppercase letter")
  .regex(/[0-9]/, "Must contain at least one number");

export const registerSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters"),
  email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
  password: passwordSchema,
  phone: optionalPhoneSchema,
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
  otp: z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code"),
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email("Invalid email address")),
  password: z.string().min(1, "Password is required"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
