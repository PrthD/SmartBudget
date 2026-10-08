import { Router } from 'express';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { validate } from '../../middleware/validate.js';
import { credentialsLimiter } from '../../middleware/rateLimit.js';
import { email, newPassword } from '../../lib/schemas.js';
import { requireAuth } from '../../middleware/auth.js';
import { changePassword } from '../users/users.service.js';
import { forbidden } from '../../lib/errors.js';
import * as auth from './auth.service.js';

export const REFRESH_COOKIE = 'sb_rt';
const COOKIE_PATH = '/api/v1/auth';

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.cookieSecure,
  sameSite: env.cookieSameSite,
  // A cross-site cookie is partitioned (CHIPS) to the web app's site, so
  // browsers that block third-party cookies still keep it there.
  partitioned: env.cookieSameSite === 'none',
  path: COOKIE_PATH,
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 86_400_000,
});

/**
 * With SameSite=None (web app and API on different sites) the browser no
 * longer stops other sites from sending the cookie, so the endpoints that set
 * or use it only accept browser requests from the allowed web origins: a
 * CSRF / login-CSRF guard. Requests without an Origin header (not made by a
 * web page) are let through.
 */
function requireTrustedOrigin(req, _res, next) {
  const origin = req.get('origin');
  if (
    env.cookieSameSite === 'none' &&
    origin &&
    !env.corsOrigins.includes(origin)
  )
    throw forbidden('Origin not allowed.');
  next();
}

/** Refresh token → httpOnly cookie; access token → response body (memory). */
function sendSession(res, status, { user, accessToken, refreshToken }) {
  res.cookie(REFRESH_COOKIE, refreshToken, cookieOptions());
  res.status(status).json({ user, accessToken });
}

const meta = (req) => ({ userAgent: req.get('user-agent') });

const RegisterBody = z.object({
  name: z.string().trim().min(1, 'Name is required').max(80),
  email,
  password: newPassword,
});

const LoginBody = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(128),
});

export const authRouter = Router();
authRouter.use(requireTrustedOrigin);

authRouter.post(
  '/register',
  credentialsLimiter,
  validate({ body: RegisterBody }),
  async (req, res) => {
    sendSession(res, 201, await auth.register(req.valid.body, meta(req)));
  }
);

authRouter.post(
  '/login',
  credentialsLimiter,
  validate({ body: LoginBody }),
  async (req, res) => {
    sendSession(res, 200, await auth.login(req.valid.body, meta(req)));
  }
);

authRouter.post('/refresh', async (req, res) => {
  try {
    sendSession(
      res,
      200,
      await auth.refresh(req.cookies[REFRESH_COOKIE], meta(req))
    );
  } catch (error) {
    res.clearCookie(REFRESH_COOKIE, { ...cookieOptions(), maxAge: undefined });
    throw error;
  }
});

// Lives under /auth because it needs the refresh cookie (scoped to this path)
// to keep the current session while signing out all others.
authRouter.put(
  '/password',
  requireAuth,
  validate({
    body: z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword,
    }),
  }),
  async (req, res) => {
    await changePassword(
      req.userId,
      req.valid.body,
      req.cookies[REFRESH_COOKIE]
    );
    res.status(204).end();
  }
);

authRouter.post('/logout', async (req, res) => {
  await auth.logout(req.cookies[REFRESH_COOKIE]);
  res.clearCookie(REFRESH_COOKIE, { ...cookieOptions(), maxAge: undefined });
  res.status(204).end();
});
