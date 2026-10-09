import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import { civilDate, interval } from '../../lib/schemas.js';
import { getSummary } from './analytics.service.js';

const SummaryQuery = z.object({
  interval: interval.default('monthly'),
  date: civilDate.optional(),
});

export const analyticsRouter = Router();

analyticsRouter.get(
  '/summary',
  validate({ query: SummaryQuery }),
  async (req, res) => {
    res.json(await getSummary(req.ctx, req.valid.query));
  }
);
