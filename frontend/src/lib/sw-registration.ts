const SW_PATH = '/sw.js';
const SW_SCOPE = '/';

export type SWStatus = 'idle' | 'registering' | 'installed' | 'activated' | 'error' | 'unsupported';

export interface SWRegistrationResult {
  status: SWStatus;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

let currentRegistration: ServiceWorkerRegistration | null = null;

export function isServiceWorkerSupported(): boolean {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator;
}

export async function registerServiceWorker(): Promise<SWRegistrationResult> {
  if (!isServiceWorkerSupported()) {
    return { status: 'unsupported', registration: null, error: 'Service workers not supported' };
  }

  try {
    const registration = await navigator.serviceWorker.register(SW_PATH, { scope: SW_SCOPE });
    currentRegistration = registration;

    if (registration.installing) {
      return { status: 'registering', registration, error: null };
    }

    if (registration.waiting) {
      return { status: 'installed', registration, error: null };
    }

    if (registration.active) {
      return { status: 'activated', registration, error: null };
    }

    return { status: 'installed', registration, error: null };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Registration failed';
    return { status: 'error', registration: null, error: message };
  }
}

export async function unregisterServiceWorker(): Promise<boolean> {
  if (!isServiceWorkerSupported()) return false;

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      const result = await registration.unregister();
      currentRegistration = null;
      return result;
    }
    return false;
  } catch {
    return false;
  }
}

export function getRegistration(): ServiceWorkerRegistration | null {
  return currentRegistration;
}

export function skipWaiting(): void {
  if (currentRegistration?.waiting) {
    currentRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
  }
}

export function precacheUrls(urls: string[]): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'CACHE_URLS',
      urls,
    });
  }
}

export function clearAllCaches(): void {
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
  }
}

export function onSWUpdate(callback: (registration: ServiceWorkerRegistration) => void): () => void {
  if (!isServiceWorkerSupported()) return () => {};

  const handler = () => {
    navigator.serviceWorker.getRegistration().then((reg) => {
      if (!reg) return;

      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            callback(reg);
          }
        });
      });
    });
  };

  handler();
  return () => {};
}

export function onControllerChange(callback: () => void): () => void {
  if (!isServiceWorkerSupported()) return () => {};

  const handler = () => callback();
  navigator.serviceWorker.addEventListener('controllerchange', handler);
  return () => navigator.serviceWorker.removeEventListener('controllerchange', handler);
}
