import { describe, expect, it } from 'vitest';
import { signUp, useTestApp } from '../helpers.js';

const t = useTestApp();

const rent = {
  category: 'Housing',
  amount: 1500,
  date: '2025-01-31',
  frequency: 'monthly',
};

describe('transactions', () => {
  it('creates, lists, updates and deletes expenses', async () => {
    const api = await signUp(t.app);
    const created = await api.post('/api/v1/expenses', rent).expect(201);
    expect(created.body).toMatchObject({
      ...rent,
      kind: 'expense',
      description: '',
      skippedDates: [],
    });
    expect(created.body.nextOccurrence).toMatch(/^\d{4}-\d{2}-(28|29|30|31)$/);

    const list = await api.get('/api/v1/expenses').expect(200);
    expect(list.body).toHaveLength(1);

    const updated = await api
      .patch(`/api/v1/expenses/${created.body.id}`, {
        amount: 1550.555,
        description: 'Lease',
      })
      .expect(200);
    expect(updated.body.amount).toBe(1550.56);

    // v1 bug: an empty description could never be cleared.
    const cleared = await api
      .patch(`/api/v1/expenses/${created.body.id}`, { description: '' })
      .expect(200);
    expect(cleared.body.description).toBe('');

    await api.del(`/api/v1/expenses/${created.body.id}`).expect(204);
    await api.del(`/api/v1/expenses/${created.body.id}`).expect(404);
  });

  it('isolates users from each other', async () => {
    const alice = await signUp(t.app);
    const bob = await signUp(t.app);
    const { body } = await alice.post('/api/v1/expenses', rent).expect(201);

    expect((await bob.get('/api/v1/expenses')).body).toEqual([]);
    await bob.patch(`/api/v1/expenses/${body.id}`, { amount: 1 }).expect(404);
    await bob.del(`/api/v1/expenses/${body.id}`).expect(404);
    await bob
      .post(`/api/v1/expenses/${body.id}/skips`, { date: '2025-02-28' })
      .expect(404);
  });

  it('validates input with clear 400s', async () => {
    const api = await signUp(t.app);
    const res = await api
      .post('/api/v1/expenses', {
        category: ' ',
        amount: 0,
        date: '2025-02-30',
        frequency: 'daily',
      })
      .expect(400);
    expect(res.body.error.details.map((d) => d.path)).toEqual([
      'body.category',
      'body.amount',
      'body.date',
      'body.frequency',
    ]);
    await api.patch('/api/v1/expenses/123', { amount: 5 }).expect(400);
  });

  it('skips and restores real occurrences only', async () => {
    const api = await signUp(t.app);
    const { body } = await api.post('/api/v1/expenses', rent).expect(201);

    await api
      .post(`/api/v1/expenses/${body.id}/skips`, { date: '2025-02-27' })
      .expect(400);
    const skipped = await api
      .post(`/api/v1/expenses/${body.id}/skips`, { date: '2025-02-28' })
      .expect(200);
    expect(skipped.body.skippedDates).toEqual(['2025-02-28']);

    // Skipping twice doesn't duplicate (v1 appended duplicates).
    const again = await api
      .post(`/api/v1/expenses/${body.id}/skips`, { date: '2025-02-28' })
      .expect(200);
    expect(again.body.skippedDates).toEqual(['2025-02-28']);

    const restored = await api
      .del(`/api/v1/expenses/${body.id}/skips/2025-02-28`)
      .expect(200);
    expect(restored.body.skippedDates).toEqual([]);

    const once = await api
      .post('/api/v1/expenses', {
        category: 'Coffee',
        amount: 4,
        date: '2025-02-01',
      })
      .expect(201);
    await api
      .post(`/api/v1/expenses/${once.body.id}/skips`, { date: '2025-02-01' })
      .expect(400);
  });

  it('clears skips when the schedule changes', async () => {
    const api = await signUp(t.app);
    const { body } = await api.post('/api/v1/expenses', rent).expect(201);
    await api
      .post(`/api/v1/expenses/${body.id}/skips`, { date: '2025-02-28' })
      .expect(200);
    const res = await api
      .patch(`/api/v1/expenses/${body.id}`, { frequency: 'weekly' })
      .expect(200);
    expect(res.body.skippedDates).toEqual([]);
  });

  it('renames a category across expenses and the budget', async () => {
    const api = await signUp(t.app);
    await api
      .post('/api/v1/expenses', {
        category: 'Food',
        amount: 10,
        date: '2025-01-02',
      })
      .expect(201);
    await api
      .post('/api/v1/expenses', {
        category: 'Food',
        amount: 20,
        date: '2025-01-03',
      })
      .expect(201);
    await api
      .put('/api/v1/budget', { interval: 'monthly', amounts: { Food: 300 } })
      .expect(200);

    const res = await api
      .post('/api/v1/expenses/labels/rename', { from: 'Food', to: 'Groceries' })
      .expect(200);
    expect(res.body.updated).toBe(2);
    const budget = await api.get('/api/v1/budget').expect(200);
    expect(budget.body.amounts).toEqual({ Groceries: 300 });
  });

  it('supports incomes through the same module', async () => {
    const api = await signUp(t.app);
    const res = await api
      .post('/api/v1/incomes', {
        source: 'Salary',
        amount: 2000,
        date: '2025-01-03',
        frequency: 'biweekly',
      })
      .expect(201);
    expect(res.body).toMatchObject({ kind: 'income', source: 'Salary' });
    expect(res.body).not.toHaveProperty('customCategory');
  });
});
