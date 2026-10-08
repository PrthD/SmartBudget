import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  civilDate,
  interval,
  label,
  nonNegativeAmount,
} from '../../lib/schemas.js';
import { Budget, IncomeGoal } from '../../models/targets.js';
import { createTargetService } from './targets.service.js';

const TARGETS = {
  budget: {
    Model: Budget,
    mapField: 'categoryBudgets',
    totalField: 'totalBudget',
    kind: 'expense',
    labelName: 'Category',
  },
  incomeGoal: {
    Model: IncomeGoal,
    mapField: 'sourceGoals',
    totalField: 'totalGoal',
    kind: 'income',
    labelName: 'Source',
  },
};

function createTargetRouter(config) {
  const service = createTargetService(config);
  const router = Router();

  const UpsertBody = z.object({
    interval,
    amounts: z
      .record(label(config.labelName), nonNegativeAmount)
      .refine(
        (amounts) => Object.keys(amounts).length <= 100,
        'Too many entries'
      )
      .refine(
        (amounts) => Object.values(amounts).some((value) => value > 0),
        'Set at least one amount greater than 0'
      ),
  });

  router.get(
    '/',
    validate({ query: z.object({ date: civilDate.optional() }) }),
    async (req, res) => {
      res.json(await service.get(req.ctx, req.valid.query.date));
    }
  );

  router.put('/', validate({ body: UpsertBody }), async (req, res) => {
    res.json(await service.upsert(req.ctx, req.valid.body));
  });

  router.delete('/', async (req, res) => {
    await service.remove(req.ctx);
    res.status(204).end();
  });

  router.get(
    '/suggestions',
    validate({ query: z.object({ interval: interval.default('monthly') }) }),
    async (req, res) => {
      res.json(await service.suggest(req.ctx, req.valid.query.interval));
    }
  );

  return router;
}

export const budgetRouter = createTargetRouter(TARGETS.budget);
export const incomeGoalRouter = createTargetRouter(TARGETS.incomeGoal);
