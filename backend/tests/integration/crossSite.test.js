import { describe, expect, it } from 'vitest';

// Production defaults: the web app and API are on different sites (two
// *.onrender.com hosts), so the refresh cookie is cross-site. Set before the
// app (and so src/config/env.js) is first imported in this file.
process.env.NODE_ENV = 'production';
process.env.CORS_ORIGINS = 'https://web.example.com';
delete process.env.COOKIE_SAMESITE;
delete process.env.COOKIE_SECURE;

const { default: request } = await import('supertest');
const { useTestApp } = await import('../helpers.js');

const t = useTestApp();
const WEB = 'https://web.example.com';
const credentials = {
  name: 'Ada',
  email: 'ada@example.com',
  password: 'secret123',
};

const refreshCookie = (res) =>
  res.headers['set-cookie']?.find((c) => c.startsWith('sb_rt='));

describe('cross-site session cookie (production)', () => {
  it('issues a Secure, SameSite=None, Partitioned refresh cookie', async () => {
    const res = await request(t.app)
      .post('/api/v1/auth/register')
      .set('Origin', WEB)
      .send(credentials)
      .expect(201);
    expect(res.headers['access-control-allow-origin']).toBe(WEB);
    expect(res.headers['access-control-allow-credentials']).toBe('true');
    const cookie = refreshCookie(res);
    expect(cookie).toMatch(/HttpOnly/);
    expect(cookie).toMatch(/Secure/);
    expect(cookie).toMatch(/SameSite=None/);
    expect(cookie).toMatch(/Partitioned/);

    // The cookie works from the web app's origin.
    const refreshed = await request(t.app)
      .post('/api/v1/auth/refresh')
      .set('Origin', WEB)
      .set('Cookie', cookie.split(';')[0])
      .expect(200);
    expect(refreshed.body.accessToken).toBeTypeOf('string');
  });

  it('rejects cookie endpoints called from other sites (CSRF)', async () => {
    const res = await request(t.app)
      .post('/api/v1/auth/register')
      .set('Origin', WEB)
      .send(credentials)
      .expect(201);
    const cookie = refreshCookie(res).split(';')[0];

    for (const path of ['/refresh', '/logout']) {
      await request(t.app)
        .post(`/api/v1/auth${path}`)
        .set('Origin', 'https://evil.example')
        .set('Cookie', cookie)
        .expect(403);
    }
    // Login CSRF: signing a visitor into someone else's account.
    await request(t.app)
      .post('/api/v1/auth/login')
      .set('Origin', 'https://evil.example')
      .send(credentials)
      .expect(403);
    // The session survived the attempts.
    await request(t.app)
      .post('/api/v1/auth/refresh')
      .set('Origin', WEB)
      .set('Cookie', cookie)
      .expect(200);
  });
});
