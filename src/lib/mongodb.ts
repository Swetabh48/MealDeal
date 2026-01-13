import mongoose from "mongoose";

// Ensure MONGODB_URI exists
const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  throw new Error("Please define MONGODB_URI in .env.local");
}

// Extend Node global type for mongoose cache
declare global {
  var _mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  } | undefined;
}

// Initialize cached connection
const cached = global._mongoose ?? (global._mongoose = { conn: null, promise: null });

async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    console.log('✅ Using cached MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    console.log('🔄 Connecting to MongoDB...');
    const opts = { 
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
    };
    
    cached.promise = mongoose.connect(MONGODB_URI!, opts)
      .then((m) => {
        console.log('✅ MongoDB connected successfully');
        return m;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e: any) {
    cached.promise = null;
    console.error('❌ MongoDB connection error:', e.message);
    throw new Error(`MongoDB connection failed: ${e.message}`);
  }

  return cached.conn;
}

export default connectDB;