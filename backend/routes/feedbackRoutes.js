import express from 'express';
import { submitFeedback, getFeedbackStats } from '../controllers/feedbackController.js';

const router = express.Router();

router.post('/feedback', submitFeedback);
router.get('/feedback/stats', getFeedbackStats);

export default router;
