const webpush = require('web-push');
require('dotenv').config();

try {
  webpush.setVapidDetails(
    'mailto:test@example.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
  console.log("VAPID Keys are valid and match");
} catch (e) {
  console.error("VAPID Error:", e);
}
