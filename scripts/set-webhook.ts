import { parseArgs } from "util";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is missing in .env");
  process.exit(1);
}

const WEBHOOK_URL = "https://attendease-c7wl.vercel.app/api/v1/telegram/connect";
const API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function setWebhook() {
  console.log(`Setting Telegram webhook to: ${WEBHOOK_URL}...`);
  try {
    const res = await fetch(`${API_BASE}/setWebhook?url=${encodeURIComponent(WEBHOOK_URL)}`);
    const data = await res.json();
    if (data.ok) {
      console.log("✅ Webhook successfully set!");
      console.log("Your bot will now receive messages via your Vercel deployment.");
    } else {
      console.error("❌ Failed to set webhook:", data.description);
    }
  } catch (error) {
    console.error("❌ Error setting webhook:", error);
  }
}

setWebhook();
