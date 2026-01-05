# Caching Strategies Deep Dive

Comprehensive guide to Workbox caching strategies for PWAs.

## Strategy Overview

| Strategy | When to Use | Trade-off |
|----------|-------------|-----------|
| CacheFirst | Static assets, fonts, images | Fast but potentially stale |
| NetworkFirst | API data, dynamic content | Fresh but slower offline |
| StaleWhileRevalidate | Frequently updated assets | Balance of speed and freshness |
| NetworkOnly | Real-time data, auth | No offline support |
| CacheOnly | Precached assets | Fully offline, never updates |

## CacheFirst

Serve from cache immediately, fall back to network only if not cached.

```typescript
{
  urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/,
  handler: 'CacheFirst',
  options: {
    cacheName: 'images-cache',
    expiration: {
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
    },
    cacheableResponse: {
      statuses: [0, 200]
    }
  }
}
```

**Best for:**
- Images that rarely change
- Font files (woff2, ttf)
- Static JavaScript/CSS (with cache busting)
- CDN assets

**Considerations:**
- Use cache busting (filename hashing) for updateable assets
- Set appropriate `maxAgeSeconds` based on update frequency
- `statuses: [0, 200]` handles opaque responses from CDNs

## NetworkFirst

Try network, fall back to cache if offline or slow.

```typescript
{
  urlPattern: /^https:\/\/api\.example\.com\/products/,
  handler: 'NetworkFirst',
  options: {
    cacheName: 'api-products',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 // 24 hours
    },
    networkTimeoutSeconds: 3, // Fall back to cache after 3s
    cacheableResponse: {
      statuses: [0, 200]
    }
  }
}
```

**Best for:**
- API responses that should be fresh
- User-specific data
- Frequently updated content
- Social feeds, news

**Key option: `networkTimeoutSeconds`**
- Without it: waits for network indefinitely before cache fallback
- With it: falls back to cache if network takes too long
- Recommended: 3-5 seconds for API calls

## StaleWhileRevalidate

Serve from cache immediately, update cache in background.

```typescript
{
  urlPattern: /^https:\/\/fonts\.googleapis\.com/,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'google-fonts-stylesheets',
    expiration: {
      maxEntries: 10,
      maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
    }
  }
}
```

**Best for:**
- Assets that update occasionally
- Font stylesheets
- Analytics scripts
- User avatars
- Non-critical API data

**Trade-off:**
- First visit: same as NetworkFirst
- Subsequent visits: instant from cache, updates in background
- User sees stale data briefly on each visit

## Combining Strategies

Real-world apps need multiple strategies:

```typescript
workbox: {
  runtimeCaching: [
    // Critical API: NetworkFirst
    {
      urlPattern: /^https:\/\/api\.example\.com\/user/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'user-api',
        networkTimeoutSeconds: 5
      }
    },

    // Product catalog: StaleWhileRevalidate
    {
      urlPattern: /^https:\/\/api\.example\.com\/products/,
      handler: 'StaleWhileRevalidate',
      options: {
        cacheName: 'products-api',
        expiration: { maxAgeSeconds: 60 * 60 }
      }
    },

    // Static assets: CacheFirst
    {
      urlPattern: /\.(?:js|css)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-resources',
        expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 }
      }
    },

    // Images: CacheFirst with generous expiration
    {
      urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 365 }
      }
    }
  ]
}
```

## Cache Management

### Expiration Options

```typescript
expiration: {
  maxEntries: 100,        // Max items in cache
  maxAgeSeconds: 86400,   // Max age of cached items
  purgeOnQuotaError: true // Delete cache if storage quota exceeded
}
```

### Cache Naming

Use descriptive, unique cache names:
- `api-v1-products` - version-specific API cache
- `images-cdn` - specific asset source
- `fonts-google` - external resource cache

### Clearing Caches

```typescript
// In service worker
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => !allowedCaches.includes(name))
          .map((name) => caches.delete(name))
      );
    })
  );
});
```

## Offline Fallbacks

### Navigation Fallback

```typescript
workbox: {
  navigateFallback: '/offline.html',
  navigateFallbackDenylist: [
    /^\/api/,      // Don't intercept API routes
    /\.[^/]+$/     // Don't intercept file requests
  ]
}
```

### Runtime Fallback Images

```typescript
// Custom plugin for image fallback
{
  urlPattern: /\.(?:png|jpg|jpeg|webp)$/,
  handler: 'CacheFirst',
  options: {
    cacheName: 'images',
    plugins: [
      {
        handlerDidError: async () => {
          return caches.match('/fallback-image.png');
        }
      }
    ]
  }
}
```

## Advanced Patterns

### Conditional Caching

```typescript
// Only cache successful responses
{
  urlPattern: /api/,
  handler: 'NetworkFirst',
  options: {
    cacheableResponse: {
      statuses: [200], // Only cache 200 OK
      headers: {
        'x-cache-ok': 'true' // Only if header present
      }
    }
  }
}
```

### Request Modification

```typescript
// Add auth header to API requests
{
  urlPattern: /api/,
  handler: 'NetworkFirst',
  options: {
    fetchOptions: {
      credentials: 'include'
    }
  }
}
```

### Background Sync Queue

```typescript
import { Queue } from 'workbox-background-sync';

const queue = new Queue('api-requests');

// If network fails, queue for retry
self.addEventListener('fetch', (event) => {
  if (event.request.method === 'POST' && event.request.url.includes('/api/')) {
    const clonedRequest = event.request.clone();
    event.respondWith(
      fetch(event.request).catch(() => {
        queue.pushRequest({ request: clonedRequest });
        return new Response(JSON.stringify({ queued: true }));
      })
    );
  }
});
```

## Debugging Tips

### Chrome DevTools

1. Application > Cache Storage - view cached items
2. Application > Service Workers - check SW status
3. Network tab - enable "Offline" to test
4. Console - Workbox logs routing decisions

### Force Update

```typescript
// In development, skip waiting
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
```

### Logging

```typescript
// Enable Workbox debug logging
import { setLogLevel } from 'workbox-core';
setLogLevel('debug');
```
