# Progressive Web App (PWA) - AdStack

## Overview

AdStack implements full PWA capabilities including offline support, push notifications, home screen installation, and background sync. The implementation is built on top of Next.js 16 with a custom service worker.

## Architecture

```
frontend/
  public/
    sw.js                    # Service worker
    manifest.json            # Web app manifest
    icons/                   # PWA icons (72-512px)
  src/
    lib/
      sw-registration.ts     # SW lifecycle management
      cache-manager.ts       # Runtime cache strategies
      indexed-db.ts          # IndexedDB persistence
      background-sync.ts     # Offline action queue
      push-notifications.ts  # Push API integration
    hooks/
      usePWA.ts              # React hooks for PWA state
    components/pwa/
      PWAProvider.tsx         # Context provider
      OfflineFallback.tsx     # Offline UI components
      NotificationPrompt.tsx  # Permission request flow
      NotificationCenter.tsx  # Notification inbox
      InstallPrompt.tsx       # Install prompt + iOS guide
      UpdateNotification.tsx  # SW update banner
      LazyLoad.tsx            # Intersection-based loading
      PWAStatusDashboard.tsx  # Debug/status panel
      index.ts               # Barrel exports
    app/
      offline/page.tsx        # Offline fallback page
```

## Service Worker

The service worker (`public/sw.js`) implements four caching strategies:

### Cache-First
Used for images and static assets. Serves from cache if available, falling back to network. Results are cached for future use.

### Network-First
Used for API calls and navigation. Attempts network request first, caches successful responses, falls back to cache when offline.

### Stale-While-Revalidate
Used for CSS, JS, and fonts. Serves stale content immediately from cache while fetching an update in the background.

### Navigation Fallback
Page navigations that fail when offline serve the cached version or redirect to `/offline`.

### Cache Tiers

| Cache Name | Content | Max Entries |
|---|---|---|
| `adstack-v1-static` | App shell, manifest, offline page | N/A |
| `adstack-v1-dynamic` | Page HTML, misc resources | 50 |
| `adstack-v1-api` | API responses | 30 |
| `adstack-v1-images` | Image assets | 60 |

Cache versioning is handled via the `CACHE_VERSION` constant. Old caches are automatically purged on service worker activation.

## Offline Data Persistence

IndexedDB stores are used for structured offline data:

| Store | Purpose |
|---|---|
| `campaigns` | Campaign data for offline viewing |
| `analytics` | Cached analytics reports |
| `publishers` | Publisher profiles |
| `drafts` | Unsaved campaign drafts |
| `notifications` | Notification history |
| `sync-queue` | Pending background sync actions |
| `preferences` | User preferences |

### Usage

```typescript
import { put, get, getAll, remove } from '@/lib/indexed-db';
import { STORES } from '@/lib/indexed-db';

// Store data
await put(STORES.campaigns, 'campaign-123', { name: 'Q1 Campaign', budget: 5000 });

// Retrieve data
const campaign = await get(STORES.campaigns, 'campaign-123');

// Get all records
const allCampaigns = await getAll(STORES.campaigns);

// Check storage usage
import { getStorageEstimate } from '@/lib/indexed-db';
const { usage, quota } = await getStorageEstimate();
```

## Background Sync

When the user performs actions while offline, they are queued in IndexedDB and synced when connectivity returns.

```typescript
import { queueAction, getPendingCount } from '@/lib/background-sync';

// Queue an offline action
await queueAction('/api/campaigns/create', 'POST', { name: 'New Campaign' });

// Check pending count
const pending = await getPendingCount();
```

The sync system:
- Uses the Background Sync API where available
- Falls back to polling every 30 seconds
- Retries failed actions up to 3 times
- Automatically triggers on `online` event

## Push Notifications

### Setup

1. Generate VAPID keys on your server
2. Pass the public key to the subscription function

```typescript
import { subscribeToPush, isPushSupported, getPermissionStatus } from '@/lib/push-notifications';

if (isPushSupported()) {
  const subscription = await subscribeToPush(VAPID_PUBLIC_KEY);
  // Send subscription to your server
}
```

### Notification Types

The service worker handles push events and supports:
- Title, body, icon, badge
- Action buttons
- Click handling with navigation
- Vibration patterns
- Tag-based notification grouping

### Local Notifications

```typescript
import { showLocalNotification } from '@/lib/push-notifications';

showLocalNotification('Campaign Approved', {
  body: 'Your campaign "Q1 Launch" has been approved.',
  tag: 'campaign-approved',
  data: { url: '/advertiser/campaigns/123' },
});
```

## Install Prompt

The `InstallPrompt` component handles both standard and iOS installation:

- **Chrome/Edge/Samsung**: Intercepts `beforeinstallprompt` event, shows custom prompt with 2-second delay
- **iOS Safari**: Displays step-by-step guide (tap Share > Add to Home Screen)
- Dismissal is remembered for 7 days
- Automatically hidden when running in standalone mode

## Components

### PWAProvider

Wraps the app to provide PWA context, offline banner, install prompt, and update notification.

```tsx
import { PWAProvider, usePWAContext } from '@/components/pwa';

// Already integrated in providers.tsx
// Access anywhere with:
const { isOnline, swStatus, updateAvailable, applyUpdate } = usePWAContext();
```

### OfflineBanner / OfflineCard / OfflineGate

```tsx
import { OfflineBanner, OfflineCard, OfflineGate } from '@/components/pwa';

<OfflineBanner isOnline={isOnline} />
<OfflineCard title="Data Unavailable" message="Connect to load this section." />
<OfflineGate isOnline={isOnline} fallback={<OfflineCard />}>
  <LiveDataComponent />
</OfflineGate>
```

### NotificationPrompt / NotificationToggle

```tsx
import { NotificationPrompt, NotificationToggle } from '@/components/pwa';

<NotificationPrompt onPermissionChange={(perm) => console.log(perm)} />
<NotificationToggle onToggle={(enabled) => console.log(enabled)} />
```

### NotificationCenter

Drop-in notification inbox with type filtering, read state, and time formatting.

```tsx
import { NotificationCenter } from '@/components/pwa';

<NotificationCenter />
```

### LazyComponent / LazyImage

Intersection Observer-based lazy loading:

```tsx
import { LazyComponent, LazyImage } from '@/components/pwa';

<LazyComponent fallback={<Skeleton />}>
  <HeavyChart data={data} />
</LazyComponent>

<LazyImage src="/campaign-preview.png" alt="Preview" width={400} height={300} />
```

### PWAStatusDashboard

Debug panel showing network status, SW state, notification permissions, sync queue, and storage usage.

```tsx
import { PWAStatusDashboard } from '@/components/pwa';

<PWAStatusDashboard />
```

## Hooks

### useNetworkStatus

```typescript
const { isOnline, effectiveType, downlink, rtt } = useNetworkStatus();
```

### useServiceWorker

```typescript
const { status, updateAvailable, applyUpdate, registration } = useServiceWorker();
```

### useInstallPrompt

```typescript
const { canInstall, isInstalled } = useInstallPrompt();
```

## Cache Manager

Runtime cache with memory-layer caching:

```typescript
import { cachedFetch, invalidateMemoryCache, getCacheStats } from '@/lib/cache-manager';

const { data, fromCache } = await cachedFetch<Campaign[]>('/api/campaigns');

// Invalidate after mutation
invalidateMemoryCache('/api/campaigns');

// Check stats
const { entries, routes } = getCacheStats();
```

### Route-Specific Strategies

| Route | Strategy | Max Age | Max Entries |
|---|---|---|---|
| `/api/campaigns` | network-first | 5 min | 30 |
| `/api/analytics` | network-first | 2 min | 20 |
| `/api/publishers` | stale-while-revalidate | 10 min | 20 |
| `/api/governance` | network-first | 5 min | 15 |
| `/api/notifications` | network-first | 1 min | 50 |

## Configuration

### next.config.ts

Service worker headers are configured to:
- Serve `sw.js` with `Cache-Control: public, max-age=0, must-revalidate`
- Set `Service-Worker-Allowed: /` for scope
- Cache workbox chunks with `immutable` for 1 year

### manifest.json

- Display: standalone
- Theme color: #2563eb
- Orientation: portrait-primary
- Shortcuts: Campaign launcher, Publisher dashboard
- Icons: 72px to 512px, maskable + any purpose

## Performance Considerations

- Service worker precaches only critical assets (app shell, offline page, manifest)
- Dynamic content is cached on-demand with size limits
- Memory cache supplements IndexedDB for frequently accessed data
- Lazy loading defers non-critical content below the fold
- Route prefetching preloads likely navigation targets

## Browser Support

| Feature | Chrome | Firefox | Safari | Edge |
|---|---|---|---|---|
| Service Worker | Yes | Yes | Yes | Yes |
| Push Notifications | Yes | Yes | Partial | Yes |
| Background Sync | Yes | No | No | Yes |
| Install Prompt | Yes | No | No (iOS guide) | Yes |
| IndexedDB | Yes | Yes | Yes | Yes |

Where Background Sync is not supported, the fallback polling mechanism handles queued actions.
