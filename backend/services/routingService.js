import config from '../config/config.js';
import { generateClarification } from './clarificationService.js';

/**
 * Agent Mapping Dictionary
 * Maps each ML predicted intent label to its designated specialized support agent.
 */
export const AGENT_MAPPING = {
  billing: 'Billing Agent',
  refund: 'Refund Agent',
  order_tracking: 'Order Support Agent',
  order_cancellation: 'Order Support Agent',
  technical_support: 'Technical Support Agent',
  account_access: 'Account Support Agent',
  subscription: 'Subscription Agent',
  product_information: 'Product Information Agent',
  sales: 'Sales Agent',
  complaint: 'Customer Relations Agent'
};

/**
 * Intent-specific first replies (used before follow-up details like an order ID).
 */
const INTENT_RESPONSES = {
  order_tracking: 'Please provide your order ID.',
  order_cancellation: 'Please provide your order ID so we can locate the order.'
};

/**
 * Initial automated greetings / response templates per agent
 */
const AGENT_RESPONSE_TEMPLATES = {
  'Billing Agent': 'Your billing inquiry has been received and routed to our Billing Agent.',
  'Refund Agent': 'Your refund request has been received and routed to our Refund Agent.',
  'Order Support Agent': 'Your order status or cancellation request has been routed to our Order Support Agent.',
  'Technical Support Agent': 'Your technical issue has been routed to our Technical Support Agent.',
  'Account Support Agent': 'Your account login or security inquiry has been routed to our Account Support Agent.',
  'Subscription Agent': 'Your membership inquiry has been routed to our Subscription Agent.',
  'Product Information Agent': 'Your product spec query has been routed to our Product Information Agent.',
  'Sales Agent': 'Your inquiry has been routed to our Sales Agent.',
  'Customer Relations Agent': 'Your feedback has been escalated directly to our Customer Relations Agent.'
};

/**
 * Executes customer query routing logic.
 * 
 * @param {string} intent - Predicted intent from ML model.
 * @param {number} confidence - Confidence score from ML model.
 * @param {Object} probabilities - Object mapping intent names to confidence probabilities.
 * @returns {Object} Routing decision containing assignedAgent, routed status, clarification data, and response text.
 */
export const routeQuery = (intent, confidence, probabilities = {}) => {
  const threshold = config.confidenceThreshold;

  // Rule 1: High confidence (>= CONFIDENCE_THRESHOLD) -> Route to specialized agent
  if (confidence >= threshold) {
    const assignedAgent = AGENT_MAPPING[intent] || 'General Support Agent';
    const responseText = INTENT_RESPONSES[intent]
      || AGENT_RESPONSE_TEMPLATES[assignedAgent]
      || `Your request has been routed to our ${assignedAgent}.`;

    return {
      routed: true,
      requiresClarification: false,
      assignedAgent: assignedAgent,
      confidenceScore: confidence,
      confidenceThreshold: threshold,
      responseText: responseText,
      reason: `Confidence score (${(confidence * 100).toFixed(1)}%) meets or exceeds threshold (${(threshold * 100).toFixed(1)}%). Automatically assigned to ${assignedAgent}.`
    };
  }

  // Rule 2: Low confidence (< CONFIDENCE_THRESHOLD) -> Do NOT auto-assign agent, return clarification
  const clarification = generateClarification(probabilities);

  return {
    routed: false,
    requiresClarification: true,
    assignedAgent: null,
    confidenceScore: confidence,
    confidenceThreshold: threshold,
    responseText: clarification.message,
    clarificationMessage: clarification.message,
    reason: `Confidence score (${(confidence * 100).toFixed(1)}%) is below threshold (${(threshold * 100).toFixed(1)}%). Clarification question generated.`
  };
};

export default {
  AGENT_MAPPING,
  routeQuery
};
