import { getRegistration } from './sw-registration';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function getPermissionStatus(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'default';
  return Notification.permission as NotificationPermission;
}

export async function requestPermission(): Promise<NotificationPermission> {
  if (!isPushSupported()) return 'denied';

  const result = await Notification.requestPermission();
  return result as NotificationPermission;
}

export async function subscribeToPush(vapidPublicKey: string): Promise<PushSubscriptionData | null> {
  if (!isPushSupported()) return null;

  const permission = await requestPermission();
  if (permission !== 'granted') return null;

  try {
    const registration = getRegistration() || (await navigator.serviceWorker.ready);
    const existing = await registration.pushManager.getSubscription();

    if (existing) {
      return serializeSubscription(existing);
    }

    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });

    return serializeSubscription(subscription);
  } catch {
    return null;
  }
}

export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      return await subscription.unsubscribe();
    }
    return false;
  } catch {
    return false;
  }
}

export async function getCurrentSubscription(): Promise<PushSubscriptionData | null> {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
      return serializeSubscription(subscription);
    }
    return null;
  } catch {
    return null;
  }
}

export function showLocalNotification(
  title: string,
  options?: NotificationOptions
): void {
  if (getPermissionStatus() !== 'granted') return;

  const registration = getRegistration();
  if (registration) {
    registration.showNotification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      ...options,
    });
  }
}

function serializeSubscription(sub: PushSubscription): PushSubscriptionData {
  const key = sub.getKey('p256dh');
  const auth = sub.getKey('auth');

  return {
    endpoint: sub.endpoint,
    keys: {
      p256dh: key ? arrayBufferToBase64(key) : '',
      auth: auth ? arrayBufferToBase64(auth) : '',
    },
  };
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i++) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}
