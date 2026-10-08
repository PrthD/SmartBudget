import { inject } from 'vitest';

// Must be set before src/config/env.js is first imported. dotenv never
// overrides existing variables, so a local .env can't point tests at a real DB.
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'silent';
process.env.MONGODB_URI = inject('mongoUri');
process.env.JWT_SECRET = 'test-secret-that-is-definitely-long-enough';
process.env.GEMINI_API_KEY = '';
process.env.CORS_ORIGINS = 'http://localhost:3000';
