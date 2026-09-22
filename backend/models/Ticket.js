import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      index: true
    },
    query: {
      type: String,
      required: true,
      trim: true
    },
    predictedIntent: {
      type: String,
      required: true,
      trim: true
    },
    confidence: {
      type: Number,
      required: true,
      min: 0,
      max: 1
    },
    assignedAgent: {
      type: String,
      default: null,
      trim: true
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed', 'escalated'],
      default: 'open'
    },
    escalated: {
      type: Boolean,
      default: false
    },
    escalationScore: {
      type: Number,
      default: 0
    },
    escalationReasons: {
      type: [String],
      default: []
    },
    sentiment: {
      label: { type: String, default: null },
      score: { type: Number, default: null },
      is_negative: { type: Boolean, default: false }
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }
);

export const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
