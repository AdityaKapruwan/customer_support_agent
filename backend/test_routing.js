import { routeQuery, AGENT_MAPPING } from './services/routingService.js';
import { generateClarification } from './services/clarificationService.js';

console.log("=================================================");
console.log("     ROUTING & CLARIFICATION SERVICE UNIT TEST   ");
console.log("=================================================");

console.log("\nAgent Mappings:");
console.table(AGENT_MAPPING);

const testCases = [
  {
    intent: 'billing',
    confidence: 0.85,
    label: 'High Confidence Billing Query (>= 0.60)',
    probabilities: { billing: 0.85, complaint: 0.08, refund: 0.07 }
  },
  {
    intent: 'account_access',
    confidence: 0.35,
    label: 'Low Confidence Ambiguous Query (< 0.60)',
    probabilities: {
      account_access: 0.35,
      billing: 0.28,
      technical_support: 0.20,
      refund: 0.17
    }
  },
  {
    intent: 'order_tracking',
    confidence: 0.45,
    label: 'Low Confidence Order Query (< 0.60)',
    probabilities: {
      order_tracking: 0.45,
      order_cancellation: 0.35,
      refund: 0.20
    }
  },
  {
    intent: 'technical_support',
    confidence: 0.78,
    label: 'High Confidence Tech Support Query (>= 0.60)',
    probabilities: { technical_support: 0.78, product_information: 0.12, complaint: 0.10 }
  }
];

testCases.forEach(({ intent, confidence, probabilities, label }, idx) => {
  console.log(`\nTest #${idx + 1}: ${label}`);
  console.log(`  Input Intent         : ${intent}`);
  console.log(`  Input Confidence     : ${confidence}`);
  const result = routeQuery(intent, confidence, probabilities);
  console.log(`  Routed               : ${result.routed}`);
  console.log(`  RequiresClarification: ${result.requiresClarification}`);
  console.log(`  Assigned Agent       : ${result.assignedAgent}`);
  console.log(`  Response Message     : "${result.responseText}"`);
  console.log(`  Reason               : ${result.reason}`);
});

console.log('\n--- Direct Clarification Generation (account problem example) ---');
const accountProblemProbs = {
  account_access: 0.35,
  billing: 0.28,
  technical_support: 0.20,
  refund: 0.17
};
const clarification = generateClarification(accountProblemProbs);
console.log('  Probabilities        :', accountProblemProbs);
console.log('  requiresClarification:', clarification.requiresClarification);
console.log('  message              :', `"${clarification.message}"`);

console.log('\n=================================================');
