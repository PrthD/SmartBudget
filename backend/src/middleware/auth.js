import { verifyAccessToken } from '../modules/auth/tokens.js';
import { unauthorized } from '../lib/errors.js';

/**
 * Verifies the short-lived access token. Stateless by design (no DB hit per
 * request); revocation is handled by the 15-minute TTL plus refresh-token
 * sessions, which are checked against the database.
 */
export function requireAuth(req, _res, next) {
  const header = req.get('authorization') ?? '';
  const [scheme, token] = header.split(' ');
  if (scheme !== 'Bearer' || !token) return next(unauthorized());

  try {
    req.userId = verifyAccessToken(token).sub;
    next();
  } catch {
    next(unauthorized('Session expired. Please sign in again.'));
  }
}
