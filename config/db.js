import mongoose from 'mongoose';
export default async function connectDB() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) throw new Error('MongoDB connection string is missing. Set MONGODB_URI in backend/.env');
  await mongoose.connect(uri);
  console.log('MongoDB connected');
}
