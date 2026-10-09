import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../../middleware/validate.js';
import {
  amount,
  civilDate,
  description,
  frequency,
  idParams,
  label,
} from '../../lib/schemas.js';
import { createTransactionService } from './transactions.service.js';

function buildSchemas(config) {
  const fields = {
    [config.labelField]: label(config.labelName),
    amount,
    date: civilDate,
    description,
    frequency: frequency.default('once'),
  };
  if (config.extraFields.includes('customCategory')) {
    fields.customCategory = z.boolean().default(false);
  }
  const create = z.object(fields);
  // Partial updates: defaults must not overwrite stored values.
  const update = z
    .object({
      ...fields,
      description: z.string().trim().max(500),
      frequency,
      ...(fields.customCategory ? { customCategory: z.boolean() } : {}),
    })
    .partial()
    .refine((body) => Object.keys(body).length > 0, 'Nothing to update');

  return {
    create,
    update,
    occurrence: z.object({ date: civilDate }),
    rename: z.object({
      from: label(config.labelName),
      to: label(config.labelName),
    }),
  };
}

/** Mounts list/create/update/delete/skip/rename for one transaction kind. */
export function createTransactionRouter(config) {
  const service = createTransactionService(config);
  const schemas = buildSchemas(config);
  const router = Router();

  router.get('/', async (req, res) => {
    res.json(await service.list(req.ctx));
  });

  router.post('/', validate({ body: schemas.create }), async (req, res) => {
    res.status(201).json(await service.create(req.ctx, req.valid.body));
  });

  // Declared before "/:id" routes so "labels" is never parsed as an id.
  router.post(
    '/labels/rename',
    validate({ body: schemas.rename }),
    async (req, res) => {
      const { from, to } = req.valid.body;
      res.json(await service.renameLabel(req.ctx, from, to));
    }
  );

  router.patch(
    '/:id',
    validate({ params: idParams, body: schemas.update }),
    async (req, res) => {
      res.json(
        await service.update(req.ctx, req.valid.params.id, req.valid.body)
      );
    }
  );

  router.delete('/:id', validate({ params: idParams }), async (req, res) => {
    await service.remove(req.ctx, req.valid.params.id);
    res.status(204).end();
  });

  router.post(
    '/:id/skips',
    validate({ params: idParams, body: schemas.occurrence }),
    async (req, res) => {
      res.json(
        await service.skipOccurrence(
          req.ctx,
          req.valid.params.id,
          req.valid.body.date
        )
      );
    }
  );

  router.delete(
    '/:id/skips/:date',
    validate({ params: idParams.extend({ date: civilDate }) }),
    async (req, res) => {
      const { id, date } = req.valid.params;
      res.json(await service.restoreOccurrence(req.ctx, id, date));
    }
  );

  return router;
}
