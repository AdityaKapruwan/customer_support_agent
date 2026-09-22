import Feedback from '../models/Feedback.js';

/**
 * Handles POST /api/feedback
 */
export const submitFeedback = async (req, res) => {
  try {
    const { conversationId, messageId, rating, comment } = req.body;

    if (!conversationId || rating === undefined || rating === null) {
      return res.status(400).json({
        error: 'Validation Error: conversationId and rating (1-5 or 0/1) are required.'
      });
    }

    const numRating = Number(rating);
    if (isNaN(numRating) || numRating < 1 || numRating > 5) {
      return res.status(400).json({
        error: 'Validation Error: Rating must be between 1 and 5.'
      });
    }

    const feedback = new Feedback({
      conversationId: String(conversationId).trim(),
      messageId: messageId ? String(messageId).trim() : null,
      rating: numRating,
      comment: comment ? String(comment).trim() : '',
      createdAt: new Date()
    });

    await feedback.save();

    return res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully.',
      feedbackId: feedback._id
    });

  } catch (error) {
    console.error('[Feedback Controller Error]:', error);
    return res.status(500).json({ error: 'Internal Server Error: Failed to save feedback.' });
  }
};

/**
 * Handles GET /api/feedback/stats
 */
export const getFeedbackStats = async (req, res) => {
  try {
    const total = await Feedback.countDocuments();
    const helpful = await Feedback.countDocuments({ rating: { $gte: 4 } });
    const unhelpful = await Feedback.countDocuments({ rating: { $lte: 3 } });

    return res.status(200).json({
      success: true,
      totalFeedback: total,
      helpfulCount: helpful,
      unhelpfulCount: unhelpful,
      helpfulPercentage: total > 0 ? Math.round((helpful / total) * 100) : 0
    });
  } catch (error) {
    console.error('[Feedback Stats Error]:', error);
    return res.status(500).json({ error: 'Internal Server Error: Failed to fetch feedback stats.' });
  }
};

export default {
  submitFeedback,
  getFeedbackStats
};
