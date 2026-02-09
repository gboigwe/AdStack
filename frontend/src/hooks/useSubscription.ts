/**
 * React Hook for Subscription Management
 * Handles subscription CRUD operations and real-time updates
 */

'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useState } from 'react';
import { Cl } from '@stacks/transactions';
import { useContractCall, useContractRead } from './useContract';
import { useWalletStore } from '../store/wallet-store';
import {
  SubscriptionData,
  SubscriptionPlan,
  SubscriptionAnalytics,
  CreateSubscriptionParams,
  ChangePlanParams,
  SubscriptionStatus,
} from '../lib/subscription';

const CONTRACT_NAME = 'subscription-manager';

/**
 * Hook to fetch current user's subscription for a campaign
 */
export function useSubscription(campaignId: number, enabled: boolean = true) {
  const { address, isConnected } = useWalletStore();

  return useContractRead<SubscriptionData>(
    {
      contractName: CONTRACT_NAME,
      functionName: 'get-subscriber-subscription',
      functionArgs: [
        { type: 'principal', value: { address: address || '' } },
        { type: 'uint', value: BigInt(campaignId) },
      ],
    },
    enabled && isConnected && !!address
  );
}

/**
 * Hook to fetch subscription by ID
 */
export function useSubscriptionById(subscriptionId: number, enabled: boolean = true) {
  return useContractRead<SubscriptionData>(
    {
      contractName: CONTRACT_NAME,
      functionName: 'get-subscription',
      functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
    },
    enabled && subscriptionId > 0
  );
}

/**
 * Hook to fetch subscription plan details
 */
export function useSubscriptionPlan(planId: number, enabled: boolean = true) {
  return useContractRead<SubscriptionPlan>(
    {
      contractName: CONTRACT_NAME,
      functionName: 'get-plan',
      functionArgs: [{ type: 'uint', value: BigInt(planId) }],
    },
    enabled && planId > 0
  );
}

/**
 * Hook to fetch subscription analytics
 */
export function useSubscriptionAnalytics(subscriptionId: number, enabled: boolean = true) {
  return useContractRead<SubscriptionAnalytics>(
    {
      contractName: CONTRACT_NAME,
      functionName: 'get-subscription-analytics',
      functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
    },
    enabled && subscriptionId > 0
  );
}

/**
 * Hook to check if subscription is active
 */
export function useIsSubscriptionActive(subscriptionId: number, enabled: boolean = true) {
  return useContractRead<boolean>(
    {
      contractName: CONTRACT_NAME,
      functionName: 'is-subscription-active',
      functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
    },
    enabled && subscriptionId > 0
  );
}

/**
 * Hook to get renewal status
 */
export function useRenewalStatus(subscriptionId: number, enabled: boolean = true) {
  return useContractRead<{
    active: boolean;
    nextBilling: number;
    autoRenew: boolean;
    failedAttempts: number;
  }>(
    {
      contractName: CONTRACT_NAME,
      functionName: 'get-renewal-status',
      functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
    },
    enabled && subscriptionId > 0
  );
}

/**
 * Hook to create a new subscription
 */
export function useCreateSubscription() {
  const queryClient = useQueryClient();
  const { mutate, ...rest } = useContractCall();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = useCallback(
    async (params: CreateSubscriptionParams) => {
      setIsLoading(true);
      setError(null);

      try {
        mutate(
          {
            contractName: CONTRACT_NAME,
            functionName: 'create-subscription',
            functionArgs: [
              { type: 'uint', value: BigInt(params.campaignId) },
              { type: 'uint', value: params.amount },
              { type: 'uint', value: BigInt(params.billingInterval) },
              { type: 'bool', value: params.autoRenew },
            ],
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ['contract', CONTRACT_NAME],
              });
              setIsLoading(false);
            },
            onError: (err) => {
              setError(err instanceof Error ? err.message : 'Failed to create subscription');
              setIsLoading(false);
            },
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error');
        setIsLoading(false);
      }
    },
    [mutate, queryClient]
  );

  return {
    createSubscription,
    isLoading: isLoading || rest.isPending,
    error: error || (rest.error ? rest.error.message : null),
    ...rest,
  };
}

/**
 * Hook to cancel subscription
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();
  const { mutate, ...rest } = useContractCall();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cancelSubscription = useCallback(
    async (subscriptionId: number) => {
      setIsLoading(true);
      setError(null);

      try {
        mutate(
          {
            contractName: CONTRACT_NAME,
            functionName: 'cancel-subscription',
            functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ['contract', CONTRACT_NAME],
              });
              setIsLoading(false);
            },
            onError: (err) => {
              setError(err instanceof Error ? err.message : 'Failed to cancel subscription');
              setIsLoading(false);
            },
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error');
        setIsLoading(false);
      }
    },
    [mutate, queryClient]
  );

  return {
    cancelSubscription,
    isLoading: isLoading || rest.isPending,
    error: error || (rest.error ? rest.error.message : null),
    ...rest,
  };
}

/**
 * Hook to pause subscription
 */
export function usePauseSubscription() {
  const queryClient = useQueryClient();
  const { mutate, ...rest } = useContractCall();

  const pauseSubscription = useCallback(
    (subscriptionId: number) => {
      mutate(
        {
          contractName: CONTRACT_NAME,
          functionName: 'pause-subscription',
          functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['contract', CONTRACT_NAME],
            });
          },
        }
      );
    },
    [mutate, queryClient]
  );

  return { pauseSubscription, ...rest };
}

/**
 * Hook to resume subscription
 */
export function useResumeSubscription() {
  const queryClient = useQueryClient();
  const { mutate, ...rest } = useContractCall();

  const resumeSubscription = useCallback(
    (subscriptionId: number) => {
      mutate(
        {
          contractName: CONTRACT_NAME,
          functionName: 'resume-subscription',
          functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['contract', CONTRACT_NAME],
            });
          },
        }
      );
    },
    [mutate, queryClient]
  );

  return { resumeSubscription, ...rest };
}

/**
 * Hook to change subscription plan
 */
export function useChangePlan() {
  const queryClient = useQueryClient();
  const { mutate, ...rest } = useContractCall();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePlan = useCallback(
    async (params: ChangePlanParams) => {
      setIsLoading(true);
      setError(null);

      try {
        mutate(
          {
            contractName: CONTRACT_NAME,
            functionName: 'update-subscription-amount',
            functionArgs: [
              { type: 'uint', value: BigInt(params.subscriptionId) },
              { type: 'uint', value: params.newAmount },
            ],
          },
          {
            onSuccess: () => {
              queryClient.invalidateQueries({
                queryKey: ['contract', CONTRACT_NAME],
              });
              setIsLoading(false);
            },
            onError: (err) => {
              setError(err instanceof Error ? err.message : 'Failed to change plan');
              setIsLoading(false);
            },
          }
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unexpected error');
        setIsLoading(false);
      }
    },
    [mutate, queryClient]
  );

  return {
    changePlan,
    isLoading: isLoading || rest.isPending,
    error: error || (rest.error ? rest.error.message : null),
    ...rest,
  };
}

/**
 * Hook to toggle auto-renewal
 */
export function useToggleAutoRenew() {
  const queryClient = useQueryClient();
  const { mutate, ...rest } = useContractCall();

  const toggleAutoRenew = useCallback(
    (subscriptionId: number) => {
      mutate(
        {
          contractName: CONTRACT_NAME,
          functionName: 'toggle-auto-renew',
          functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['contract', CONTRACT_NAME],
            });
          },
        }
      );
    },
    [mutate, queryClient]
  );

  return { toggleAutoRenew, ...rest };
}

/**
 * Hook to process manual renewal
 */
export function useProcessRenewal() {
  const queryClient = useQueryClient();
  const { mutate, ...rest } = useContractCall();

  const processRenewal = useCallback(
    (subscriptionId: number) => {
      mutate(
        {
          contractName: CONTRACT_NAME,
          functionName: 'process-renewal',
          functionArgs: [{ type: 'uint', value: BigInt(subscriptionId) }],
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['contract', CONTRACT_NAME],
            });
          },
        }
      );
    },
    [mutate, queryClient]
  );

  return { processRenewal, ...rest };
}

/**
 * Hook for subscription status with real-time updates
 */
export function useSubscriptionStatus(subscriptionId: number) {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const { data, isLoading, error, refetch } = useSubscriptionById(subscriptionId);

  useEffect(() => {
    if (data) {
      setStatus(data.status);
    }
  }, [data]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  return {
    status,
    isLoading,
    error,
    refetch,
  };
}

/**
 * Hook to manage subscriber preferences
 */
export function useSubscriberPreferences() {
  const { address } = useWalletStore();
  const queryClient = useQueryClient();
  const { mutate, ...rest } = useContractCall();

  const { data, isLoading, error } = useContractRead(
    {
      contractName: CONTRACT_NAME,
      functionName: 'get-subscriber-preferences',
      functionArgs: [{ type: 'principal', value: { address: address || '' } }],
    },
    !!address
  );

  const setPreferences = useCallback(
    (preferences: {
      paymentMethod: number;
      notificationEnabled: boolean;
      autoRenewDefault: boolean;
      spendingLimit: bigint;
    }) => {
      mutate(
        {
          contractName: CONTRACT_NAME,
          functionName: 'set-subscriber-preferences',
          functionArgs: [
            { type: 'uint', value: BigInt(preferences.paymentMethod) },
            { type: 'bool', value: preferences.notificationEnabled },
            { type: 'bool', value: preferences.autoRenewDefault },
            { type: 'uint', value: preferences.spendingLimit },
          ],
        },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({
              queryKey: ['contract', CONTRACT_NAME, 'get-subscriber-preferences'],
            });
          },
        }
      );
    },
    [mutate, queryClient]
  );

  return {
    preferences: data,
    setPreferences,
    isLoading,
    error,
    ...rest,
  };
}

/**
 * Hook for subscription alerts and notifications
 */
export function useSubscriptionAlerts(subscriptionId: number) {
  const [alerts, setAlerts] = useState<
    Array<{
      type: 'renewal' | 'payment_failed' | 'expiring' | 'cancelled';
      message: string;
      severity: 'info' | 'warning' | 'error';
      timestamp: number;
    }>
  >([]);

  const { data: subscription } = useSubscriptionById(subscriptionId);
  const { data: renewalStatus } = useRenewalStatus(subscriptionId);

  useEffect(() => {
    if (!subscription || !renewalStatus) return;

    const newAlerts: typeof alerts = [];
    const now = Date.now() / 1000; // Current time in seconds

    // Check for upcoming renewal
    if (renewalStatus.autoRenew && renewalStatus.nextBilling - now < 86400 * 3) {
      // 3 days
      newAlerts.push({
        type: 'renewal',
        message: `Subscription will renew in ${Math.ceil((renewalStatus.nextBilling - now) / 86400)} days`,
        severity: 'info',
        timestamp: now,
      });
    }

    // Check for failed payments
    if (renewalStatus.failedAttempts > 0) {
      newAlerts.push({
        type: 'payment_failed',
        message: `${renewalStatus.failedAttempts} payment attempt(s) failed. Please update payment method.`,
        severity: 'error',
        timestamp: now,
      });
    }

    // Check for expiring soon
    if (!renewalStatus.autoRenew && renewalStatus.nextBilling - now < 86400 * 7) {
      // 7 days
      newAlerts.push({
        type: 'expiring',
        message: 'Subscription will expire soon. Enable auto-renewal to continue.',
        severity: 'warning',
        timestamp: now,
      });
    }

    // Check if cancelled
    if (subscription.status === 'cancelled') {
      newAlerts.push({
        type: 'cancelled',
        message: 'Subscription has been cancelled and will not renew.',
        severity: 'warning',
        timestamp: now,
      });
    }

    setAlerts(newAlerts);
  }, [subscription, renewalStatus]);

  return { alerts };
}

/**
 * Combined hook for complete subscription management
 */
export function useSubscriptionManager(campaignId: number) {
  const subscription = useSubscription(campaignId);
  const createSub = useCreateSubscription();
  const cancelSub = useCancelSubscription();
  const pauseSub = usePauseSubscription();
  const resumeSub = useResumeSubscription();
  const changePlanHook = useChangePlan();
  const toggleRenew = useToggleAutoRenew();

  const subscriptionId = subscription.data?.subscriptionId || 0;
  const alerts = useSubscriptionAlerts(subscriptionId);
  const analytics = useSubscriptionAnalytics(subscriptionId, subscriptionId > 0);

  return {
    // Data
    subscription: subscription.data,
    analytics: analytics.data,
    alerts: alerts.alerts,

    // Loading states
    isLoading: subscription.isLoading,
    isCreating: createSub.isLoading,
    isCancelling: cancelSub.isLoading,
    isUpdating: changePlanHook.isLoading,

    // Actions
    createSubscription: createSub.createSubscription,
    cancelSubscription: cancelSub.cancelSubscription,
    pauseSubscription: pauseSub.pauseSubscription,
    resumeSubscription: resumeSub.resumeSubscription,
    changePlan: changePlanHook.changePlan,
    toggleAutoRenew: toggleRenew.toggleAutoRenew,

    // Errors
    error: subscription.error || createSub.error || cancelSub.error || changePlanHook.error,

    // Utilities
    refetch: subscription.refetch,
  };
}
