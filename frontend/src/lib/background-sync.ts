import { getUnsynced, markSynced, put, STORES } from './indexed-db';

interface SyncAction {
  url: string;
  method: string;
  headers: Record<string, string>;
  body: string;
  createdAt: number;
  retryCount: number;
  maxRetries: number;
}

const MAX_RETRIES = 3;
const SYNC_INTERVAL = 30 * 1000;
let syncTimer: ReturnType<typeof setInterval> | null = null;

export async function queueAction(
  url: string,
  method: string,
  body: unknown,
  headers: Record<string, string> = {}
): Promise<string> {
  const id = `sync-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

  const action: SyncAction = {
    url,
    method,
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
    createdAt: Date.now(),
    retryCount: 0,
    maxRetries: MAX_RETRIES,
  };

  await put(STORES.syncQueue, id, action, false);

  if ('serviceWorker' in navigator && 'SyncManager' in window) {
    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as ServiceWorkerRegistration & { sync: { register: (tag: string) => Promise<void> } }).sync.register('sync-pending-actions');
    } catch {
      scheduleSync();
    }
  } else {
    scheduleSync();
  }

  return id;
}

export async function processSyncQueue(): Promise<{ processed: number; failed: number }> {
  const unsynced = await getUnsynced<SyncAction>(STORES.syncQueue);

  let processed = 0;
  let failed = 0;

  for (const { id, data } of unsynced) {
    try {
      const response = await fetch(data.url, {
        method: data.method,
        headers: data.headers,
        body: data.body,
      });

      if (response.ok) {
        await markSynced(STORES.syncQueue, id);
        processed++;
      } else if (response.status >= 500) {
        data.retryCount++;
        if (data.retryCount >= data.maxRetries) {
          await markSynced(STORES.syncQueue, id);
          failed++;
        } else {
          await put(STORES.syncQueue, id, data, false);
        }
      } else {
        await markSynced(STORES.syncQueue, id);
        failed++;
      }
    } catch {
      data.retryCount++;
      if (data.retryCount >= data.maxRetries) {
        await markSynced(STORES.syncQueue, id);
        failed++;
      } else {
        await put(STORES.syncQueue, id, data, false);
      }
    }
  }

  return { processed, failed };
}

function scheduleSync(): void {
  if (syncTimer) return;

  syncTimer = setInterval(async () => {
    if (!navigator.onLine) return;

    const { processed } = await processSyncQueue();
    if (processed === 0) {
      const unsynced = await getUnsynced(STORES.syncQueue);
      if (unsynced.length === 0 && syncTimer) {
        clearInterval(syncTimer);
        syncTimer = null;
      }
    }
  }, SYNC_INTERVAL);
}

export function startAutoSync(): () => void {
  const onlineHandler = () => {
    processSyncQueue();
  };

  window.addEventListener('online', onlineHandler);
  scheduleSync();

  return () => {
    window.removeEventListener('online', onlineHandler);
    if (syncTimer) {
      clearInterval(syncTimer);
      syncTimer = null;
    }
  };
}

export async function getPendingCount(): Promise<number> {
  const unsynced = await getUnsynced(STORES.syncQueue);
  return unsynced.length;
}

export async function clearSyncQueue(): Promise<void> {
  const { clear } = await import('./indexed-db');
  await clear(STORES.syncQueue);
}
