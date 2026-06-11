import mongoose from 'mongoose';
import { config } from './env.js';

export async function connectDb() {
  mongoose.connection.on('connected', () => {
    console.log(`[db] connected to ${config.mongoUri}`);
  });
  mongoose.connection.on('error', (err) => {
    console.error('[db] connection error:', err.message);
  });

  await mongoose.connect(config.mongoUri);
  return mongoose.connection;
}
