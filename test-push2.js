const webpush = require('web-push');
require('dotenv').config();

webpush.setVapidDetails(
  `mailto:${process.env.VAPID_CONTACT_EMAIL}`,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

async function main() {
  const sub = {
    endpoint: "https://fcm.googleapis.com/fcm/send/fx0taPen5Hk:APA91bE7eUdfLKgbDRXIavPn99Cv99knB5I79KKLW44Ay2VB2C3nLg73pgMV1lvqlqzBnKtYzFlOTXiXjDxA69hq_s0QMePyc37cjwrNcNRX1dhJx42ONZO4V6o0fnVyckwMbwu-Lv1w",
    keys: {
      p256dh: "BJbjKh5AiHx7ac_go9E4PcTyDSgq5QnTVCNPbasiOJO_qBou5XWkBr7G0EV5UB08pXU-LIduMlC7NMwR3vsh55Y",
      auth: "KKfrtoXgHyBtoDM1CUa5ZA"
    }
  };

  try {
    await webpush.sendNotification(sub, JSON.stringify({ title: "Test", body: "Hello" }));
    console.log("Success");
  } catch (err) {
    console.error("Failed:", err);
  }
}
main();
