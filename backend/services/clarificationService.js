/**
 * Short, human-readable phrases for each intent class.
 * Used to build disambiguation questions from top ML probabilities — no LLM required.
 */
const INTENT_DESCRIPTIONS = {
  account_access: 'logging in or accessing your account',
  billing: 'making a payment',
  refund: 'requesting a refund',
  order_tracking: 'tracking a delivery',
  order_cancellation: 'canceling an order',
  technical_support: 'experiencing a technical issue',
  subscription: 'managing your subscription',
  product_information: 'learning about a product',
  sales: 'getting pricing information',
  complaint: 'filing a complaint'
};

/**
 * Generates a targeted clarification question based on top predicted intent probabilities.
 * 
 * @param {Object} probabilities - Object mapping intent names to probability scores (sorted descending).
 * @param {number} topK - Number of top intent candidates to include (default: 3).
 * @returns {Object} - { requiresClarification: true, message: string }
 */
export const generateClarification = (probabilities = {}, topK = 3) => {
  if (!probabilities || Object.keys(probabilities).length === 0) {
    return {
      requiresClarification: true,
      message: 'Could you please provide a few more details about your request so we can route you to the right agent?'
    };
  }

  // Sort intents by probability score in descending order
  const sortedIntents = Object.entries(probabilities)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topK)
    .map(([intent]) => intent);

  // Map intents to descriptive phrases
  const phrases = sortedIntents
    .map(intent => INTENT_DESCRIPTIONS[intent])
    .filter(Boolean);

  if (phrases.length === 0) {
    return {
      requiresClarification: true,
      message: 'Could you please clarify what you need help with today?'
    };
  }

  let optionsText = '';
  if (phrases.length === 1) {
    optionsText = phrases[0];
  } else if (phrases.length === 2) {
    optionsText = `${phrases[0]} or ${phrases[1]}`;
  } else {
    optionsText = `${phrases.slice(0, -1).join(', ')}, or ${phrases[phrases.length - 1]}`;
  }

  const message = `Could you tell me whether you are having trouble ${optionsText}?`;

  return {
    requiresClarification: true,
    message
  };
};

export default {
  generateClarification
};
