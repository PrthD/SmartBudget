import { describe, expect, it } from 'vitest';
import { signUp, useTestApp } from '../helpers.js';
import { Budget } from '../../src/models/targets.js';

const t = useTestApp();

describe('budgets and income goals', () => {
  it('upserts a single budget and keeps its interval (v1 reset it to monthly)', async () => {
    const api = await signUp(t.app);
    expect((await api.get('/api/v1/budget').expect(200)).body).toBeNull();

    const created = await api
      .put('/api/v1/budget', {
        interval: 'weekly',
        amounts: { Groceries: 120, 'Dr. visits': 30, Fun: 0 },
      })
      .expect(200);
    expect(created.body).toMatchObject({
      interval: 'weekly',
      total: 150,
      amounts: { Groceries: 120, 'Dr. visits': 30 },
    });

    await api
      .put('/api/v1/budget', {
        interval: 'weekly',
        amounts: { Groceries: 140 },
      })
      .expect(200);
    expect(await Budget.countDocuments()).toBe(1);
    expect((await api.get('/api/v1/budget')).body.interval).toBe('weekly');
  });

  it('reads the newest of legacy duplicate docs and deletes them all', async () => {
    const api = await signUp(t.app);
    await Budget.create({
      user: api.user.id,
      totalBudget: 1,
      categoryBudgets: { Old: 1 },
    });
    await new Promise((r) => setTimeout(r, 10));
    await Budget.create({
      user: api.user.id,
      totalBudget: 2,
      categoryBudgets: { New: 2 },
    });
    expect((await api.get('/api/v1/budget')).body.amounts).toEqual({ New: 2 });
    await api.del('/api/v1/budget').expect(204);
    expect(await Budget.countDocuments()).toBe(0);
  });

  it('rejects an all-zero budget', async () => {
    const api = await signUp(t.app);
    await api
      .put('/api/v1/budget', { interval: 'monthly', amounts: { A: 0 } })
      .expect(400);
  });

  it('tracks income goal progress', async () => {
    const api = await signUp(t.app);
    await api
      .post('/api/v1/incomes', {
        source: 'Salary',
        amount: 1000,
        date: '2020-01-01',
      })
      .expect(201);
    const res = await api
      .put('/api/v1/income-goal', {
        interval: 'yearly',
        amounts: { Salary: 5000 },
      })
      .expect(200);
    expect(res.body.progress).toMatchObject({
      interval: 'yearly',
      target: 5000,
    });
  });
});

describe('savings goals and plan', () => {
  it('records contributions and never goes below zero', async () => {
    const api = await signUp(t.app);
    const { body } = await api
      .post('/api/v1/savings-goals', {
        title: 'Trip',
        targetAmount: 1000,
        currentAmount: 100,
      })
      .expect(201);
    const added = await api.post(
      `/api/v1/savings-goals/${body.id}/contributions`,
      { amount: 250.5 }
    );
    expect(added.body).toMatchObject({
      currentAmount: 350.5,
      percent: 35.05,
      remaining: 649.5,
    });
    const withdrawn = await api.post(
      `/api/v1/savings-goals/${body.id}/contributions`,
      { amount: -9999 }
    );
    expect(withdrawn.body.currentAmount).toBe(0);
  });

  it('rejects past deadlines and duplicate titles', async () => {
    const api = await signUp(t.app);
    await api
      .post('/api/v1/savings-goals', {
        title: 'Car',
        targetAmount: 100,
        deadline: '2000-01-01',
      })
      .expect(400);
    await api
      .post('/api/v1/savings-goals', { title: 'Car', targetAmount: 100 })
      .expect(201);
    await api
      .post('/api/v1/savings-goals', { title: 'Car', targetAmount: 200 })
      .expect(409);
  });

  it('keeps the plan consistent through renames and deletes (v1 bug)', async () => {
    const api = await signUp(t.app);
    const a = (
      await api.post('/api/v1/savings-goals', { title: 'A', targetAmount: 100 })
    ).body;
    const b = (
      await api.post('/api/v1/savings-goals', { title: 'B', targetAmount: 100 })
    ).body;

    await api
      .put('/api/v1/savings-plan', {
        interval: 'monthly',
        ratios: { [a.id]: 0.6, [b.id]: 0.5 },
      })
      .expect(400);
    await api
      .put('/api/v1/savings-plan', {
        interval: 'monthly',
        ratios: { [a.id]: 0.25, [b.id]: 0.75 },
      })
      .expect(200);

    await api
      .patch(`/api/v1/savings-goals/${a.id}`, { title: 'A renamed' })
      .expect(200);
    let plan = (await api.get('/api/v1/savings-plan')).body;
    expect(plan.allocations.map((x) => [x.title, x.ratio])).toEqual([
      ['A renamed', 0.25],
      ['B', 0.75],
    ]);

    await api.del(`/api/v1/savings-goals/${b.id}`).expect(204);
    plan = (await api.get('/api/v1/savings-plan')).body;
    expect(plan.allocations).toEqual([
      expect.objectContaining({ title: 'A renamed', ratio: 1 }),
    ]);

    await api.del(`/api/v1/savings-goals/${a.id}`).expect(204);
    expect((await api.get('/api/v1/savings-plan')).body).toBeNull();
  });
});

describe('analytics, users and AI fallback', () => {
  it('returns the whole dashboard in one request', async () => {
    const api = await signUp(t.app);
    await api.post('/api/v1/incomes', {
      source: 'Salary',
      amount: 3000,
      date: '2020-01-01',
      frequency: 'monthly',
    });
    await api.post('/api/v1/expenses', {
      category: 'Rent',
      amount: 1200,
      date: '2020-01-01',
      frequency: 'monthly',
    });
    const res = await api
      .get('/api/v1/analytics/summary?interval=monthly')
      .expect(200);
    expect(res.body.current).toMatchObject({
      income: 3000,
      expense: 1200,
      net: 1800,
      savingsRate: 60,
    });
    expect(res.body.trend).toHaveLength(12);
    expect(res.body.upcoming.length).toBeGreaterThan(0);
    await api.get('/api/v1/analytics/summary?interval=daily').expect(400);

    // A past year's trend covers that calendar year, not 12 months back
    // from the anchor date.
    const past = await api
      .get('/api/v1/analytics/summary?interval=yearly&date=2023-03-10')
      .expect(200);
    expect(past.body.trend.map((m) => m.month)).toEqual(
      Array.from(
        { length: 12 },
        (_, i) => `2023-${String(i + 1).padStart(2, '0')}`
      )
    );
    expect(past.body.current.income).toBe(36000);
  });

  it('updates preferences and validates time zones and currencies', async () => {
    const api = await signUp(t.app);
    await api
      .patch('/api/v1/users/me', { preferences: { timezone: 'Mars/Base' } })
      .expect(400);
    await api
      .patch('/api/v1/users/me', { preferences: { currency: 'XYZ1' } })
      .expect(400);
    const res = await api
      .patch('/api/v1/users/me', {
        preferences: { timezone: 'Europe/London', currency: 'GBP' },
        onboarded: true,
      })
      .expect(200);
    expect(res.body).toMatchObject({
      isFirstTimeLogin: false,
      preferences: {
        timezone: 'Europe/London',
        currency: 'GBP',
        aiEnabled: false,
      },
    });
  });

  it('accepts only real images as avatars and serves them cacheably', async () => {
    const api = await signUp(t.app);
    const png = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );
    const fake = `data:image/png;base64,${Buffer.from('<svg onload=alert(1)>').toString('base64')}`;
    await api.put('/api/v1/users/me/avatar', { dataUrl: fake }).expect(400);
    const res = await api
      .put('/api/v1/users/me/avatar', {
        dataUrl: `data:image/png;base64,${png.toString('base64')}`,
      })
      .expect(200);
    expect(res.body.hasPhoto).toBe(true);
    const img = await api.get('/api/v1/users/me/avatar').expect(200);
    expect(img.headers['content-type']).toBe('image/png');
    expect(img.headers['cache-control']).toMatch(/private/);
    expect((await api.get('/api/v1/users/me')).body).not.toHaveProperty(
      'profilePhoto'
    );
  });

  it('deletes the account and all data after re-authentication', async () => {
    const api = await signUp(t.app);
    await api.post('/api/v1/expenses', rentLike());
    await api.del('/api/v1/users/me', { password: 'wrong-pass1' }).expect(403);
    await api.del('/api/v1/users/me', { password: 'password123' }).expect(204);
    await api.get('/api/v1/expenses').expect(401);
  });

  it('falls back to rule-based AI features when Gemini is not configured', async () => {
    const api = await signUp(t.app);
    const parsed = await api
      .post('/api/v1/ai/parse', { text: 'coffee 4.50 today' })
      .expect(200);
    expect(parsed.body).toMatchObject({
      source: 'rules',
      draft: { amount: 4.5, kind: 'expense' },
    });
    const insights = await api.get('/api/v1/ai/insights').expect(200);
    expect(insights.body).toMatchObject({
      source: 'rules',
      ai: { configured: false },
    });
    await api
      .post('/api/v1/ai/parse', { image: 'data:image/png;base64,AAAA' })
      .expect(400);
  });
});

function rentLike() {
  return { category: 'Rent', amount: 10, date: '2025-01-01' };
}
