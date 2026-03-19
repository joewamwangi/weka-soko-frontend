const CACHE = "weka-soko-v2";
const STATIC = ["/", "/index.html", "/manifest.json"];

// ── Install ───────────────────────────────────────────────────────────────────
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC).catch(() => {})));
  self.skipWaiting();
});

// ── Activate ──────────────────────────────────────────────────────────────────
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

// ── Fetch (cache-first for static, network-first for API) ─────────────────────
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  if (e.request.url.includes("/api/")) return;
  e.respondWith(
    fetch(e.request).then(r => {
      if (r.ok) { const clone = r.clone(); caches.open(CACHE).then(c => c.put(e.request, clone)); }
      return r;
    }).catch(() => caches.match(e.request))
  );
});

// ── Push received ─────────────────────────────────────────────────────────────
self.addEventListener("push", e => {
  let data = { title: "Weka Soko", body: "You have a new notification.", icon: "/icon-192.png", badge: "/badge-72.png", tag: "weka-soko-notif", url: "/" };
  try { if (e.data) Object.assign(data, e.data.json()); } catch {}

  e.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: data.icon || "/icon-192.png",
      badge: data.badge || "/badge-72.png",
      tag: data.tag || "weka-soko-notif",
      data: { url: data.url || "/" },
      requireInteraction: false,
      vibrate: [200, 100, 200],
      // Show silently if tab is open and focused — avoids double alert
      silent: false,
    })
  );
});

// ── Notification click ────────────────────────────────────────────────────────
self.addEventListener("notificationclick", e => {
  e.notification.close();
  const target = e.notification.data?.url || "/";
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(all => {
      // If app is already open, focus it and navigate
      for (const client of all) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.focus();
          if ("navigate" in client) client.navigate(target);
          return;
        }
      }
      // Otherwise open a new tab
      if (clients.openWindow) return clients.openWindow(target);
    })
  );
});
