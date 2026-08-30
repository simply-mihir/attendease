require('dotenv').config();
const { GET } = require('./.next/server/app/api/cron/notifications/route.js');

async function test() {
  const req = {
    headers: {
      get: (k) => k === 'authorization' ? `Bearer ${process.env.CRON_SECRET || "development"}` : null
    },
    url: "http://localhost:3000/api/cron/notifications"
  };
  try {
    const res = await GET(req);
    const json = await res.json();
    console.log(JSON.stringify(json, null, 2));
  } catch (e) {
    console.error("Cron failed:", e);
  }
}
test();
