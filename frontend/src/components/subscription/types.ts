// Shared TypeScript interfaces for subscription components

export type SubscriptionTier = 'free' | 'basic' | 'pro' | 'enterprise';

export type BillingInterval = 'monthly' | 'yearly';

export type PaymentStatus = 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trialing';

export type InvoiceStatus = 'paid' | 'pending' | 'failed' | 'refunded';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  limits: {
    campaigns: number;
    impressions: number;
    apiCalls: number;
    storage: number; // GB
    users: number;
  };
  popular?: boolean;
  custom?: boolean;
}

export interface CurrentSubscription {
  id: string;
  plan: SubscriptionPlan;
  status: PaymentStatus;
  billingInterval: BillingInterval;
  startDate: Date;
  renewalDate: Date;
  canceledAt?: Date;
  cancelAtPeriodEnd: boolean;
  autoRenew: boolean;
  trialEndsAt?: Date;
}

export interface UsageMetrics {
  campaigns: {
    used: number;
    limit: number;
    percentage: number;
  };
  impressions: {
    used: number;
    limit: number;
    percentage: number;
  };
  apiCalls: {
    used: number;
    limit: number;
    percentage: number;
  };
  storage: {
    used: number;
    limit: number;
    percentage: number;
  };
  users: {
    used: number;
    limit: number;
    percentage: number;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank_account';
  brand?: string;
  last4: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  billingDetails: {
    name: string;
    email: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
}

export interface Invoice {
  id: string;
  number: string;
  status: InvoiceStatus;
  amount: number;
  tax: number;
  total: number;
  currency: string;
  date: Date;
  dueDate: Date;
  paidDate?: Date;
  description: string;
  lineItems: InvoiceLineItem[];
  paymentMethod?: PaymentMethod;
  downloadUrl?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface PaymentAlert {
  id: string;
  type: 'failed_payment' | 'upcoming_renewal' | 'usage_limit' | 'trial_ending';
  severity: 'info' | 'warning' | 'error';
  title: string;
  message: string;
  date: Date;
  actionLabel?: string;
  actionUrl?: string;
  dismissed: boolean;
}

export interface ProrationPreview {
  currentPlan: SubscriptionPlan;
  newPlan: SubscriptionPlan;
  billingInterval: BillingInterval;
  unusedAmount: number;
  newAmount: number;
  prorationAmount: number;
  immediateCharge: number;
  nextBillingDate: Date;
  effectiveDate: Date;
}

export interface CancellationFeedback {
  reason: string;
  comments?: string;
  wouldRecommend: boolean;
  features: string[];
  pricing?: 'too_expensive' | 'too_cheap' | 'fair';
}

export interface CheckoutData {
  plan: SubscriptionPlan;
  billingInterval: BillingInterval;
  paymentMethod?: PaymentMethod;
  billingDetails: {
    name: string;
    email: string;
    address: {
      line1: string;
      line2?: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
  };
  couponCode?: string;
  agreedToTerms: boolean;
}
