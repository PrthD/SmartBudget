import crypto from 'node:crypto';
import bcrypt from 'bcrypt';
import { env } from '../../config/env.js';
import { User } from '../../models/User.js';
import { Session } from '../../models/Session.js';
import { conflict, unauthorized } from '../../lib/errors.js';
import { toPublicUser } from '../users/users.serializer.js';
import { generateRefreshToken, hashToken, signAccessToken } from './tokens.js';

const DAY_MS = 86_400_000;
// Two tabs refreshing at the same moment both present the same token; the
// loser of that race must not be treated as a replay attack.
const ROTATION_GRACE_MS = 15_000;
// Compared against when the email doesn't exist, so response time doesn't
// reveal which emails are registered.
const DUMMY_HASH = bcrypt.hashSync('timing-equaliser', 12);

async function createSession(userId, { family, userAgent } = {}) {
  const refreshToken = generateRefreshToken();
  await Session.create({
    user: userId,
    tokenHash: hashToken(refreshToken),
    family: family ?? crypto.randomUUID(),
    expiresAt: new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * DAY_MS),
    userAgent: userAgent?.slice(0, 200) ?? '',
  });
  return refreshToken;
}

async function issueTokens(user, meta) {
  return {
    user: toPublicUser(user, { hasPhoto: await userHasPhoto(user._id) }),
    accessToken: signAccessToken(user._id),
    refreshToken: await createSession(user._id, meta),
  };
}

export async function userHasPhoto(userId) {
  return Boolean(
    await User.exists({ _id: userId, profilePhoto: { $nin: ['', null] } })
  );
}

export async function register({ name, email, password }, meta) {
  if (await User.exists({ email })) {
    throw conflict('An account with this email already exists.');
  }
  const user = await User.create({ name, email, password });
  return issueTokens(user, meta);
}

export async function login({ email, password }, meta) {
  const user = await User.findOne({ email }).select('+password');
  const valid = user
    ? await user.verifyPassword(password)
    : await bcrypt.compare(password, DUMMY_HASH);
  if (!user || !valid) throw unauthorized('Invalid email or password.');
  return issueTokens(user, meta);
}

/** Rotates a refresh token. Replaying a rotated token revokes the family. */
export async function refresh(rawToken, meta) {
  if (!rawToken) throw unauthorized('No active session.');

  const session = await Session.findOne({ tokenHash: hashToken(rawToken) });
  if (!session || session.expiresAt < new Date()) {
    throw unauthorized('Session expired. Please sign in again.');
  }

  if (session.rotatedAt) {
    const withinGrace =
      Date.now() - session.rotatedAt.getTime() < ROTATION_GRACE_MS;
    if (!withinGrace) {
      await Session.deleteMany({ family: session.family });
      throw unauthorized('Session is no longer valid. Please sign in again.');
    }
  } else {
    // Atomic claim: only one concurrent request performs the rotation.
    await Session.updateOne(
      { _id: session._id, rotatedAt: null },
      { rotatedAt: new Date() }
    );
  }

  const user = await User.findById(session.user);
  if (!user) {
    await Session.deleteMany({ user: session.user });
    throw unauthorized('Account no longer exists.');
  }
  return issueTokens(user, { ...meta, family: session.family });
}

export async function logout(rawToken) {
  if (!rawToken) return;
  const session = await Session.findOne({ tokenHash: hashToken(rawToken) });
  if (session) await Session.deleteMany({ family: session.family });
}

/** Signs the user out everywhere (optionally keeping the current session). */
export async function revokeSessions(userId, { exceptToken } = {}) {
  const keep = exceptToken
    ? await Session.findOne({ tokenHash: hashToken(exceptToken) })
    : null;
  await Session.deleteMany({
    user: userId,
    ...(keep ? { family: { $ne: keep.family } } : {}),
  });
}
