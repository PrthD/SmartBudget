export class HttpError extends Error {
  /**
   * @param {number} status HTTP status code.
   * @param {string} message Safe, user-facing message.
   * @param {{ code?: string, details?: unknown }} [extra]
   */
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export const badRequest = (message, details) =>
  new HttpError(400, message, { code: 'BAD_REQUEST', details });
export const unauthorized = (message = 'Authentication required') =>
  new HttpError(401, message, { code: 'UNAUTHORIZED' });
export const forbidden = (message = 'Forbidden') =>
  new HttpError(403, message, { code: 'FORBIDDEN' });
export const notFound = (message = 'Resource not found') =>
  new HttpError(404, message, { code: 'NOT_FOUND' });
export const conflict = (message) =>
  new HttpError(409, message, { code: 'CONFLICT' });
export const tooManyRequests = (message) =>
  new HttpError(429, message, { code: 'RATE_LIMITED' });
export const serviceUnavailable = (message) =>
  new HttpError(503, message, { code: 'UNAVAILABLE' });
