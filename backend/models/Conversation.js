import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    messageId: {
      type: String,
      required: true
    },
    sender: {
      type: String,
      required: true,
      enum: ['user', 'agent', 'bot', 'system']
    },
    text: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    intent: {
      type: String,
      default: null
    },
    confidence: {
      type: Number,
      default: null
    },
    assignedAgent: {
      type: String,
      default: null
    }
  },
  { _id: false }
);

const conversationSchema = new mongoose.Schema(
  {
    conversationId: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    messages: [messageSchema]
  },
  {
    timestamps: true
  }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);
export default Conversation;
