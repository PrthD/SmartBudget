/**
 * Seeds the demo account into the database in MONGODB_URI.
 *
 *   npm run seed            → adds demo@smartbudget.dev / demo1234 (if missing)
 *   npm run seed -- --reset → drops the database first
 *
 * Refuses to touch anything but a local database.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { seedDemoData, DEMO_USER } from './seed.js';

const uri = process.env.MONGODB_URI ?? '';
const host = uri.match(/^mongodb:\/\/(?:[^@/]*@)?([^/:?,]+)/)?.[1];
const isLocal = host === 'localhost' || host === '127.0.0.1';

if (!isLocal || process.env.NODE_ENV === 'production') {
  console.error(
    `Refusing to seed: MONGODB_URI must point at localhost (got "${host ?? 'unparseable/SRV URI'}").`
  );
  process.exit(1);
}

await mongoose.connect(uri);
if (process.argv.includes('--reset')) {
  await mongoose.connection.dropDatabase();
  console.log(`Dropped ${mongoose.connection.name}`);
}
await seedDemoData();
await mongoose.disconnect();
console.log(`Seeded ${DEMO_USER.email} / ${DEMO_USER.password}`);
