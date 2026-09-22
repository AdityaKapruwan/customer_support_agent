import express from 'express';
import cors from 'cors';
import config from './config/config.js';
import connectDB from './config/db.js';
import chatRoutes from './routes/chatRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();

app.use(cors());
app.use(express.json());

// Initialize MongoDB connection
connectDB();

// Mount API routes
app.use('/api', chatRoutes);
app.use('/api', feedbackRoutes);
app.use('/api', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'backend-api',
    mongodbUriConfigured: Boolean(config.mongodbUri),
    mlServiceUrl: config.mlServiceUrl
  });
});

app.listen(config.port, () => {
  console.log(`Backend Express server running on port ${config.port}`);
});
