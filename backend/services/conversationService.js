/**
 * Conversation history helpers.
 * Used by POST /api/chat to detect follow-up messages (e.g. order IDs)
 * and reuse intent context from earlier messages in the same conversation.
 */

/**
 * Returns true when a message looks like a short follow-up reply,
 * such as an order ID ("12345") or a brief answer ("yes").
 */
export const isFollowUpMessage = (text) => {
  const trimmed = text.trim();
  const isIdLike = /^#?[A-Za-z0-9\-]{2,20}$/.test(trimmed);
  const isShortReply = trimmed.split(/\s+/).length <= 2;
  return isIdLike || isShortReply;
};

/**
 * Reads stored messages (newest to oldest) and returns the most recent
 * routed context — intent and assigned agent from a prior turn.
 */
export const getPreviousContext = (messages = []) => {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];
    if (msg.intent && msg.assignedAgent) {
      return {
        intent: msg.intent,
        assignedAgent: msg.assignedAgent
      };
    }
  }
  return null;
};

/**
 * Builds the bot reply when the user sends a follow-up such as an order ID.
 */
export const buildFollowUpBotResponse = (userText, intent, assignedAgent) => {
  const formattedIntent = intent.replace(/_/g, ' ');
  return `Thank you! I have received your details ('${userText}') for your ${formattedIntent} request and updated your ${assignedAgent || 'Support Agent'}.`;
};

export default {
  isFollowUpMessage,
  getPreviousContext,
  buildFollowUpBotResponse
};
