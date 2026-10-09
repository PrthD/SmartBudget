import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  amount,
  civilDate,
  idParams,
  interval,
  label,
  nonNegativeAmount,
  objectId,
} from '../../lib/schemas.js';
import * as savings from './savings.service.js';

const goalFields = {
  title: label('Title'),
  targetAmount: amount,
  currentAmount: nonNegativeAmount.default(0),
  deadline: civilDate.nullable().default(null),
  description: z.string().trim().max(500).default(''),
};

const CreateGoal = z.object(goalFields);
const UpdateGoal = z
  .object({
    ...goalFields,
    currentAmount: nonNegativeAmount,
    deadline: civilDate.nullable(),
    description: z.string().trim().max(500),
  })
  .partial()
  .refine((body) => Object.keys(body).length > 0, 'Nothing to update');

const Contribution = z.object({
  amount: z.coerce
    .number()
    .refine((value) => value !== 0, 'Amount cannot be zero')
    .refine((value) => Math.abs(value) <= 1_000_000_000, 'Amount is too large')
    .transform((value) => Math.round(value * 100) / 100),
});

const PlanBody = z.object({
  interval,
  ratios: z
    .record(objectId, z.coerce.number().min(0).max(1))
    .refine(
      (ratios) => Object.keys(ratios).length > 0,
      'Add at least one goal to the plan'
    ),
});

export const savingsGoalsRouter = Router();

savingsGoalsRouter.get('/', async (req, res) => {
  res.json(await savings.listGoals(req.ctx));
});

savingsGoalsRouter.post(
  '/',
  validate({ body: CreateGoal }),
  async (req, res) => {
    res.status(201).json(await savings.createGoal(req.ctx, req.valid.body));
  }
);

savingsGoalsRouter.patch(
  '/:id',
  validate({ params: idParams, body: UpdateGoal }),
  async (req, res) => {
    res.json(
      await savings.updateGoal(req.ctx, req.valid.params.id, req.valid.body)
    );
  }
);

savingsGoalsRouter.delete(
  '/:id',
  validate({ params: idParams }),
  async (req, res) => {
    await savings.deleteGoal(req.ctx, req.valid.params.id);
    res.status(204).end();
  }
);

savingsGoalsRouter.post(
  '/:id/contributions',
  validate({ params: idParams, body: Contribution }),
  async (req, res) => {
    res.json(
      await savings.contribute(
        req.ctx,
        req.valid.params.id,
        req.valid.body.amount
      )
    );
  }
);

export const savingsPlanRouter = Router();

savingsPlanRouter.get('/', async (req, res) => {
  res.json(await savings.getPlan(req.ctx));
});

savingsPlanRouter.put('/', validate({ body: PlanBody }), async (req, res) => {
  res.json(await savings.upsertPlan(req.ctx, req.valid.body));
});

savingsPlanRouter.delete('/', async (req, res) => {
  await savings.deletePlan(req.ctx);
  res.status(204).end();
});
