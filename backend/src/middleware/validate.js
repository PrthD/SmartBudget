import { badRequest } from '../lib/errors.js';

/**
 * Validates request parts against zod schemas. Parsed (coerced, stripped)
 * values are exposed on `req.valid` — handlers never read raw input.
 *
 * @param {{ body?: import('zod').ZodType, params?: import('zod').ZodType, query?: import('zod').ZodType }} schemas
 */
export const validate = (schemas) => (req, _res, next) => {
  req.valid = {};
  for (const part of ['params', 'query', 'body']) {
    if (!schemas[part]) continue;
    const result = schemas[part].safeParse(req[part] ?? {});
    if (!result.success) {
      const details = result.error.issues.map((issue) => ({
        path: [part, ...issue.path].join('.'),
        message: issue.message,
      }));
      return next(badRequest(details[0].message, details));
    }
    req.valid[part] = result.data;
  }
  next();
};
