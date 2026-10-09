import mongoose from 'mongoose';
import { HttpError } from '../lib/errors.js';

export function notFoundHandler(req, res) {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
  });
}

/** Maps known error types to safe responses; never leaks internals. */

export function errorHandler(err, req, res, _next) {
  let status = 500;
  let body = {
    code: 'INTERNAL',
    message: 'Something went wrong. Please try again.',
  };

  if (err instanceof HttpError) {
    status = err.status;
    body = { code: err.code, message: err.message, details: err.details };
  } else if (err instanceof mongoose.Error.ValidationError) {
    status = 400;
    body = {
      code: 'BAD_REQUEST',
      message: Object.values(err.errors)[0]?.message ?? 'Invalid data',
    };
  } else if (err instanceof mongoose.Error.CastError) {
    status = 400;
    body = { code: 'BAD_REQUEST', message: `Invalid ${err.path}` };
  } else if (err?.code === 11000) {
    status = 409;
    body = { code: 'CONFLICT', message: 'That value is already in use.' };
  } else if (err?.type === 'entity.too.large') {
    status = 413;
    body = { code: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large.' };
  } else if (err?.type === 'entity.parse.failed') {
    status = 400;
    body = { code: 'BAD_REQUEST', message: 'Malformed JSON body.' };
  }

  if (status >= 500) req.log?.error({ err }, 'Unhandled error');
  res.status(status).json({ error: body });
}
