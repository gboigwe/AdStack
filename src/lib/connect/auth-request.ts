// Stacks Connect auth request builders

export type AuthRequestParams = { appDetails: AppDetails; redirectTo?: string; onFinish?: (payload: AuthResponsePayload) => void; onCancel?: () => void };

export type AppDetails = { name: string; icon: string };

export type AuthResponsePayload = { authResponseToken: string; appPrivateKey: string; userData: UserData };

export type UserData = { stxAddress: string; appPrivateKey: string; profile: UserProfile };

export type UserProfile = { name?: string; email?: string; image?: string };

export const DEFAULT_APP_ICON = '/icon.png';

export const AUTH_VERSION = '1.0.0';

export const LEATHER_WALLET_ID = 'leather';

export const XVERSE_WALLET_ID = 'xverse';

export const ASIGNA_WALLET_ID = 'asigna';

export function buildAuthRequest(appDetails: AppDetails, redirectTo = '/'): AuthRequestParams {
  return { appDetails, redirectTo };
}

export function openAuth(params: AuthRequestParams): void {
  if (typeof window === 'undefined') return;
  const event = new CustomEvent('openStacksAuth', { detail: params });
  window.dispatchEvent(event);
}

export function parseAuthResponse(token: string): AuthResponsePayload | null {
  try {
    const [, payload] = token.split('.');
    const decoded = JSON.parse(atob(payload));
    return decoded as AuthResponsePayload;
  } catch {
    return null;
  }
}

export function isValidAuthResponse(payload: AuthResponsePayload): boolean {
  return !!(payload.authResponseToken && payload.appPrivateKey && payload.userData);
}

export function extractStxAddress(payload: AuthResponsePayload): string | null {
  return payload.userData?.stxAddress ?? null;
}
