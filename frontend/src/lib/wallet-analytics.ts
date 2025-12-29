/**
 * Wallet Analytics & Tracking
 * Track wallet connection events and user behavior
 */

import { CURRENT_NETWORK } from './stacks-config';

/**
 * Analytics Event Types
 */
export enum WalletEvent {
  WALLET_CONNECTED = 'wallet_connected',
  WALLET_DISCONNECTED = 'wallet_disconnected',
  WALLET_SWITCHED = 'wallet_switched',
  NETWORK_SWITCHED = 'network_switched',
  TRANSACTION_INITIATED = 'transaction_initiated',
  TRANSACTION_SUCCESS = 'transaction_success',
  TRANSACTION_FAILED = 'transaction_failed',
  WALLET_MODAL_OPENED = 'wallet_modal_opened',
  WALLET_MODAL_CLOSED = 'wallet_modal_closed',
  SESSION_STARTED = 'session_started',
  SESSION_EXPIRED = 'session_expired',
}

/**
 * Event Properties Interface
 */
interface EventProperties {
  walletId?: string;
  walletAddress?: string;
  network?: string;
  timestamp?: number;
  sessionDuration?: number;
  transactionType?: string;
  transactionId?: string;
  errorCode?: string;
  errorMessage?: string;
  [key: string]: any;
}

/**
 * Analytics Provider Interface
 */
interface AnalyticsProvider {
  trackEvent: (eventName: string, properties?: Record<string, any>) => void;
  identifyUser: (userId: string, traits?: Record<string, any>) => void;
}

/**
 * Analytics Configuration
 */
const ANALYTICS_CONFIG = {
  enabled: process.env.NEXT_PUBLIC_ANALYTICS_ENABLED === 'true',
  debug: process.env.NODE_ENV === 'development',
};

/**
 * Track wallet connection event
 */
export function trackWalletConnected(
  walletId: string,
  address: string,
  properties?: EventProperties
): void {
  trackEvent(WalletEvent.WALLET_CONNECTED, {
    walletId,
    walletAddress: address,
    network: CURRENT_NETWORK,
    timestamp: Date.now(),
    ...properties,
  });

  // Also identify the user for future events
  identifyUser(address, {
    walletType: walletId,
    network: CURRENT_NETWORK,
    connectedAt: new Date().toISOString(),
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Wallet connected:', {
      walletId,
      address,
      network: CURRENT_NETWORK,
    });
  }
}

/**
 * Track wallet disconnection
 */
export function trackWalletDisconnected(
  address: string,
  sessionDuration?: number,
  properties?: EventProperties
): void {
  trackEvent(WalletEvent.WALLET_DISCONNECTED, {
    walletAddress: address,
    network: CURRENT_NETWORK,
    sessionDuration,
    timestamp: Date.now(),
    ...properties,
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Wallet disconnected:', {
      address,
      sessionDuration,
    });
  }
}

/**
 * Track wallet switch
 */
export function trackWalletSwitched(
  fromWallet: string,
  toWallet: string,
  properties?: EventProperties
): void {
  trackEvent(WalletEvent.WALLET_SWITCHED, {
    fromWallet,
    toWallet,
    network: CURRENT_NETWORK,
    timestamp: Date.now(),
    ...properties,
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Wallet switched:', {
      fromWallet,
      toWallet,
    });
  }
}

/**
 * Track network switch
 */
export function trackNetworkSwitched(
  fromNetwork: string,
  toNetwork: string,
  properties?: EventProperties
): void {
  trackEvent(WalletEvent.NETWORK_SWITCHED, {
    fromNetwork,
    toNetwork,
    timestamp: Date.now(),
    ...properties,
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Network switched:', {
      fromNetwork,
      toNetwork,
    });
  }
}

/**
 * Track transaction initiated
 */
export function trackTransactionInitiated(
  transactionType: string,
  properties?: EventProperties
): void {
  trackEvent(WalletEvent.TRANSACTION_INITIATED, {
    transactionType,
    network: CURRENT_NETWORK,
    timestamp: Date.now(),
    ...properties,
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Transaction initiated:', {
      transactionType,
    });
  }
}

/**
 * Track transaction success
 */
export function trackTransactionSuccess(
  transactionId: string,
  transactionType: string,
  properties?: EventProperties
): void {
  trackEvent(WalletEvent.TRANSACTION_SUCCESS, {
    transactionId,
    transactionType,
    network: CURRENT_NETWORK,
    timestamp: Date.now(),
    ...properties,
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Transaction success:', {
      transactionId,
      transactionType,
    });
  }
}

/**
 * Track transaction failure
 */
export function trackTransactionFailed(
  transactionType: string,
  errorCode: string,
  errorMessage: string,
  properties?: EventProperties
): void {
  trackEvent(WalletEvent.TRANSACTION_FAILED, {
    transactionType,
    errorCode,
    errorMessage,
    network: CURRENT_NETWORK,
    timestamp: Date.now(),
    ...properties,
  });

  if (ANALYTICS_CONFIG.debug) {
    console.error('[Analytics] Transaction failed:', {
      transactionType,
      errorCode,
      errorMessage,
    });
  }
}

/**
 * Track wallet modal opened
 */
export function trackWalletModalOpened(properties?: EventProperties): void {
  trackEvent(WalletEvent.WALLET_MODAL_OPENED, {
    timestamp: Date.now(),
    ...properties,
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Wallet modal opened');
  }
}

/**
 * Track wallet modal closed
 */
export function trackWalletModalClosed(
  connected: boolean,
  properties?: EventProperties
): void {
  trackEvent(WalletEvent.WALLET_MODAL_CLOSED, {
    connected,
    timestamp: Date.now(),
    ...properties,
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Wallet modal closed:', { connected });
  }
}

/**
 * Track session started
 */
export function trackSessionStarted(
  address: string,
  walletId: string,
  properties?: EventProperties
): void {
  trackEvent(WalletEvent.SESSION_STARTED, {
    walletAddress: address,
    walletId,
    network: CURRENT_NETWORK,
    timestamp: Date.now(),
    ...properties,
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Session started:', { address, walletId });
  }
}

/**
 * Track session expired
 */
export function trackSessionExpired(
  address: string,
  duration: number,
  properties?: EventProperties
): void {
  trackEvent(WalletEvent.SESSION_EXPIRED, {
    walletAddress: address,
    sessionDuration: duration,
    network: CURRENT_NETWORK,
    timestamp: Date.now(),
    ...properties,
  });

  if (ANALYTICS_CONFIG.debug) {
    console.log('[Analytics] Session expired:', { address, duration });
  }
}

/**
 * Generic event tracking
 */
function trackEvent(eventName: string, properties?: EventProperties): void {
  if (!ANALYTICS_CONFIG.enabled) return;

  try {
    // Send to analytics providers
    sendToAnalyticsProviders(eventName, properties);

    // Store in local analytics if needed
    storeLocalAnalytics(eventName, properties);
  } catch (error) {
    console.error('[Analytics] Failed to track event:', error);
  }
}

/**
 * Identify user in analytics
 */
function identifyUser(userId: string, traits?: Record<string, any>): void {
  if (!ANALYTICS_CONFIG.enabled) return;

  try {
    // TODO: Integrate with analytics providers (Google Analytics, Mixpanel, etc.)
    // Example: analytics.identify(userId, traits);

    if (ANALYTICS_CONFIG.debug) {
      console.log('[Analytics] User identified:', { userId, traits });
    }
  } catch (error) {
    console.error('[Analytics] Failed to identify user:', error);
  }
}

/**
 * Send events to analytics providers
 */
function sendToAnalyticsProviders(
  eventName: string,
  properties?: Record<string, any>
): void {
  // TODO: Integrate with actual analytics providers
  // Example integrations:

  // Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', eventName, properties);
  }

  // Mixpanel
  if (typeof window !== 'undefined' && (window as any).mixpanel) {
    (window as any).mixpanel.track(eventName, properties);
  }

  // Segment
  if (typeof window !== 'undefined' && (window as any).analytics) {
    (window as any).analytics.track(eventName, properties);
  }

  // PostHog
  if (typeof window !== 'undefined' && (window as any).posthog) {
    (window as any).posthog.capture(eventName, properties);
  }
}

/**
 * Store analytics locally for offline tracking
 */
function storeLocalAnalytics(
  eventName: string,
  properties?: Record<string, any>
): void {
  if (typeof window === 'undefined') return;

  try {
    const key = 'adstack_analytics_events';
    const stored = localStorage.getItem(key);
    const events = stored ? JSON.parse(stored) : [];

    events.push({
      eventName,
      properties,
      timestamp: Date.now(),
    });

    // Keep only last 100 events
    if (events.length > 100) {
      events.shift();
    }

    localStorage.setItem(key, JSON.stringify(events));
  } catch (error) {
    console.error('[Analytics] Failed to store local analytics:', error);
  }
}

/**
 * Get analytics summary
 */
export function getAnalyticsSummary(): {
  totalEvents: number;
  walletConnections: number;
  transactions: number;
  lastEvent?: {
    name: string;
    timestamp: number;
  };
} {
  if (typeof window === 'undefined') {
    return {
      totalEvents: 0,
      walletConnections: 0,
      transactions: 0,
    };
  }

  try {
    const key = 'adstack_analytics_events';
    const stored = localStorage.getItem(key);

    if (!stored) {
      return {
        totalEvents: 0,
        walletConnections: 0,
        transactions: 0,
      };
    }

    const events = JSON.parse(stored);

    const walletConnections = events.filter(
      (e: any) => e.eventName === WalletEvent.WALLET_CONNECTED
    ).length;

    const transactions = events.filter((e: any) =>
      [
        WalletEvent.TRANSACTION_INITIATED,
        WalletEvent.TRANSACTION_SUCCESS,
        WalletEvent.TRANSACTION_FAILED,
      ].includes(e.eventName)
    ).length;

    const lastEvent = events[events.length - 1];

    return {
      totalEvents: events.length,
      walletConnections,
      transactions,
      lastEvent: lastEvent
        ? {
            name: lastEvent.eventName,
            timestamp: lastEvent.timestamp,
          }
        : undefined,
    };
  } catch (error) {
    console.error('[Analytics] Failed to get summary:', error);
    return {
      totalEvents: 0,
      walletConnections: 0,
      transactions: 0,
    };
  }
}

/**
 * Clear local analytics
 */
export function clearLocalAnalytics(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem('adstack_analytics_events');
    if (ANALYTICS_CONFIG.debug) {
      console.log('[Analytics] Local analytics cleared');
    }
  } catch (error) {
    console.error('[Analytics] Failed to clear local analytics:', error);
  }
}
