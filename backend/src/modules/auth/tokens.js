import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { env } from '../../config/env.js';

const ISSUER = 'smartbudget-api';
const AUDIENCE = 'smartbudget-web';

export function signAccessToken(userId) {
  return jwt.sign({}, env.JWT_SECRET, {
    subject: String(userId),
    expiresIn: env.ACCESS_TOKEN_TTL,
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithm: 'HS256',
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['HS256'],
  });
}

/** Opaque, high-entropy refresh token (not a JWT: nothing to decode). */
export const generateRefreshToken = () =>
  crypto.randomBytes(32).toString('base64url');

export const hashToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');
