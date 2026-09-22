import {
  isFollowUpMessage,
  getPreviousContext,
  buildFollowUpBotResponse
} from './services/conversationService.js';

console.log('=================================================');
console.log('        CONVERSATION HISTORY UNIT TEST            ');
console.log('=================================================');

// Simulated order-tracking conversation stored in MongoDB
const sampleHistory = [
  {
    messageId: 'msg_1_user',
    sender: 'user',
    text: 'Where is my order?',
    timestamp: new Date('2026-09-13T10:00:00Z'),
    intent: 'order_tracking',
    confidence: 0.92,
    assignedAgent: 'Order Support Agent'
  },
  {
    messageId: 'msg_1_bot',
    sender: 'bot',
    text: 'Please provide your order ID.',
    timestamp: new Date('2026-09-13T10:00:01Z'),
    intent: 'order_tracking',
    confidence: 0.92,
    assignedAgent: 'Order Support Agent'
  }
];

console.log('\n1) Follow-up detection');
console.log('   "12345" is follow-up?     ', isFollowUpMessage('12345'));
console.log('   "Where is my order?" is follow-up?', isFollowUpMessage('Where is my order?'));

console.log('\n2) Previous context from stored history');
const context = getPreviousContext(sampleHistory);
console.log('   Intent         :', context?.intent);
console.log('   Assigned agent :', context?.assignedAgent);

console.log('\n3) Follow-up bot reply');
if (context) {
  const reply = buildFollowUpBotResponse('12345', context.intent, context.assignedAgent);
  console.log('   Bot says:', reply);
}

console.log('\n=================================================');
