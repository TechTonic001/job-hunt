import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

/**
 * Establishes connection to MongoDB using MONGO_URI
 * @returns {Promise<typeof mongoose>}
 */
export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      throw new Error('MONGO_URI is not defined in environment variables. Ensure backend/.env exists.');
    }
    const conn = await mongoose.connect(mongoUri);
    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    logger.error(error, 'MongoDB connection failed');
    process.exit(1);
  }
};

export default connectDB;
