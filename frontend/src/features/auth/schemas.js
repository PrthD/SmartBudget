import { z } from 'zod';

export const email = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .email('Enter a valid email');

/** Mirrors the server policy for new passwords. */
export const newPassword = z
  .string()
  .min(8, 'At least 8 characters')
  .max(128, 'At most 128 characters')
  .refine(
    (value) => /[A-Za-z]/.test(value) && /\d/.test(value),
    'Use at least one letter and one number'
  );

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required'),
});

export const RegisterSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email,
  password: newPassword,
});
