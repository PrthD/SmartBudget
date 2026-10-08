import { badRequest } from '../../lib/errors.js';

export const MAX_AVATAR_BYTES = 512 * 1024;

// Magic numbers: the declared type must match the actual bytes.
const SIGNATURES = {
  'image/png': (b) =>
    b
      .subarray(0, 8)
      .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/webp': (b) =>
    b.subarray(0, 4).toString('ascii') === 'RIFF' &&
    b.subarray(8, 12).toString('ascii') === 'WEBP',
  'image/gif': (b) => b.subarray(0, 4).toString('ascii') === 'GIF8',
};

const DATA_URL = /^data:(image\/[a-z]+);base64,([A-Za-z0-9+/]+={0,2})$/;

/** Parses a stored/uploaded data URL into a verified image buffer. */
export function decodeAvatar(dataUrl) {
  const match = DATA_URL.exec(dataUrl ?? '');
  if (!match) return null;
  const [, mimeType, base64] = match;
  const buffer = Buffer.from(base64, 'base64');
  if (!SIGNATURES[mimeType]?.(buffer)) return null;
  return { mimeType, buffer };
}

/** Validates an upload; GIF is accepted for legacy reads only. */
export function assertValidUpload(dataUrl) {
  const image = decodeAvatar(dataUrl);
  if (!image || image.mimeType === 'image/gif') {
    throw badRequest('Photo must be a PNG, JPEG or WebP image.');
  }
  if (image.buffer.length > MAX_AVATAR_BYTES) {
    throw badRequest('Photo must be 512 KB or smaller.');
  }
  return image;
}
