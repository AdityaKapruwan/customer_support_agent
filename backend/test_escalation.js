import {
  evaluateEscalation,
  asksForHuman,
  hasRepeatedQuestion,
  countConsecutiveLowConfidence
} from './services/escalationService.js';

console.log('=================================================');
console.log('           ESCALATION SERVICE UNIT TEST           ');
console.log('=================================================');

const lowConfidenceHistory = [
  {
    sender: 'user',
    text: 'I have a problem with my account.',
    confidence: 0.35
  },
  {
    sender: 'bot',
    text: 'Could you clarify your request?',
    confidence: 0.35
  }
];

const tests = [
  {
    label: 'Explicit human request',
    input: {
      messageText: 'I want to speak to a human agent please.',
      messages: [],
      currentConfidence: 0.92,
      sentiment: { is_negative: false }
    }
  },
  {
    label: 'Two consecutive low-confidence turns',
    input: {
      messageText: 'Still not sure what is wrong.',
      messages: lowConfidenceHistory,
      currentConfidence: 0.41,
      sentiment: { is_negative: false }
    }
  },
  {
    label: 'Repeated question',
    input: {
      messageText: 'Where is my order?',
      messages: [
        { sender: 'user', text: 'Where is my order?', confidence: 0.88 },
        { sender: 'bot', text: 'Please provide your order ID.', confidence: 0.88 }
      ],
      currentConfidence: 0.88,
      sentiment: { is_negative: false }
    }
  },
  {
    label: 'Negative sentiment',
    input: {
      messageText: 'This is terrible service and I am very angry.',
      messages: [],
      currentConfidence: 0.82,
      sentiment: { label: 'NEGATIVE', score: 0.98, is_negative: true }
    }
  },
  {
    label: 'Normal routed message',
    input: {
      messageText: 'My payment failed yesterday.',
      messages: [],
      currentConfidence: 0.91,
      sentiment: { label: 'NEGATIVE', score: 0.55, is_negative: false }
    }
  }
];

tests.forEach(({ label, input }, index) => {
  const result = evaluateEscalation(input);
  console.log(`\nTest #${index + 1}: ${label}`);
  console.log('  Should escalate :', result.shouldEscalate);
  console.log('  Score           :', result.score);
  console.log('  Reasons         :', result.reasons.join(', ') || 'none');
  console.log('  Message         :', result.message || 'n/a');
});

console.log('\nHelper checks:');
console.log('  asksForHuman("talk to a real person") =>', asksForHuman('talk to a real person'));
console.log('  hasRepeatedQuestion("where is my order", history) =>', hasRepeatedQuestion('where is my order', [
  { sender: 'user', text: 'Where is my order?' }
]));
console.log('  consecutive low-confidence count =>', countConsecutiveLowConfidence(lowConfidenceHistory, 0.42));

console.log('\n=================================================');
