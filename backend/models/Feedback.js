import mongoose from 'mongoose';

const feedbackSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true
    },
    messageId: {
      type: String,
      default: null
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      default: '',
      trim: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

export const Feedback = mongoose.model('Feedback', feedbackSchema);
export default Feedback;
