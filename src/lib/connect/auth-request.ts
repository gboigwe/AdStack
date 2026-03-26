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
