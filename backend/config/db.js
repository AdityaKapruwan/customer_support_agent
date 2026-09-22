import mongoose from 'mongoose';
import config from './config.js';

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongodbUri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`[Database Error] MongoDB connection failed: ${error.message}`);
    // Do not crash app if DB connection fails, but log error
    return null;
  }
};

export default connectDB;
