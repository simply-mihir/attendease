const CACHE_NAME = "attendease-v1";
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

  const data = event.data.json();
  const options = {
    body: data.body,
    icon: data.icon || "/icons/icon-192.png",
    badge: data.badge || "/icons/badge-72.png",
    tag: data.tag || "attendease",
    vibrate: [200, 100, 200],
    data: data.data || {},
    actions: [
      { action: "open", title: "Open App" },
      { action: "dismiss", title: "Dismiss" },
    ],
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Notification click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "dismiss") return;

  const url = event.notification.data?.url || "/dashboard";

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
    const { title, body, delay, sound } = event.data;
    setTimeout(() => {
      self.registration.showNotification(title, {
        body,
        icon: "/icons/icon-192.png",
        vibrate: [300, 100, 300, 100, 300],
        tag: "alarm",
        requireInteraction: true,
        data: { url: "/dashboard", sound },
      });
    }, delay);
  }
});
