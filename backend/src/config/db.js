import mongoose from 'mongoose';
import { logger } from './logger.js';

// Operator injection ({ "$gt": "" }) is prevented at the edge: every request
// body/param is parsed by a zod schema that only admits primitives.
mongoose.set('strictQuery', true);

export async function connectDB(uri) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000 });
  logger.info('MongoDB connected');
}

export async function disconnectDB() {
  await mongoose.connection.close();
  logger.info('MongoDB connection closed');
}
