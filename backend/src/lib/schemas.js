import { z } from 'zod';
import mongoose from 'mongoose';
import { isValidCivilDate, isValidTimeZone } from './civilDate.js';
import { FREQUENCIES } from './recurrence.js';
import { INTERVALS } from './periods.js';

export const objectId = z
  .string()
  .refine((value) => mongoose.isValidObjectId(value), 'Invalid id');

export const idParams = z.object({ id: objectId });

export const civilDate = z
  .string()
  .refine(isValidCivilDate, 'Date must be a valid YYYY-MM-DD date');

/** Positive money amount, max 1 billion, rounded to cents. */
export const amount = z.coerce
  .number({ error: 'Amount must be a number' })
  .positive('Amount must be greater than 0')
  .max(1_000_000_000, 'Amount is too large')
  .transform((value) => Math.round(value * 100) / 100);

export const nonNegativeAmount = z.coerce
  .number({ error: 'Amount must be a number' })
  .min(0, 'Amount cannot be negative')
  .max(1_000_000_000, 'Amount is too large')
  .transform((value) => Math.round(value * 100) / 100);

/** A short user-provided label (category, source, goal title). */
export const label = (what) =>
  z
    .string({ error: `${what} is required` })
    .trim()
    .min(1, `${what} is required`)
    // eslint-disable-next-line no-control-regex
    .regex(/^[^\u0000-\u001f]*$/, `${what} contains invalid characters`)
    .max(60, `${what} must be 60 characters or fewer`);

export const description = z.string().trim().max(500).default('');

export const frequency = z.enum(FREQUENCIES);
export const interval = z.enum(INTERVALS);

export const timezone = z.string().refine(isValidTimeZone, 'Unknown time zone');

export const currency = z
  .string()
  .regex(/^[A-Z]{3}$/, 'Currency must be a 3-letter ISO code')
  .refine((code) => {
    try {
      new Intl.NumberFormat('en', { style: 'currency', currency: code });
      return true;
    } catch {
      return false;
    }
  }, 'Unknown currency');

export const email = z
  .string()
  .trim()
  .toLowerCase()
  .email('Enter a valid email')
  .max(254);

/** Applies to new passwords only; existing v1 passwords (6+) still log in. */
export const newPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be 128 characters or fewer')
  .refine(
    (value) => /[A-Za-z]/.test(value) && /\d/.test(value),
    'Password must contain a letter and a number'
  );
