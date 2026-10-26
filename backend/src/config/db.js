import mongoose from 'mongoose';
import logger from '../utils/logger.js';

/**
 * Establishes connection to MongoDB using MONGO_URI
 * @returns {Promise<typeof mongoose>}
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(error, 'MongoDB connection failed');
    process.exit(1);
  }
};

export default connectDB;
