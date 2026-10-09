import mongoose from 'mongoose';

/**
 * A refresh-token session. Only a SHA-256 hash of the opaque token is stored.
 * Tokens rotate on every refresh; the rotated row is kept (with `rotatedAt`)
 * so that replaying an old token can be detected and the whole family
 * revoked.
 */
const SessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    rotatedAt: { type: Date, default: null },
    userAgent: { type: String, default: '' },
  },
  { timestamps: true }
);

SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
SessionSchema.index({ user: 1 });

export const Session =
  mongoose.models.Session || mongoose.model('Session', SessionSchema);
