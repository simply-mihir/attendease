const CACHE_NAME = "attendease-v2";
const OFFLINE_URL = "/offline.html";

const PRECACHE_URLS = ["/", "/dashboard", "/offline.html"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});

// Push notification handler
self.addEventListener("push", (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error("[SW] Failed to parse push payload:", e);
    data = { title: "AttendEase", body: event.data.text() || "New notification" };
  }

  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/badge-72.png",
    tag: data.tag || "attendease",
    vibrate: data.vibrate || [200, 100, 200],
    requireInteraction: data.requireInteraction || false,
    data: data.data || {},
    actions: [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  // If this is a pre-class reminder with schedule data, add quick-mark actions
  if (options.data && options.data.scheduleId) {
    options.actions = [
      { action: "mark-present", title: "✓ Present" },
      { action: "mark-absent", title: "✗ Absent" },
      { action: "mark-cancelled", title: "⊘ Cancelled" }
    ];
  }

  event.waitUntil(self.registration.showNotification(data.title || "AttendEase", options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const data = event.notification.data || {};
  const url = data.url || "/dashboard";

  // Handle Quick-Mark actions
  if (event.action === "mark-present" || event.action === "mark-absent" || event.action === "mark-cancelled") {
    const status = event.action === "mark-present" ? "PRESENT" : event.action === "mark-absent" ? "ABSENT" : "CANCELLED";
    
    event.waitUntil(
      fetch("/api/v1/attendance/quick-mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scheduleId: data.scheduleId,
          userId: data.userId,
          token: data.quickMarkToken,
          status: status,
        }),
      })
      .then((res) => res.json())
      .then((resData) => {
        if (resData.success) {
          return self.registration.showNotification("Attendance Marked", {
            body: `Successfully marked ${status.toLowerCase()} for ${resData.subjectName}`,
            icon: "/icons/icon-192.png",
            badge: "/icons/badge-72.png",
            tag: "attendance-success",
          });
        } else {
          throw new Error(resData.error || "Failed");
        }
      })
      .catch((err) => {
        console.error("[SW] Quick-mark failed:", err);
        return self.registration.showNotification("Failed to mark attendance", {
          body: "Please open the app to mark your attendance.",
          icon: "/icons/icon-192.png",
          badge: "/icons/badge-72.png",
          tag: "attendance-error",
          data: { url: "/dashboard" }
        });
      })
    );
    return;
  }

  // Default: Open the app
  event.waitUntil(
    self.clients.matchAll({ type: "window" }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && "focus" in client) {
          return client.focus();
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Alarm handler — play sound on notification
self.addEventListener("message", (event) => {
  if (event.data?.type === "SCHEDULE_ALARM") {
    const { title, body, delay, sound, data = {} } = event.data;
    
    // Add actions if it's a pre-class reminder
    const actions = data.scheduleId ? [
      { action: "mark-present", title: "✓ Present" },
      { action: "mark-absent", title: "✗ Absent" },
      { action: "mark-cancelled", title: "⊘ Cancelled" }
    ] : [];

    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        vibrate: [300, 100, 300, 100, 300],
        tag: "alarm",
        requireInteraction: true,
        data: { url: "/dashboard", sound, ...data },
        actions
      });
    }, delay);
  }
});
