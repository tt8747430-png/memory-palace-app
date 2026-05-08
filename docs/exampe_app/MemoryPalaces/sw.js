/**
 * App version — must match APP_VERSION in src/js/app.js (single source of truth).
 * Bump this on every release so the service worker invalidates stale caches.
 * Guide §V (Build/Release/Run): immutable releases with unique IDs.
 */
const APP_VERSION = '1.0.1';
const CACHE_NAME = `memory-palace-v${APP_VERSION}`;
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './public/icons/icon-192.png',
  './public/icons/icon-512.png',
  './public/fonts/inter-latin.woff2',
  './public/fonts/inter-latin-ext.woff2',
  './public/fonts/playfair-display-latin.woff2',
  './public/fonts/playfair-display-latin-ext.woff2',
  './public/fonts/space-grotesk-latin.woff2',
  './public/fonts/space-grotesk-latin-ext.woff2',
  './src/css/variables.css',
  './src/css/base.css',
  './src/css/components.css',
  './src/css/layout.css',
  './src/css/premium.css',
  './src/css/responsive.css',
  './src/css/theme-dark.css',
  './src/css/features.css',
  './src/js/app.js',
  './src/js/modules/EventBus.js',
  './src/js/modules/EventHandlers.js',
  './src/js/modules/HtmlPalaceParser.js',
  './src/js/modules/JourneyUI.js',
  './src/js/modules/Logger.js',
  './src/js/modules/NotificationManager.js',
  './src/js/modules/PalaceManager.js',
  './src/js/modules/PracticeManager.js',
  './src/js/modules/PracticeUI.js',
  './src/js/modules/StatisticsUI.js',
  './src/js/modules/StationEditorUI.js',
  './src/js/modules/ThemeManager.js',
  './src/js/modules/UIController.js',
  './src/js/modules/SyncManager.js',
  './src/js/modules/WebVitals.js',
  './src/js/modules/firebase-config.js',
  './src/js/modules/validation.js',
  './src/js/modules/utils.js',
  './src/js/modules/version.js',
];

// Firebase / Google API domains that must NEVER be served from cache
const PASSTHROUGH_ORIGINS = [
  'firestore.googleapis.com',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'accounts.google.com',
  'apis.google.com',
  'www.gstatic.com',
];

self.addEventListener('install', (event) => {
  // Separate core app assets from fonts.
  // Core assets: ALL must succeed — if any 404 the install aborts.
  // Fonts:       best-effort — a CDN propagation delay must not kill the SW install.
  const fontAssets = ASSETS_TO_CACHE.filter((url) => url.includes('/fonts/'));
  const coreAssets = ASSETS_TO_CACHE.filter((url) => !url.includes('/fonts/'));

  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      console.log('Opened cache');
      // Cache core assets — abort install if any fail
      await cache.addAll(coreAssets);
      // Cache fonts — failures are swallowed so install always completes
      await Promise.allSettled(fontAssets.map((url) => cache.add(url).catch(() => null)));
    }),
    // Do NOT call self.skipWaiting() here — the user-prompted
    // SKIP_WAITING flow in app.js handles activation via the
    // message listener below. Auto-skipping would bypass the prompt.
  );
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return;
  }

  const url = new URL(event.request.url);
  // Never intercept third-party traffic. This avoids null responses on opaque
  // cross-origin requests (e.g. Google auth/beacon assets).
  if (url.origin !== self.location.origin) {
    return;
  }

  // Let Firebase / Google API requests bypass the service worker entirely.
  // Do NOT call event.respondWith() — the browser handles them natively.
  // The old pattern `event.respondWith(fetch(...))` crashed when fetch failed.
  if (PASSTHROUGH_ORIGINS.some((origin) => url.hostname.includes(origin))) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => caches.match('./index.html'))
        .then((response) => response || new globalThis.Response('Offline', { status: 503 })),
    );
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Stale-while-revalidate: serve from cache immediately,
      // then fetch in background and update cache for next visit.
      if (cachedResponse) {
        fetch(event.request)
          .then((networkResponse) => {
            if (
              networkResponse &&
              networkResponse.status === 200 &&
              networkResponse.type === 'basic'
            ) {
              const responseToCache = networkResponse.clone();
              caches
                .open(CACHE_NAME)
                .then((cache) => cache.put(event.request, responseToCache))
                .catch((err) => console.error('Cache put error:', err));
            }
          })
          .catch(() => null);

        return cachedResponse;
      }

      return fetch(event.request).catch(
        () => new globalThis.Response('Offline', { status: 503, statusText: 'Offline' }),
      );
    }),
  );
});

self.addEventListener('activate', (event) => {
  const cacheAllowlist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheAllowlist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
          return Promise.resolve();
        }),
      ).then(() => self.clients.claim());
    }),
  );
});
