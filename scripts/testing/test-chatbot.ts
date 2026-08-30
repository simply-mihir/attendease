require('dotenv').config();
import { processChatbotMessage } from '../../src/lib/chatbot';
import { prisma } from '../../src/lib/db';

async function run() {
  // Try to find a user
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log("No user found in DB, can't test properly without a user ID.");
    return;
  }
  
  // Test a simple message
  console.log("Testing with user:", user.id);
  const res = await processChatbotMessage(user.id, 'mark dbms as present');
  console.log(JSON.stringify(res, null, 2));

  // Test bulk
  const res2 = await processChatbotMessage(user.id, 'mark all present');
  console.log(JSON.stringify(res2, null, 2));

  // Test next class
  const res3 = await processChatbotMessage(user.id, 'when is my next class');
  console.log(JSON.stringify(res3, null, 2));
}

run().catch(console.error).finally(() => prisma.$disconnect());
