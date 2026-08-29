import mongoose from 'mongoose';
import { env } from './env.js';

mongoose.set('strictQuery', true);

export async function connectDB(): Promise<void> {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log(`[db] Connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (error) {
    console.error('[db] Connection failed:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
}

mongoose.connection.on('disconnected', () => {
  console.warn('[db] Disconnected');
});

mongoose.connection.on('error', (error) => {
  console.error('[db] Connection error:', error);
});
