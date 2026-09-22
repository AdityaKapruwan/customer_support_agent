import Conversation from '../models/Conversation.js';
import Ticket from '../models/Ticket.js';
import { getMLPrediction } from '../services/mlService.js';
import { routeQuery } from '../services/routingService.js';
import { checkEscalation } from '../services/escalationService.js';

const isFollowUpMessage = (text) => {
  const trimmed = text.trim();
  const isNumericOrId = /^#?[A-Za-z0-9\-]{2,20}$/.test(trimmed);
  const isShortResponse = trimmed.split(/\s+/).length <= 2;
  return isNumericOrId || isShortResponse;
};

const getPreviousContext = (messages = []) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].intent) {
      return {
        intent: messages[i].intent,
        assignedAgent: messages[i].assignedAgent
      };
    }
  }
  return null;
};

/**
 * Controller for POST /api/chat
 */
export const handleChatMessage = async (req, res) => {
  try {
    const { conversationId: reqConvId, message: rawMessage } = req.body;

    if (!rawMessage || typeof rawMessage !== 'string' || !rawMessage.trim()) {
      return res.status(400).json({
        error: 'Validation Error: Message must be a non-empty string.'
      });
    }

    const messageText = rawMessage.trim();
    const conversationId = (reqConvId && typeof reqConvId === 'string' && reqConvId.trim())
      ? reqConvId.trim()
      : `conv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // 1. Find or create conversation document in MongoDB
    let conversation = await Conversation.findOne({ conversationId });
    if (!conversation) {
      conversation = new Conversation({
        conversationId,
        messages: []
      });
    }

    // 2. Access recent conversation history for follow-up context
    const previousContext = getPreviousContext(conversation.messages);
    let prediction;
    let isFollowUp = false;

    if (previousContext && isFollowUpMessage(messageText)) {
      isFollowUp = true;
      prediction = {
        intent: previousContext.intent,
        confidence: 0.95,
        probabilities: { [previousContext.intent]: 0.95 },
        sentiment: 'POSITIVE',
        contextInherited: true
      };
    } else {
      // Send query to Flask ML microservice (which returns intent, confidence, probabilities, sentiment)
      prediction = await getMLPrediction(messageText);
    }

    // 3. Check for Human Escalation conditions
    const escalationResult = checkEscalation(
      messageText,
      prediction.confidence,
      prediction.sentiment || 'POSITIVE',
      conversation.messages
    );

    let routingDecision;
    let ticketStatus = 'open';

    if (escalationResult.isEscalated) {
      ticketStatus = 'escalated';
      routingDecision = {
        routed: true,
        requiresClarification: false,
        assignedAgent: 'Human Support',
        confidenceScore: prediction.confidence,
        responseText: escalationResult.responseText,
        reason: escalationResult.reason
      };
    } else {
      // 4. Apply standard routing logic (with clarification if confidence < 0.60)
      routingDecision = routeQuery(prediction.intent, prediction.confidence, prediction.probabilities);
    }

    // 5. Store user message in Conversation history
    const userMessageObj = {
      messageId: `msg_${Date.now()}_user`,
      sender: 'user',
      text: messageText,
      timestamp: new Date(),
      intent: prediction.intent,
      confidence: prediction.confidence,
      assignedAgent: routingDecision.assignedAgent
    };
    conversation.messages.push(userMessageObj);

    // 6. Save Ticket in MongoDB
    const ticket = new Ticket({
      conversationId,
      query: messageText,
      predictedIntent: prediction.intent,
      confidence: prediction.confidence,
      assignedAgent: routingDecision.assignedAgent || 'Unassigned',
      status: ticketStatus
    });
    await ticket.save();

    // 7. Store Bot response message in Conversation history
    let botText = routingDecision.responseText;
    if (isFollowUp && !escalationResult.isEscalated) {
      const formattedIntent = prediction.intent.replace('_', ' ');
      botText = `Thank you! I have received your details ('${messageText}') for your ${formattedIntent} request and updated your ${routingDecision.assignedAgent || 'Support Agent'}.`;
    }

    const botMessageObj = {
      messageId: `msg_${Date.now()}_bot`,
      sender: 'bot',
      text: botText,
      timestamp: new Date(),
      intent: prediction.intent,
      confidence: prediction.confidence,
      assignedAgent: routingDecision.assignedAgent
    };
    conversation.messages.push(botMessageObj);

    await conversation.save();

    // 8. Return JSON payload to React client
    return res.status(200).json({
      success: true,
      conversationId,
      requiresClarification: routingDecision.requiresClarification || false,
      isEscalated: escalationResult.isEscalated,
      userMessage: userMessageObj,
      botMessage: botMessageObj,
      prediction,
      routing: routingDecision,
      ticket: {
        ticketId: ticket._id,
        status: ticket.status
      }
    });

  } catch (error) {
    console.error(`[Chat Controller Error]: ${error.message}`, error);
    return res.status(500).json({
      error: 'Internal Server Error: Failed to process chat message.'
    });
  }
};

/**
 * Controller for GET /api/conversations/:conversationId
 */
export const getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;

    if (!conversationId) {
      return res.status(400).json({ error: 'Missing required conversationId parameter.' });
    }

    const conversation = await Conversation.findOne({ conversationId });

    if (!conversation) {
      return res.status(404).json({
        error: `Conversation '${conversationId}' not found.`
      });
    }

    return res.status(200).json({
      success: true,
      conversationId: conversation.conversationId,
      messages: conversation.messages,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt
    });

  } catch (error) {
    console.error(`[Get Conversation Error]: ${error.message}`, error);
    return res.status(500).json({
      error: 'Internal Server Error: Failed to fetch conversation history.'
    });
  }
};

export default {
  handleChatMessage,
  getConversationHistory
};
