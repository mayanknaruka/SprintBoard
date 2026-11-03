import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

let memoryServer;

export async function connectDB() {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri === 'memory') {
    memoryServer = await MongoMemoryServer.create();
    const memUri = memoryServer.getUri();
    await mongoose.connect(memUri);
    console.log('MongoDB connected (in-memory)');
    return { mode: 'memory', uri: memUri };
  }

  await mongoose.connect(uri);
  console.log('MongoDB connected');
  return { mode: 'atlas', uri };
}

export async function disconnectDB() {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
}
