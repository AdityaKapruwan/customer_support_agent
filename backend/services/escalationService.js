/**
 * Human Escalation System Service
 * 
 * Evaluates 4 escalation conditions:
 * 1. User explicitly requests a human agent.
 * 2. Multiple consecutive low-confidence ML predictions (< 0.60).
 * 3. User repeats essentially the same query multiple times in history.
 * 4. Negative sentiment is detected.
 */

const HUMAN_KEYWORDS = [
  'human', 'agent', 'person', 'representative', 'operator',
  'speak to someone', 'real person', 'manager', 'supervisor',
  'talk to human', 'connect me to a person', 'customer service agent'
];

/**
 * Normalizes text for similarity comparison
 */
const normalizeText = (text = '') => {
  return text.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim();
};

/**
 * Checks if current message repeats a recent user message in history.
 */
const isRepeatedQuery = (currentText, conversationMessages = []) => {
  const normalizedCurrent = normalizeText(currentText);
  if (!normalizedCurrent || normalizedCurrent.length < 3) return false;

  const userMessages = conversationMessages
    .filter(m => m.sender === 'user')
    .slice(-3); // Look at last 3 user messages

  let matchCount = 0;
  for (const m of userMessages) {
    const norm = normalizeText(m.text);
    if (norm === normalizedCurrent || (norm.length > 5 && (norm.includes(normalizedCurrent) || normalizedCurrent.includes(norm)))) {
      matchCount++;
    }
  }
  return matchCount >= 1; // Repeated at least once before
};

/**
 * Checks if there are multiple consecutive low-confidence predictions in history.
 */
const hasConsecutiveLowConfidence = (currentConfidence, conversationMessages = [], threshold = 0.60) => {
  if (currentConfidence >= threshold) return false;

  const lastUserMessages = conversationMessages
    .filter(m => m.sender === 'user')
    .slice(-2); // Last 2 user messages in history

  if (lastUserMessages.length === 0) return false;

  // Check if previous user message was also low confidence
  const previousLowConfidence = lastUserMessages.some(m => typeof m.confidence === 'number' && m.confidence < threshold);
  return previousLowConfidence;
};

/**
 * Evaluates whether a query requires escalation to a human agent.
 * 
 * @param {string} query - The incoming user message.
 * @param {number} confidence - The ML prediction confidence score.
 * @param {string} sentiment - Predicted sentiment ('POSITIVE' or 'NEGATIVE').
 * @param {Array} conversationMessages - Array of previous messages in the conversation.
 * @returns {Object} { isEscalated, reason, responseText, assignedAgent, status }
 */
export const checkEscalation = (query, confidence, sentiment = 'POSITIVE', conversationMessages = []) => {
  const textLower = query.toLowerCase();

  // Condition 1: Explicit request for a human
  const explicitlyRequestedHuman = HUMAN_KEYWORDS.some(kw => textLower.includes(kw));
  if (explicitlyRequestedHuman) {
    return {
      isEscalated: true,
      status: 'escalated',
      assignedAgent: 'Human Support',
      reason: 'User explicitly requested to speak with a human support agent.',
      responseText: "I'm connecting you with a human support agent."
    };
  }

  // Condition 2: Negative sentiment detected
  if (sentiment === 'NEGATIVE') {
    return {
      isEscalated: true,
      status: 'escalated',
      assignedAgent: 'Human Support',
      reason: 'Negative sentiment / frustration detected in user query.',
      responseText: "I'm connecting you with a human support agent."
    };
  }

  // Condition 3: Repeated query detected
  if (isRepeatedQuery(query, conversationMessages)) {
    return {
      isEscalated: true,
      status: 'escalated',
      assignedAgent: 'Human Support',
      reason: 'User repeated the same query multiple times.',
      responseText: "I'm connecting you with a human support agent."
    };
  }

  // Condition 4: Multiple consecutive low-confidence predictions
  if (hasConsecutiveLowConfidence(confidence, conversationMessages)) {
    return {
      isEscalated: true,
      status: 'escalated',
      assignedAgent: 'Human Support',
      reason: 'Multiple consecutive low-confidence predictions detected.',
      responseText: "I'm connecting you with a human support agent."
    };
  }

  // No escalation required
  return {
    isEscalated: false,
    status: 'open',
    assignedAgent: null,
    reason: null,
    responseText: null
  };
};

export default {
  checkEscalation
};
