import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/customer_support_db',
  mlServiceUrl: process.env.ML_SERVICE_URL || 'http://127.0.0.1:5001',
  confidenceThreshold: parseFloat(process.env.CONFIDENCE_THRESHOLD || '0.60')
};

export default config;
