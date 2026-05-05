import mongoose from 'mongoose';

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  console.log(`Connecting to MongoDB at ${mongoUri} ...`);

  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 7000
  });

  console.log('MongoDB connected');
}
