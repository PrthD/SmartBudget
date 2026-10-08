import { User } from '../../models/User.js';
import { unauthorized } from '../../lib/errors.js';

const TTL_MS = 60_000;
const MAX_ENTRIES = 5_000;
const cache = new Map();

/**
 * The per-request user context (time zone, currency). Cached briefly so most
 * requests need no extra query; invalidated whenever preferences change.
 */
export async function getUserContext(userId) {
  const hit = cache.get(userId);
  if (hit && hit.expires > Date.now()) return hit.value;

  const user = await User.findById(userId).select('preferences').lean();
  if (!user) throw unauthorized('Account no longer exists.');

  const value = {
    userId,
    timezone: user.preferences?.timezone ?? 'America/Edmonton',
    currency: user.preferences?.currency ?? 'CAD',
    aiEnabled: Boolean(user.preferences?.aiEnabled),
  };
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(userId, { value, expires: Date.now() + TTL_MS });
  return value;
}

export const invalidateUserContext = (userId) => cache.delete(String(userId));

/** Express middleware: attaches `req.ctx` (requires requireAuth first). */
export async function withUserContext(req, _res, next) {
  req.ctx = await getUserContext(req.userId);
  next();
}
