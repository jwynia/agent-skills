/**
 * Service Worker with Workbox
 *
 * A production-ready service worker using Workbox strategies.
 * Customize the caching strategies based on your app's needs.
 *
 * Usage with Vite PWA Plugin:
 *   This file is auto-generated. Configure in vite.config.ts
 *
 * Usage Standalone:
 *   1. Install Workbox: npm i workbox-precaching workbox-routing workbox-strategies workbox-expiration workbox-cacheable-response
 *   2. Build with bundler that handles workbox imports
 *   3. Register in your app entry point
 */

import { precacheAndRoute, cleanupOutdatedCaches, createHandlerBoundToURL } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate, NetworkOnly } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare let self: ServiceWorkerGlobalScope;

// === PRECACHING ===

// Clean up old precaches from previous versions
cleanupOutdatedCaches();

// Precache static assets (populated by build tool)
// The __WB_MANIFEST placeholder is replaced during build
precacheAndRoute(self.__WB_MANIFEST || []);

// === APP SHELL / NAVIGATION ===

// For SPA: return index.html for all navigation requests
// Uncomment if using SPA routing:
// const handler = createHandlerBoundToURL('/index.html');
// const navigationRoute = new NavigationRoute(handler, {
//   // Exclude specific paths from SPA handling
//   denylist: [/^\/api\//, /^\/auth\//],
// });
// registerRoute(navigationRoute);

// === CACHING STRATEGIES ===

// Static Assets (cache-first)
// For versioned assets with hash in filename
registerRoute(
  ({ request }) =>
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
      }),
    ],
  })
);

// Images (cache-first with size limit)
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
      }),
    ],
  })
);

// API Calls (network-first)
// Fresh data when online, cached data when offline
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 3, // Fall back to cache after 3s
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// HTML Pages (stale-while-revalidate)
// Fast load from cache, update in background
registerRoute(
  ({ request }) => request.destination === 'document',
  new StaleWhileRevalidate({
    cacheName: 'pages',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
      }),
    ],
  })
);

// Third-party resources (stale-while-revalidate)
// CDN assets, analytics, etc.
registerRoute(
  ({ url }) => url.origin !== self.location.origin,
  new StaleWhileRevalidate({
    cacheName: 'third-party',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 30,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
      }),
    ],
  })
);

// === OFFLINE FALLBACK ===

import { setCatchHandler } from 'workbox-routing';
import { matchPrecache } from 'workbox-precaching';

// Fallback for failed requests
setCatchHandler(async ({ request }) => {
  // For navigation requests, show offline page
  if (request.destination === 'document') {
    return matchPrecache('/offline.html') || Response.error();
  }

  // For images, could return placeholder
  // if (request.destination === 'image') {
  //   return matchPrecache('/images/offline-placeholder.png');
  // }

  return Response.error();
});

// === UPDATE HANDLING ===

// Skip waiting - activate new SW immediately
// Only use if you handle update UI in your app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Claim clients on activation
// Makes SW take control of all pages immediately
self.addEventListener('activate', () => {
  self.clients.claim();
});

// === BACKGROUND SYNC (optional) ===

// Uncomment to enable background sync for failed POST requests
// import { BackgroundSyncPlugin } from 'workbox-background-sync';
//
// const bgSyncPlugin = new BackgroundSyncPlugin('failedRequestsQueue', {
//   maxRetentionTime: 24 * 60, // 24 hours in minutes
// });
//
// registerRoute(
//   ({ url }) => url.pathname.startsWith('/api/') && request.method === 'POST',
//   new NetworkOnly({
//     plugins: [bgSyncPlugin],
//   }),
//   'POST'
// );

// === PUSH NOTIFICATIONS (optional) ===

// Uncomment to handle push notifications
// self.addEventListener('push', (event) => {
//   const data = event.data?.json() ?? {};
//   const title = data.title || 'Notification';
//   const options = {
//     body: data.body,
//     icon: '/icons/icon-192x192.png',
//     badge: '/icons/badge-72x72.png',
//     data: data.url,
//   };
//   event.waitUntil(self.registration.showNotification(title, options));
// });
//
// self.addEventListener('notificationclick', (event) => {
//   event.notification.close();
//   if (event.notification.data) {
//     event.waitUntil(clients.openWindow(event.notification.data));
//   }
// });
