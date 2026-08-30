const http = require('http');

async function testCron() {
  console.log("Triggering cron...");
  const res = await fetch("http://localhost:3000/api/cron/notifications", {
    method: "GET",
    headers: {
      "Authorization": "Bearer " + (process.env.CRON_SECRET || "development")
    }
  });
  const data = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", data);
}

testCron();
