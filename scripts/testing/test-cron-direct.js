require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const webpush = require('web-push');

if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    `mailto:${process.env.VAPID_CONTACT_EMAIL || "noreply@attendease.app"}`,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
} else {
  console.log("VAPID missing");
}

async function main() {
  const user = await prisma.user.findUnique({
    where: { id: "cms0mf2w80000l104jfjlzk9a" },
    include: { pushSubscriptions: true }
  });
  
  const payload = {
    title: "Test Cron Push",
    body: "Does this work?",
    tag: "test",
    data: { url: "/dashboard" }
  };
  
  for (const s of user.pushSubscriptions) {
    try {
      console.log("Sending to:", s.endpoint);
      await webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
        JSON.stringify(payload)
      );
      console.log("Success");
    } catch (err) {
      console.error("Failed:", err);
    }
  }
}
main().finally(() => prisma.$disconnect());
