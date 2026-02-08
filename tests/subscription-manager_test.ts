import { describe, expect, it, beforeEach } from "vitest";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";

const CONTRACT_NAME = "subscription-manager";

describe("subscription-manager contract tests", () => {
  let simnet: Simnet;
  let deployer: string;
  let wallet1: string;
  let wallet2: string;
  let wallet3: string;

  beforeEach(() => {
    simnet = new Simnet();
    const accounts = simnet.getAccounts();
    deployer = accounts.get("deployer")!;
    wallet1 = accounts.get("wallet_1")!;
    wallet2 = accounts.get("wallet_2")!;
    wallet3 = accounts.get("wallet_3")!;
  });

  describe("Contract Initialization", () => {
    it("ensures simnet is initialized", () => {
      expect(simnet.blockHeight).toBeDefined();
      expect(simnet.blockHeight).toBeGreaterThan(0);
    });

    it("initializes with correct default values", () => {
      const { result: maxRetry } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-max-retry-attempts",
        [],
        deployer
      );
      expect(maxRetry).toBeUint(3);

      const { result: gracePeriod } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-grace-period",
        [],
        deployer
      );
      expect(gracePeriod).toBeUint(259200); // 3 days in seconds
    });
  });

  describe("Subscription Plan Management", () => {
    it("allows owner to create subscription plan", () => {
      const planName = Cl.stringUtf8("Premium Plan");
      const description = Cl.stringUtf8("Full access to all features");
      const price = Cl.uint(100000000); // 100 STX in micro-STX
      const interval = Cl.uint(2592000); // Monthly
      const features = Cl.list([
        Cl.stringUtf8("Unlimited campaigns"),
        Cl.stringUtf8("Advanced analytics"),
        Cl.stringUtf8("Priority support"),
      ]);
      const discount = Cl.uint(10); // 10% discount

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription-plan",
        [planName, description, price, interval, features, discount],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));

      // Verify plan was created
      const { result: planData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-plan",
        [Cl.uint(1)],
        deployer
      );

      expect(planData).toBeSome(
        Cl.tuple({
          name: planName,
          description: description,
          price: price,
          interval: interval,
          features: features,
          active: Cl.bool(true),
          "discount-percent": discount,
        })
      );
    });

    it("prevents non-owner from creating subscription plan", () => {
      const planName = Cl.stringUtf8("Basic Plan");
      const description = Cl.stringUtf8("Basic features");
      const price = Cl.uint(50000000);
      const interval = Cl.uint(2592000);
      const features = Cl.list([Cl.stringUtf8("Basic features")]);
      const discount = Cl.uint(0);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription-plan",
        [planName, description, price, interval, features, discount],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(100)); // err-owner-only
    });

    it("rejects invalid billing intervals", () => {
      const invalidInterval = Cl.uint(123456); // Invalid interval

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription-plan",
        [
          Cl.stringUtf8("Test Plan"),
          Cl.stringUtf8("Test"),
          Cl.uint(100000000),
          invalidInterval,
          Cl.list([Cl.stringUtf8("Feature")]),
          Cl.uint(0),
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(105)); // err-invalid-interval
    });

    it("accepts all valid billing intervals", () => {
      const validIntervals = [
        604800, // Weekly
        2592000, // Monthly
        7776000, // Quarterly
        31536000, // Yearly
      ];

      validIntervals.forEach((interval, index) => {
        const { result } = simnet.callPublicFn(
          CONTRACT_NAME,
          "create-subscription-plan",
          [
            Cl.stringUtf8(`Plan ${index}`),
            Cl.stringUtf8("Test plan"),
            Cl.uint(100000000),
            Cl.uint(interval),
            Cl.list([Cl.stringUtf8("Feature")]),
            Cl.uint(0),
          ],
          deployer
        );

        expect(result).toBeOk(Cl.uint(index + 1));
      });
    });
  });

  describe("Subscription Creation", () => {
    it("creates a new subscription successfully", () => {
      const campaignId = Cl.uint(1);
      const amount = Cl.uint(100000000); // 100 STX
      const interval = Cl.uint(2592000); // Monthly
      const autoRenew = Cl.bool(true);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [campaignId, amount, interval, autoRenew],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(1));

      // Verify subscription details
      const { result: subData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );

      expect(subData).toBeSome(
        Cl.tuple({
          "campaign-id": campaignId,
          subscriber: Cl.principal(wallet1),
          amount: amount,
          "billing-interval": interval,
          status: Cl.uint(1), // STATUS-ACTIVE
          "next-billing": Cl.uint(simnet.blockHeight + 2592000),
          "created-at": Cl.uint(simnet.blockHeight),
          "last-payment": Cl.uint(simnet.blockHeight),
          "total-payments": Cl.uint(1),
          "failed-attempts": Cl.uint(0),
          "auto-renew": autoRenew,
        })
      );
    });

    it("prevents duplicate subscriptions for same campaign", () => {
      const campaignId = Cl.uint(1);
      const amount = Cl.uint(100000000);
      const interval = Cl.uint(2592000);
      const autoRenew = Cl.bool(true);

      // First subscription should succeed
      const { result: result1 } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [campaignId, amount, interval, autoRenew],
        wallet1
      );
      expect(result1).toBeOk(Cl.uint(1));

      // Second subscription for same campaign should fail
      const { result: result2 } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [campaignId, amount, interval, autoRenew],
        wallet1
      );
      expect(result2).toBeErr(Cl.uint(106)); // err-already-exists
    });

    it("allows same user to subscribe to different campaigns", () => {
      const amount = Cl.uint(100000000);
      const interval = Cl.uint(2592000);
      const autoRenew = Cl.bool(true);

      const { result: result1 } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(1), amount, interval, autoRenew],
        wallet1
      );
      expect(result1).toBeOk(Cl.uint(1));

      const { result: result2 } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(2), amount, interval, autoRenew],
        wallet1
      );
      expect(result2).toBeOk(Cl.uint(2));
    });

    it("initializes subscription analytics correctly", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(1), Cl.uint(100000000), Cl.uint(2592000), Cl.bool(true)],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(1));

      const { result: analytics } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription-analytics",
        [Cl.uint(1)],
        wallet1
      );

      expect(analytics).toBeSome(
        Cl.tuple({
          "total-revenue": Cl.uint(100000000),
          "successful-payments": Cl.uint(1),
          "failed-payments": Cl.uint(0),
          "avg-payment-amount": Cl.uint(100000000),
          "lifetime-value": Cl.uint(100000000),
          "churn-risk-score": Cl.uint(0),
        })
      );
    });
  });

  describe("Subscription Renewal", () => {
    beforeEach(() => {
      // Create a subscription
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(1), Cl.uint(100000000), Cl.uint(2592000), Cl.bool(true)],
        wallet1
      );
    });

    it("processes renewal successfully when due", () => {
      // Advance time past next billing
      simnet.mineEmptyBlocks(2592001);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "process-renewal",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));

      // Verify subscription was updated
      const { result: subData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const subscription = subData.value as any;
      expect(subscription["total-payments"]).toBeUint(2);
      expect(subscription["failed-attempts"]).toBeUint(0);
    });

    it("prevents renewal before due date", () => {
      // Try to renew immediately without advancing time
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "process-renewal",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(102)); // err-unauthorized
    });

    it("prevents renewal when auto-renew is disabled", () => {
      // Disable auto-renew
      simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-auto-renew",
        [Cl.uint(1)],
        wallet1
      );

      // Advance time
      simnet.mineEmptyBlocks(2592001);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "process-renewal",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(102)); // err-unauthorized
    });

    it("updates analytics after successful renewal", () => {
      // Advance time
      simnet.mineEmptyBlocks(2592001);

      simnet.callPublicFn(
        CONTRACT_NAME,
        "process-renewal",
        [Cl.uint(1)],
        wallet1
      );

      const { result: analytics } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription-analytics",
        [Cl.uint(1)],
        wallet1
      );

      expect(analytics).toBeSome(
        Cl.tuple({
          "total-revenue": Cl.uint(200000000), // 2 payments
          "successful-payments": Cl.uint(2),
          "failed-payments": Cl.uint(0),
          "avg-payment-amount": Cl.uint(100000000),
          "lifetime-value": Cl.uint(200000000),
          "churn-risk-score": Cl.uint(0),
        })
      );
    });
  });

  describe("Payment Failure Handling", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(1), Cl.uint(100000000), Cl.uint(2592000), Cl.bool(true)],
        wallet1
      );
    });

    it("handles payment failure and adds grace period", () => {
      const { result: subBefore } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );
      const originalNextBilling = (subBefore.value as any)["next-billing"];

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.stringUtf8("Insufficient funds")],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      const { result: subAfter } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const subscription = subAfter.value as any;
      expect(subscription["failed-attempts"]).toBeUint(1);
      expect(subscription["next-billing"]).toBeUint(
        originalNextBilling.value + 259200n // grace period added
      );
      expect(subscription.status).toBeUint(1); // Still active
    });

    it("cancels subscription after max retry attempts", () => {
      // First failure
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.stringUtf8("Failure 1")],
        deployer
      );

      // Second failure
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.stringUtf8("Failure 2")],
        deployer
      );

      // Third failure - should cancel
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.stringUtf8("Failure 3")],
        deployer
      );

      expect(result).toBeOk(Cl.bool(false)); // Returns false on cancellation

      const { result: subData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const subscription = subData.value as any;
      expect(subscription.status).toBeUint(3); // STATUS-CANCELLED
      expect(subscription["failed-attempts"]).toBeUint(3);
    });

    it("updates churn risk score based on failures", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.stringUtf8("Failure")],
        deployer
      );

      const { result: analytics } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription-analytics",
        [Cl.uint(1)],
        wallet1
      );

      expect(analytics).toBeSome(
        Cl.tuple({
          "total-revenue": Cl.uint(100000000),
          "successful-payments": Cl.uint(1),
          "failed-payments": Cl.uint(1),
          "avg-payment-amount": Cl.uint(100000000),
          "lifetime-value": Cl.uint(100000000),
          "churn-risk-score": Cl.uint(20), // 1 failure * 20
        })
      );
    });

    it("only allows owner to handle payment failures", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.stringUtf8("Unauthorized failure")],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(100)); // err-owner-only
    });
  });

  describe("Subscription Cancellation", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(1), Cl.uint(100000000), Cl.uint(2592000), Cl.bool(true)],
        wallet1
      );
    });

    it("allows subscriber to cancel their subscription", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cancel-subscription",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));

      const { result: subData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const subscription = subData.value as any;
      expect(subscription.status).toBeUint(3); // STATUS-CANCELLED
    });

    it("prevents non-subscriber from canceling subscription", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cancel-subscription",
        [Cl.uint(1)],
        wallet2 // Different wallet
      );

      expect(result).toBeErr(Cl.uint(102)); // err-unauthorized
    });

    it("prevents canceling already canceled subscription", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "cancel-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cancel-subscription",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(103)); // err-inactive-subscription
    });
  });

  describe("Subscription Pause and Resume", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(1), Cl.uint(100000000), Cl.uint(2592000), Cl.bool(true)],
        wallet1
      );
    });

    it("allows subscriber to pause active subscription", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "pause-subscription",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));

      const { result: subData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const subscription = subData.value as any;
      expect(subscription.status).toBeUint(2); // STATUS-PAUSED
    });

    it("allows subscriber to resume paused subscription", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "pause-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "resume-subscription",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));

      const { result: subData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const subscription = subData.value as any;
      expect(subscription.status).toBeUint(1); // STATUS-ACTIVE
    });

    it("prevents resuming non-paused subscription", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "resume-subscription",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(103)); // err-inactive-subscription
    });
  });

  describe("Plan Changes", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(1), Cl.uint(100000000), Cl.uint(2592000), Cl.bool(true)],
        wallet1
      );
    });

    it("allows changing subscription amount", () => {
      const newAmount = Cl.uint(150000000); // 150 STX

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "update-subscription-amount",
        [Cl.uint(1), newAmount],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));

      const { result: subData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const subscription = subData.value as any;
      expect(subscription.amount).toBeUint(150000000);
    });

    it("only allows subscriber to change amount", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "update-subscription-amount",
        [Cl.uint(1), Cl.uint(150000000)],
        wallet2
      );

      expect(result).toBeErr(Cl.uint(102)); // err-unauthorized
    });
  });

  describe("Auto-Renew Toggle", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(1), Cl.uint(100000000), Cl.uint(2592000), Cl.bool(true)],
        wallet1
      );
    });

    it("toggles auto-renew off", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-auto-renew",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(false)); // Returns new state

      const { result: subData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const subscription = subData.value as any;
      expect(subscription["auto-renew"]).toBeBool(false);
    });

    it("toggles auto-renew back on", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-auto-renew",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-auto-renew",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Grace Period Handling", () => {
    it("allows admin to update grace period", () => {
      const newGracePeriod = Cl.uint(432000); // 5 days

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-grace-period",
        [newGracePeriod],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      const { result: period } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-grace-period",
        [],
        deployer
      );

      expect(period).toBeUint(432000);
    });

    it("prevents non-owner from changing grace period", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-grace-period",
        [Cl.uint(432000)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(100)); // err-owner-only
    });

    it("allows admin to update max retry attempts", () => {
      const newMax = Cl.uint(5);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-max-retry-attempts",
        [newMax],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Subscriber Preferences", () => {
    it("allows users to set preferences", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-subscriber-preferences",
        [
          Cl.uint(1), // payment-method
          Cl.bool(true), // notification-enabled
          Cl.bool(true), // auto-renew-default
          Cl.uint(1000000000), // spending-limit
        ],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));

      const { result: prefs } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscriber-preferences",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(prefs).toBeSome(
        Cl.tuple({
          "payment-method": Cl.uint(1),
          "notification-enabled": Cl.bool(true),
          "auto-renew-default": Cl.bool(true),
          "spending-limit": Cl.uint(1000000000),
        })
      );
    });
  });

  describe("Subscription Expiration", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(1), Cl.uint(100000000), Cl.uint(2592000), Cl.bool(true)],
        wallet1
      );
    });

    it("allows admin to expire subscription", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "expire-subscription",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));

      const { result: subData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(1)],
        wallet1
      );

      const subscription = subData.value as any;
      expect(subscription.status).toBeUint(4); // STATUS-EXPIRED
    });

    it("prevents non-owner from expiring subscription", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "expire-subscription",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(100)); // err-owner-only
    });
  });

  describe("Read-Only Functions", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-subscription",
        [Cl.uint(1), Cl.uint(100000000), Cl.uint(2592000), Cl.bool(true)],
        wallet1
      );
    });

    it("checks if subscription is active", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-subscription-active",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeBool(true);
    });

    it("gets renewal status", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-renewal-status",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeTuple({
        active: Cl.bool(true),
        "next-billing": Cl.uint(simnet.blockHeight + 2592000),
        "auto-renew": Cl.bool(true),
        "failed-attempts": Cl.uint(0),
      });
    });

    it("gets subscriber subscription by campaign", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscriber-subscription",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome();
    });

    it("returns none for non-existent subscription", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-subscription",
        [Cl.uint(999)],
        wallet1
      );

      expect(result).toBeNone();
    });
  });
});
