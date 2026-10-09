import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { aiLimiter } from '../../middleware/rateLimit.js';
import { badRequest } from '../../lib/errors.js';
import * as ai from './ai.service.js';

export const MAX_RECEIPT_BYTES = 4 * 1024 * 1024;
const RECEIPT_DATA_URL =
  /^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/;

const ParseBody = z
  .object({
    text: z.string().trim().max(300).optional(),
    image: z
      .string()
      .max(Math.ceil((MAX_RECEIPT_BYTES * 4) / 3) + 64)
      .optional(),
  })
  .refine(
    (body) => body.text || body.image,
    'Describe the transaction or attach a receipt'
  );

function decodeReceipt(dataUrl) {
  if (!dataUrl) return undefined;
  const match = RECEIPT_DATA_URL.exec(dataUrl);
  if (!match) throw badRequest('Receipt must be a PNG, JPEG or WebP image.');
  return { mimeType: match[1], base64: match[2] };
}

export const aiRouter = Router();

aiRouter.get('/status', (req, res) => {
  res.json(ai.aiStatus(req.ctx));
});

aiRouter.get(
  '/insights',
  validate({
    query: z.object({ refresh: z.enum(['true', 'false']).optional() }),
  }),
  async (req, res, next) => {
    // Only forced refreshes are rate limited; cached reads are free.
    if (req.valid.query.refresh === 'true') return aiLimiter(req, res, next);
    next();
  },
  async (req, res) => {
    res.json(
      await ai.getInsights(req.ctx, {
        refresh: req.valid.query.refresh === 'true',
      })
    );
  }
);

aiRouter.post(
  '/parse',
  validate({ body: ParseBody }),
  // Validate first: malformed requests must not spend the quota.
  aiLimiter,
  async (req, res) => {
    const { text, image } = req.valid.body;
    res.json(
      await ai.parseTransaction(req.ctx, { text, image: decodeReceipt(image) })
    );
  }
);
