/**
 * Runs the API against a throwaway in-memory MongoDB with demo data, so local
 * development never touches a real database.
 *
 *   npm run dev:memory   →   sign in as demo@smartbudget.dev / demo1234
 */
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
process.env.MONGODB_URI = mongo.getUri('smartbudget');
process.env.NODE_ENV ??= 'development';
process.env.JWT_SECRET ??= 'local-development-secret-that-is-long-enough';
process.env.FRONTEND_DEV_ORIGIN ??= 'http://localhost:3000';

const { seedDemoData } = await import('./seed.js');
const mongoose = (await import('mongoose')).default;
await mongoose.connect(process.env.MONGODB_URI);
await seedDemoData();
await mongoose.disconnect();

await import('../server.js');

const stop = async () => {
  await mongo.stop();
};
process.on('exit', stop);
