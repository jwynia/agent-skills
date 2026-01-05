# Testing PWAs

Comprehensive testing strategies for Progressive Web Apps.

## Testing Checklist

### Installability
- [ ] Manifest loads without errors
- [ ] Icons display correctly at all sizes
- [ ] Install prompt appears on eligible browsers
- [ ] App launches from home screen
- [ ] Splash screen displays correctly

### Offline Functionality
- [ ] App shell loads offline
- [ ] Cached data displays offline
- [ ] Appropriate fallback for uncached content
- [ ] Network status indicator works
- [ ] Queued actions sync when online

### Service Worker
- [ ] SW registers successfully
- [ ] Updates apply correctly
- [ ] Caching strategies work as expected
- [ ] Push notifications received (if applicable)

### Performance
- [ ] First load under 3s on 3G
- [ ] Time to Interactive under 5s
- [ ] Lighthouse PWA score 90+
- [ ] No layout shift during load

## Local Testing Setup

### Development Server

```bash
# Vite preview mode (builds and serves production)
npm run build && npm run preview

# Service workers only work in production builds
# Use preview mode for SW testing
```

### Simulate Offline

1. Chrome DevTools > Network > Offline
2. Or: Application > Service Workers > Offline

### Simulate Slow Network

```bash
# In DevTools Network tab:
# - Slow 3G: 400ms latency, 400kb/s download
# - Fast 3G: 100ms latency, 1.5mb/s download
```

## Lighthouse Testing

### Command Line

```bash
# Install Lighthouse
npm install -g lighthouse

# Run PWA audit
lighthouse http://localhost:4173 --only-categories=pwa --output=json

# Full audit with report
lighthouse http://localhost:4173 --view
```

### CI Integration

```yaml
# GitHub Actions
name: PWA Audit
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci && npm run build
      - run: npm run preview &
      - name: Lighthouse
        uses: treosh/lighthouse-ci-action@v11
        with:
          urls: http://localhost:4173
          uploadArtifacts: true
```

### Custom Lighthouse Config

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:pwa': ['error', { minScore: 0.9 }],
        'service-worker': 'error',
        'installable-manifest': 'error',
        'splash-screen': 'warn',
        'themed-omnibox': 'warn',
      },
    },
  },
};
```

## Service Worker Testing

### Unit Testing SW Logic

```typescript
// sw.test.ts
import { describe, it, expect, vi } from 'vitest';

// Mock service worker globals
const mockCache = new Map();
globalThis.caches = {
  open: vi.fn().mockResolvedValue({
    put: vi.fn((req, res) => mockCache.set(req.url, res)),
    match: vi.fn((req) => mockCache.get(req.url)),
  }),
  match: vi.fn(),
};

describe('Caching Logic', () => {
  it('should cache API responses', async () => {
    const request = new Request('https://api.example.com/data');
    const response = new Response(JSON.stringify({ data: 'test' }));

    const cache = await caches.open('api-cache');
    await cache.put(request, response);

    const cached = await cache.match(request);
    expect(cached).toBeDefined();
  });
});
```

### Integration Testing with Playwright

```typescript
// pwa.spec.ts
import { test, expect } from '@playwright/test';

test.describe('PWA Features', () => {
  test('should work offline after first visit', async ({ page, context }) => {
    // First visit - cache resources
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Go offline
    await context.setOffline(true);

    // Reload - should work from cache
    await page.reload();
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show install prompt', async ({ page }) => {
    // Mock beforeinstallprompt
    await page.addInitScript(() => {
      window.addEventListener('load', () => {
        const event = new Event('beforeinstallprompt');
        (event as any).prompt = () => Promise.resolve();
        (event as any).userChoice = Promise.resolve({ outcome: 'accepted' });
        window.dispatchEvent(event);
      });
    });

    await page.goto('/');
    await expect(page.locator('[data-testid="install-button"]')).toBeVisible();
  });

  test('should register service worker', async ({ page }) => {
    await page.goto('/');

    const hasServiceWorker = await page.evaluate(async () => {
      const registration = await navigator.serviceWorker.getRegistration();
      return !!registration;
    });

    expect(hasServiceWorker).toBe(true);
  });
});
```

## Manual Testing Scenarios

### Install Flow

1. Visit app in Chrome/Edge
2. Look for install icon in address bar
3. Click install
4. Verify app opens in standalone window
5. Check home screen/dock icon

### Offline Flow

1. Visit app, browse several pages
2. Enable airplane mode / disconnect network
3. Refresh page - should load from cache
4. Navigate to cached pages
5. Try uncached pages - verify fallback

### Update Flow

1. Deploy new version
2. Visit app (old version loads)
3. Close and reopen (new version should load)
4. Or: interact with update prompt if shown

### Push Notification Flow

1. Enable notifications in app
2. Send test notification from backend
3. Verify notification appears
4. Click notification - verify app opens to correct page

## Browser Testing Matrix

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| Service Worker | ✓ | ✓ | ✓ | ✓ |
| Push Notifications | ✓ | ✓ | ✓* | ✓ |
| Background Sync | ✓ | ✗ | ✗ | ✓ |
| Periodic Sync | ✓ | ✗ | ✗ | ✓ |
| Web Share | ✓ | ✗ | ✓ | ✓ |
| Install Prompt | ✓ | ✓** | ✗ | ✓ |

*Safari requires "Add to Home Screen"
**Firefox shows in address bar

## Debugging Tools

### Chrome DevTools

```
Application Tab:
├── Manifest - View parsed manifest
├── Service Workers - Control SW lifecycle
├── Cache Storage - Inspect cached resources
├── IndexedDB - View stored data
└── Clear storage - Reset for fresh testing
```

### Workbox DevTools

```typescript
// Enable Workbox logging in development
import { setLogLevel } from 'workbox-core';

if (process.env.NODE_ENV === 'development') {
  setLogLevel('debug');
}
```

### Network Inspection

```typescript
// Log all fetch events in SW
self.addEventListener('fetch', (event) => {
  console.log('[SW] Fetch:', event.request.url);
  // ... handle request
});
```

## Common Test Failures

### "Service Worker Not Found"

- Ensure running production build (`npm run preview`)
- Check SW is registered at root scope
- Verify HTTPS or localhost

### "Manifest Not Valid"

- Validate JSON syntax
- Check required fields present
- Verify icon paths resolve
- Test with audit-pwa.ts script

### "App Not Installable"

- Need valid manifest with icons
- Service worker must be registered
- Must be served over HTTPS
- User must interact with page first

### "Offline Not Working"

- Check precache includes needed assets
- Verify runtimeCaching patterns match
- Test with DevTools Application > Service Workers > Offline
- Check for console errors in SW
