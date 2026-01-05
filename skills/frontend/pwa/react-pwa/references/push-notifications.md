# Push Notifications Complete Guide

End-to-end implementation of Web Push Notifications for React PWAs.

## Architecture Overview

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Browser   │◄───│ Push Service│◄───│ Your Server │
│ (SW + User) │    │ (FCM/APNS)  │    │ (web-push)  │
└─────────────┘    └─────────────┘    └─────────────┘
     │                    │                  │
     │  1. Subscribe      │                  │
     ├───────────────────►│                  │
     │  2. Subscription   │                  │
     │◄───────────────────┤                  │
     │  3. Send to server │                  │
     ├──────────────────────────────────────►│
     │                    │  4. Push message │
     │                    │◄─────────────────┤
     │  5. Notification   │                  │
     │◄───────────────────┤                  │
```

## Setup Steps

### 1. Generate VAPID Keys

```bash
# Using web-push CLI
npx web-push generate-vapid-keys

# Output:
# Public Key: BNb...
# Private Key: hZr...
```

Store these securely:
- Public key: Frontend (can be exposed)
- Private key: Backend only (secret!)

### 2. Frontend: Request Permission

```tsx
// src/hooks/usePushNotifications.ts
import { useState, useCallback } from 'react';

interface PushSubscriptionState {
  subscription: PushSubscription | null;
  isSupported: boolean;
  permission: NotificationPermission;
  isLoading: boolean;
  error: string | null;
}

export function usePushNotifications() {
  const [state, setState] = useState<PushSubscriptionState>({
    subscription: null,
    isSupported: 'Notification' in window && 'serviceWorker' in navigator,
    permission: Notification.permission,
    isLoading: false,
    error: null,
  });

  const subscribe = useCallback(async () => {
    if (!state.isSupported) {
      setState(s => ({ ...s, error: 'Push not supported' }));
      return null;
    }

    setState(s => ({ ...s, isLoading: true, error: null }));

    try {
      // Request permission
      const permission = await Notification.requestPermission();
      setState(s => ({ ...s, permission }));

      if (permission !== 'granted') {
        throw new Error('Permission denied');
      }

      // Get service worker registration
      const registration = await navigator.serviceWorker.ready;

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          import.meta.env.VITE_VAPID_PUBLIC_KEY
        ),
      });

      // Send subscription to backend
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      setState(s => ({ ...s, subscription, isLoading: false }));
      return subscription;
    } catch (error) {
      setState(s => ({
        ...s,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }));
      return null;
    }
  }, [state.isSupported]);

  const unsubscribe = useCallback(async () => {
    if (!state.subscription) return;

    try {
      await state.subscription.unsubscribe();
      await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint: state.subscription.endpoint }),
      });
      setState(s => ({ ...s, subscription: null }));
    } catch (error) {
      console.error('Unsubscribe failed:', error);
    }
  }, [state.subscription]);

  return { ...state, subscribe, unsubscribe };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map(char => char.charCodeAt(0)));
}
```

### 3. Frontend: Notification UI

```tsx
// src/components/NotificationSettings.tsx
import { usePushNotifications } from '../hooks/usePushNotifications';

export function NotificationSettings() {
  const {
    isSupported,
    permission,
    subscription,
    isLoading,
    error,
    subscribe,
    unsubscribe,
  } = usePushNotifications();

  if (!isSupported) {
    return <p>Push notifications are not supported in this browser.</p>;
  }

  if (permission === 'denied') {
    return (
      <div>
        <p>Notifications are blocked.</p>
        <p>Enable them in your browser settings to receive updates.</p>
      </div>
    );
  }

  return (
    <div>
      {error && <p className="error">{error}</p>}

      {subscription ? (
        <button onClick={unsubscribe} disabled={isLoading}>
          Disable Notifications
        </button>
      ) : (
        <button onClick={subscribe} disabled={isLoading}>
          {isLoading ? 'Enabling...' : 'Enable Notifications'}
        </button>
      )}
    </div>
  );
}
```

### 4. Service Worker: Handle Push

```typescript
// src/sw.ts (for injectManifest mode)
import { precacheAndRoute } from 'workbox-precaching';

declare const self: ServiceWorkerGlobalScope;

precacheAndRoute(self.__WB_MANIFEST);

// Handle push events
self.addEventListener('push', (event) => {
  if (!event.data) return;

  const data = event.data.json();

  const options: NotificationOptions = {
    body: data.body,
    icon: '/pwa-192x192.png',
    badge: '/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    actions: data.actions || [
      { action: 'open', title: 'Open' },
      { action: 'dismiss', title: 'Dismiss' },
    ],
    tag: data.tag || 'default',
    renotify: data.renotify || false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const action = event.action;
  const url = event.notification.data?.url || '/';

  if (action === 'dismiss') return;

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window if available
      for (const client of clients) {
        if (client.url === url && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return self.clients.openWindow(url);
    })
  );
});

// Handle notification close (for analytics)
self.addEventListener('notificationclose', (event) => {
  const notification = event.notification;
  // Send analytics
  fetch('/api/notifications/closed', {
    method: 'POST',
    body: JSON.stringify({
      tag: notification.tag,
      timestamp: notification.data?.timestamp,
    }),
  });
});
```

### 5. Vite Config for Custom SW

```typescript
// vite.config.ts
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
});
```

### 6. Backend: Send Notifications

```typescript
// Node.js backend example
import webpush from 'web-push';

webpush.setVapidDetails(
  'mailto:you@example.com',
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

// Store subscriptions (use database in production)
const subscriptions = new Map<string, PushSubscription>();

// Subscribe endpoint
app.post('/api/push/subscribe', (req, res) => {
  const subscription = req.body;
  subscriptions.set(subscription.endpoint, subscription);
  res.status(201).json({ success: true });
});

// Unsubscribe endpoint
app.post('/api/push/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions.delete(endpoint);
  res.json({ success: true });
});

// Send notification
async function sendNotification(
  subscription: PushSubscription,
  payload: { title: string; body: string; url?: string }
) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );
  } catch (error: any) {
    if (error.statusCode === 410) {
      // Subscription expired, remove it
      subscriptions.delete(subscription.endpoint);
    }
    throw error;
  }
}

// Broadcast to all subscribers
async function broadcastNotification(payload: object) {
  const promises = Array.from(subscriptions.values()).map(sub =>
    sendNotification(sub, payload).catch(console.error)
  );
  await Promise.all(promises);
}
```

## Notification Types

### Basic Notification

```typescript
{
  title: 'New Message',
  body: 'You have a new message from John',
  icon: '/icons/message.png'
}
```

### Actionable Notification

```typescript
{
  title: 'New Order',
  body: 'Order #1234 received',
  actions: [
    { action: 'view', title: 'View Order' },
    { action: 'ship', title: 'Mark Shipped' }
  ],
  data: { orderId: 1234 }
}
```

### Grouped Notifications

```typescript
// Use same tag to replace
{
  title: 'Chat Messages',
  body: '3 new messages',
  tag: 'chat-messages',  // Replaces existing
  renotify: true         // Vibrate again
}
```

## Best Practices

### Permission Timing

- Don't ask immediately on page load
- Show notification value before asking
- Provide settings to change preference

### Notification Content

- Keep titles under 50 characters
- Body under 120 characters
- Use meaningful icons
- Include relevant actions

### Rate Limiting

- Don't spam users
- Group related notifications
- Allow notification preferences
- Implement quiet hours

## iOS Limitations

As of 2024, iOS Safari supports Web Push with limitations:
- Requires user to "Add to Home Screen" first
- No badge updates
- Notifications may be delayed
- No background sync

Check support:
```typescript
const isIOSSafari = /iPad|iPhone|iPod/.test(navigator.userAgent);
const canPush = 'PushManager' in window;
```

## Testing

### Local Testing

```bash
# Send test notification via curl
curl -X POST http://localhost:3000/api/push/test \
  -H "Content-Type: application/json" \
  -d '{"title": "Test", "body": "Hello!"}'
```

### Browser DevTools

1. Application > Service Workers > Push
2. Enter payload JSON
3. Click "Push" to simulate

### web-push CLI

```bash
npx web-push send-notification \
  --endpoint="https://..." \
  --key="..." \
  --auth="..." \
  --payload='{"title":"Test"}'
```
