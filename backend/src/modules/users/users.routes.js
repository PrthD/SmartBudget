import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { currency, email, timezone } from '../../lib/schemas.js';
import { withUserContext } from './context.js';
import { REFRESH_COOKIE } from '../auth/auth.routes.js';
import * as users from './users.service.js';

const UpdateProfile = z
  .object({
    name: z.string().trim().min(1, 'Name is required').max(80),
    preferences: z
      .object({ currency, timezone, aiEnabled: z.boolean() })
      .partial(),
    onboarded: z.literal(true),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Nothing to update');

const ChangeEmail = z.object({
  email,
  currentPassword: z.string().min(1, 'Current password is required'),
});

const Avatar = z.object({ dataUrl: z.string().max(800_000) });
const DeleteAccount = z.object({
  password: z.string().min(1, 'Password is required'),
});

export const usersRouter = Router();

usersRouter.get('/me', async (req, res) => {
  res.json(await users.getProfile(req.userId));
});

usersRouter.patch(
  '/me',
  validate({ body: UpdateProfile }),
  async (req, res) => {
    res.json(await users.updateProfile(req.userId, req.valid.body));
  }
);

usersRouter.put(
  '/me/email',
  validate({ body: ChangeEmail }),
  async (req, res) => {
    res.json(await users.changeEmail(req.userId, req.valid.body));
  }
);

usersRouter.get('/me/avatar', async (req, res) => {
  const { mimeType, buffer, version } = await users.getAvatar(req.userId);
  res.set({
    'Content-Type': mimeType,
    'Cache-Control': 'private, max-age=31536000, immutable',
    ETag: `"${version}"`,
  });
  if (req.fresh) return res.status(304).end();
  res.send(buffer);
});

usersRouter.put('/me/avatar', validate({ body: Avatar }), async (req, res) => {
  res.json(await users.setAvatar(req.userId, req.valid.body.dataUrl));
});

usersRouter.delete('/me/avatar', async (req, res) => {
  res.json(await users.removeAvatar(req.userId));
});

usersRouter.get('/me/export', withUserContext, async (req, res) => {
  res.set(
    'Content-Disposition',
    'attachment; filename="smartbudget-export.json"'
  );
  res.json(await users.exportData(req.ctx));
});

usersRouter.delete(
  '/me',
  validate({ body: DeleteAccount }),
  async (req, res) => {
    await users.deleteAccount(req.userId, req.valid.body.password);
    res.clearCookie(REFRESH_COOKIE, { path: '/api/v1/auth' });
    res.status(204).end();
  }
);
