// KasKu Service Worker — Cache-first for static assets, Network-first for API/HTML
const CACHE_NAME = 'kasku-cache-v1';

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// ── Install: pre-cache essential assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  // Activate immediately without waiting for old SW to finish
  self.skipWaiting();
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    )
  );
  // Take control of all open tabs immediately
  self.clients.claim();
});

// ── Fetch: routing strategy ──
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip cross-origin requests
  if (url.origin !== self.location.origin) return;

  // API routes: network-only (no caching)
  if (url.pathname.startsWith('/api/')) return;

  // Static assets (_next/static, icons, fonts): cache-first
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.match(/\.(png|jpg|jpeg|gif|svg|webp|woff2?|ttf|otf|css|js)$/)
  ) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // HTML pages (navigation): network-first with cache fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: network-first
  event.respondWith(networkFirst(request));
});

// ── Cache-first strategy ──
async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    // Return a basic offline response for assets
    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// ── Network-first strategy ──
async function networkFirst(request) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;

    // Offline fallback for navigation requests
    if (request.mode === 'navigate') {
      return new Response(
        '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>KasKu — Offline</title><style>*{margin:0;padding:0;box-sizing:border-box}body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0A0A15;color:#E2E8F0;font-family:Inter,system-ui,sans-serif;text-align:center;padding:2rem}.container{max-width:360px}.icon{font-size:4rem;margin-bottom:1rem}h1{font-size:1.5rem;font-weight:700;margin-bottom:.5rem;background:linear-gradient(135deg,#9F67FF,#7C3AED,#06B6D4);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}p{color:#94A3B8;margin-bottom:1.5rem;line-height:1.6}button{padding:12px 32px;border:none;border-radius:12px;background:#7C3AED;color:#fff;font-size:1rem;font-weight:600;cursor:pointer;transition:all .2s}button:hover{background:#5B21B6;transform:translateY(-1px)}</style></head><body><div class="container"><div class="icon">📡</div><h1>Anda Sedang Offline</h1><p>Periksa koneksi internet Anda dan coba lagi.</p><button onclick="location.reload()">Coba Lagi</button></div></body></html>',
        {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' },
        }
      );
    }

    return new Response('', { status: 408, statusText: 'Offline' });
  }
}

// ── Push notification handler ──
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icons/icon-192x192.png',
      badge: '/icons/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || '/dashboard',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

// ── Notification click handler ──
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/dashboard';
  event.waitUntil(clients.openWindow(targetUrl));
});
