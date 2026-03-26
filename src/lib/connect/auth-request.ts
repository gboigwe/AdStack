// Stacks Connect auth request builders

export type AuthRequestParams = { appDetails: AppDetails; redirectTo?: string; onFinish?: (payload: AuthResponsePayload) => void; onCancel?: () => void };
