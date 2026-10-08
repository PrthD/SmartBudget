import mongoose from 'mongoose';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach } from 'vitest';
import { createApp } from '../src/app.js';

/** Boots the app on the shared in-memory DB and wipes data between tests. */
export function useTestApp() {
  const ctx = { app: null };
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI);
    }
    ctx.app = createApp();
  });
  beforeEach(async () => {
    const collections = await mongoose.connection.db.collections();
    await Promise.all(collections.map((c) => c.deleteMany({})));
  });
  afterAll(async () => {
    await mongoose.disconnect();
  });
  return ctx;
}

let counter = 0;

/** Registers a fresh user and returns an authenticated supertest agent. */
export async function signUp(app, overrides = {}) {
  counter += 1;
  const credentials = {
    name: 'Test User',
    email: `user${counter}@example.com`,
    password: 'password123',
    ...overrides,
  };
  const agent = request.agent(app);
  const res = await agent
    .post('/api/v1/auth/register')
    .send(credentials)
    .expect(201);
  const token = res.body.accessToken;
  const api = {
    agent,
    user: res.body.user,
    token,
    credentials,
    get: (url) => agent.get(url).set('Authorization', `Bearer ${token}`),
    post: (url, body) =>
      agent.post(url).set('Authorization', `Bearer ${token}`).send(body),
    patch: (url, body) =>
      agent.patch(url).set('Authorization', `Bearer ${token}`).send(body),
    put: (url, body) =>
      agent.put(url).set('Authorization', `Bearer ${token}`).send(body),
    del: (url, body) =>
      agent.delete(url).set('Authorization', `Bearer ${token}`).send(body),
  };
  return api;
}
