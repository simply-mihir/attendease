const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const subs = await prisma.pushSubscription.findMany();
  console.log("Subscriptions:", JSON.stringify(subs, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
