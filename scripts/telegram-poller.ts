import { parseArgs } from "util";

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!TELEGRAM_BOT_TOKEN) {
  console.error("❌ TELEGRAM_BOT_TOKEN is missing in .env");
  process.exit(1);
}

const API_BASE = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
const LOCAL_WEBHOOK_URL = "http://localhost:3000/api/v1/telegram/connect";

let lastUpdateId = 0;

async function poll() {
  try {
    const res = await fetch(`${API_BASE}/getUpdates?offset=${lastUpdateId + 1}&timeout=30`);
    if (!res.ok) {
      console.error("Failed to fetch updates:", res.statusText);
      setTimeout(poll, 2000);
      return;
    }

    const data = await res.json();
    
    if (data.ok && data.result.length > 0) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        
        if (update.message) {
          console.log(`Forwarding message from ${update.message.from?.username || update.message.chat.id}: ${update.message.text}`);
          
          await fetch(LOCAL_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(update),
          }).catch(err => console.error("Failed to forward to localhost:", err));
        }
      }
    }
  } catch (error) {
    console.error("Polling error:", error);
  }

  setTimeout(poll, 1000);
}

console.log("🤖 Started Telegram Local Poller");
console.log(`Forwarding updates to: ${LOCAL_WEBHOOK_URL}`);
console.log("Press Ctrl+C to exit.\n");

// Ensure any existing webhook is deleted so getUpdates works
fetch(`${API_BASE}/deleteWebhook`).then(() => {
  poll();
});
