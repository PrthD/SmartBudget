import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { signUp, useTestApp } from '../helpers.js';
import { User } from '../../src/models/User.js';

const t = useTestApp();

const refreshCookie = (res) =>
  res.headers['set-cookie']?.find((c) => c.startsWith('sb_rt='));

describe('auth', () => {
  it('registers with an httpOnly refresh cookie and never returns secrets', async () => {
    const res = await request(t.app)
      .post('/api/v1/auth/register')
      .send({ name: 'Ada', email: 'Ada@Example.com', password: 'secret123' })
      .expect(201);
    expect(res.body.accessToken).toBeTypeOf('string');
    expect(res.body.user).toMatchObject({
      name: 'Ada',
      email: 'ada@example.com',
    });
    expect(JSON.stringify(res.body)).not.toMatch(/password|profilePhoto/);
    const cookie = refreshCookie(res);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/);
    expect(cookie).toMatch(/SameSite=Lax/);
  });

  it('rejects weak passwords and duplicate emails with 4xx (v1 returned 500)', async () => {
    await request(t.app)
      .post('/api/v1/auth/register')
      .send({ name: 'A', email: 'a@example.com', password: 'short' })
      .expect(400);
    await signUp(t.app, { email: 'dup@example.com' });
    const res = await request(t.app)
      .post('/api/v1/auth/register')
      .send({ name: 'B', email: 'DUP@example.com', password: 'password123' })
      .expect(409);
    expect(res.body.error.message).toMatch(/already exists/);
  });

  it('uses one generic error for unknown email and wrong password', async () => {
    await signUp(t.app, { email: 'known@example.com' });
    const wrong = await request(t.app)
      .post('/api/v1/auth/login')
      .send({ email: 'known@example.com', password: 'nope12345' })
      .expect(401);
    const unknown = await request(t.app)
      .post('/api/v1/auth/login')
      .send({ email: 'ghost@example.com', password: 'nope12345' })
      .expect(401);
    expect(wrong.body.error.message).toBe(unknown.body.error.message);
  });

  it('still logs in v1 users whose passwords predate the new policy', async () => {
    await User.create({
      name: 'Old',
      email: 'old@example.com',
      password: 'abcdef',
    });
    await request(t.app)
      .post('/api/v1/auth/login')
      .send({ email: 'old@example.com', password: 'abcdef' })
      .expect(200);
  });

  it('rejects operator injection in credentials', async () => {
    await request(t.app)
      .post('/api/v1/auth/login')
      .send({ email: { $ne: null }, password: { $ne: null } })
      .expect(400);
  });

  it('protects the API and rejects forged tokens', async () => {
    await request(t.app).get('/api/v1/expenses').expect(401);
    await request(t.app)
      .get('/api/v1/expenses')
      .set('Authorization', 'Bearer not.a.jwt')
      .expect(401);
  });

  it('rotates refresh tokens and revokes the family when an old one is replayed', async () => {
    const registered = await request(t.app)
      .post('/api/v1/auth/register')
      .send({ name: 'R', email: 'rotate@example.com', password: 'password123' })
      .expect(201);
    const original = refreshCookie(registered).split(';')[0];

    const rotated = await request(t.app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', original)
      .expect(200);
    const newest = refreshCookie(rotated).split(';')[0];
    expect(newest).not.toBe(original);

    // Replaying a rotated token after the grace window signals theft.
    const { Session } = await import('../../src/models/Session.js');
    await Session.updateMany(
      { rotatedAt: { $ne: null } },
      { rotatedAt: new Date(Date.now() - 60_000) }
    );
    await request(t.app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', original)
      .expect(401);
    // …and the whole family, including the newest token, is revoked.
    await request(t.app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', newest)
      .expect(401);
  });

  it('tolerates two tabs refreshing with the same token at once', async () => {
    const registered = await request(t.app)
      .post('/api/v1/auth/register')
      .send({ name: 'T', email: 'tabs@example.com', password: 'password123' })
      .expect(201);
    const cookie = refreshCookie(registered).split(';')[0];
    const [a, b] = await Promise.all([
      request(t.app).post('/api/v1/auth/refresh').set('Cookie', cookie),
      request(t.app).post('/api/v1/auth/refresh').set('Cookie', cookie),
    ]);
    expect([a.status, b.status]).toEqual([200, 200]);
  });

  it('logs out by revoking the session', async () => {
    const api = await signUp(t.app);
    await api.agent.post('/api/v1/auth/logout').expect(204);
    await api.agent.post('/api/v1/auth/refresh').expect(401);
  });

  it('changes password with re-authentication only', async () => {
    const api = await signUp(t.app);
    await api
      .put('/api/v1/auth/password', {
        currentPassword: 'wrong-one1',
        newPassword: 'newpass123',
      })
      .expect(403);
    await api
      .put('/api/v1/auth/password', {
        currentPassword: 'password123',
        newPassword: 'newpass123',
      })
      .expect(204);
    await request(t.app)
      .post('/api/v1/auth/login')
      .send({ email: api.credentials.email, password: 'newpass123' })
      .expect(200);
  });
});
