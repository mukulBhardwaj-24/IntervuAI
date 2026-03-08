import mongoose from 'mongoose';

export async function connectDB() {
  const mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set in backend/.env');
  }

  await mongoose.connect(mongoUri);
  console.log('MongoDB connected');
}
