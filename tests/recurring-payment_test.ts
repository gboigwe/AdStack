import { describe, expect, it, beforeEach } from "vitest";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";

const CONTRACT_NAME = "recurring-payment-processor";

describe("recurring-payment contract tests", () => {
  let simnet: Simnet;
  let deployer: string;
  let wallet1: string;
  let wallet2: string;
  let wallet3: string;
  let wallet4: string;

  beforeEach(() => {
    simnet = new Simnet();
    const accounts = simnet.getAccounts();
    deployer = accounts.get("deployer")!;
    wallet1 = accounts.get("wallet_1")!;
    wallet2 = accounts.get("wallet_2")!;
    wallet3 = accounts.get("wallet_3")!;
    wallet4 = accounts.get("wallet_4")!;
  });

  describe("Contract Initialization", () => {
    it("ensures simnet is initialized", () => {
      expect(simnet.blockHeight).toBeDefined();
      expect(simnet.blockHeight).toBeGreaterThan(0);
    });

    it("initializes with correct constants", () => {
      const { result: maxRetries } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-stats",
        [],
        deployer
      );

      expect(maxRetries).toBeOk(
        Cl.tuple({
          "total-payments": Cl.uint(0),
          "total-volume": Cl.uint(0),
          "total-refunds": Cl.uint(0),
          "total-refund-volume": Cl.uint(0),
        })
      );
    });

    it("verifies contract owner is set correctly", () => {
      // Try to set platform fee as owner
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-platform-fee",
        [Cl.uint(200)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("calculates payment fee correctly", () => {
      const amount = Cl.uint(1000000); // 1 STX
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "calculate-payment-fee",
        [amount],
        deployer
      );

      // Default fee is 150 bps (1.5%) = 15000 micro-STX
      expect(result).toBeOk(Cl.uint(15000));
    });
  });

  describe("Payment Scheduling", () => {
    it("schedules a payment successfully", () => {
      const subscriptionId = Cl.uint(1);
      const payee = Cl.principal(wallet2);
      const amount = Cl.uint(100000000); // 100 STX
      const paymentMethod = Cl.uint(1); // METHOD-STX
      const scheduledFor = Cl.uint(simnet.blockHeight + 1000);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [subscriptionId, payee, amount, paymentMethod, scheduledFor],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(1)); // payment-id
    });

    it("verifies scheduled payment details", () => {
      const subscriptionId = Cl.uint(1);
      const payee = Cl.principal(wallet2);
      const amount = Cl.uint(100000000);
      const paymentMethod = Cl.uint(1);
      const scheduledFor = Cl.uint(simnet.blockHeight + 1000);

      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [subscriptionId, payee, amount, paymentMethod, scheduledFor],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-scheduled-payment",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "subscription-id": subscriptionId,
          payer: Cl.principal(wallet1),
          payee: payee,
          amount: amount,
          "payment-method": paymentMethod,
          "scheduled-for": scheduledFor,
          status: Cl.uint(1), // STATUS-PENDING
          "retry-count": Cl.uint(0),
          "last-retry": Cl.uint(0),
          "next-retry": Cl.uint(0),
          "created-at": Cl.uint(simnet.blockHeight),
          "processed-at": Cl.none(),
          "failure-reason": Cl.none(),
        })
      );
    });

    it("rejects payment with zero amount", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(0), // Zero amount
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 1000),
        ],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(804)); // err-invalid-amount
    });

    it("rejects payment scheduled in the past", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight - 100), // Past time
        ],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(807)); // err-invalid-schedule
    });

    it("rejects invalid payment method", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(99), // Invalid method
          Cl.uint(simnet.blockHeight + 1000),
        ],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(810)); // err-invalid-payment-method
    });

    it("accepts all valid payment methods", () => {
      const validMethods = [1, 2, 3]; // STX, ESCROW, AUTO-DEBIT

      validMethods.forEach((method, index) => {
        const { result } = simnet.callPublicFn(
          CONTRACT_NAME,
          "schedule-payment",
          [
            Cl.uint(index + 1),
            Cl.principal(wallet2),
            Cl.uint(100000000),
            Cl.uint(method),
            Cl.uint(simnet.blockHeight + 1000),
          ],
          wallet1
        );

        expect(result).toBeOk(Cl.uint(index + 1));
      });
    });

    it("creates transaction history on scheduling", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 1000),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-transaction-history",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "payment-id": Cl.uint(1),
          "transaction-type": Cl.stringAscii("payment"),
          amount: Cl.uint(100000000),
          timestamp: Cl.uint(simnet.blockHeight),
          status: Cl.uint(1), // STATUS-PENDING
        })
      );
    });
  });

  describe("Payment Execution - Success Cases", () => {
    beforeEach(() => {
      // Schedule a payment
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );
    });

    it("executes payment successfully when due", () => {
      // Advance time to payment due date
      simnet.mineEmptyBlocks(101);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          success: Cl.bool(true),
          "payment-id": Cl.uint(1),
          amount: Cl.uint(100000000),
          fee: Cl.uint(1500000), // 1.5% of 100 STX
        })
      );
    });

    it("updates payment status to SUCCESS after execution", () => {
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-scheduled-payment",
        [Cl.uint(1)],
        wallet1
      );

      const payment = result.value as any;
      expect(payment.status).toBeUint(3); // STATUS-SUCCESS
      expect(payment["processed-at"]).toBeSome();
    });

    it("records payment execution details", () => {
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-execution",
        [Cl.uint(1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "executed-at": Cl.uint(simnet.blockHeight),
          "amount-charged": Cl.uint(100000000),
          "fee-charged": Cl.uint(1500000),
          success: Cl.bool(true),
          "error-code": Cl.none(),
          "error-message": Cl.none(),
          "transaction-hash": Cl.none(),
        })
      );
    });

    it("updates payment analytics for subscription", () => {
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-analytics",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "total-payments": Cl.uint(1),
          "successful-payments": Cl.uint(1),
          "failed-payments": Cl.uint(0),
          "total-amount-paid": Cl.uint(100000000),
          "total-fees-paid": Cl.uint(1500000),
          "total-refunds": Cl.uint(0),
          "total-refunded-amount": Cl.uint(0),
          "average-payment-amount": Cl.uint(100000000),
          "success-rate": Cl.uint(10000), // 100%
          "last-payment-date": Cl.uint(simnet.blockHeight),
        })
      );
    });

    it("updates user payment statistics", () => {
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-payment-stats",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "total-payments-made": Cl.uint(1),
          "total-amount-spent": Cl.uint(100000000),
          "total-fees-paid": Cl.uint(1500000),
          "total-refunds-received": Cl.uint(0),
          "failed-payment-count": Cl.uint(0),
          "default-payment-method": Cl.uint(1),
          "payment-reliability-score": Cl.uint(10000), // 100%
        })
      );
    });

    it("updates global payment statistics", () => {
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-stats",
        [],
        deployer
      );

      expect(result).toBeOk(
        Cl.tuple({
          "total-payments": Cl.uint(1),
          "total-volume": Cl.uint(100000000),
          "total-refunds": Cl.uint(0),
          "total-refund-volume": Cl.uint(0),
        })
      );
    });
  });

  describe("Payment Execution - Failure Cases", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );
    });

    it("prevents execution before scheduled time", () => {
      // Don't advance time
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(807)); // err-invalid-schedule
    });

    it("prevents execution of non-existent payment", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(999)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(801)); // err-not-found
    });

    it("prevents double execution of same payment", () => {
      simnet.mineEmptyBlocks(101);

      // First execution
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      // Second execution attempt
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(809)); // err-invalid-status
    });
  });

  describe("Retry Mechanism", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );
    });

    it("handles first payment failure and schedules retry", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Insufficient funds"))],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          "retry-scheduled": Cl.bool(true),
          "next-retry": Cl.uint(simnet.blockHeight + 86400), // RETRY-DELAY
          attempt: Cl.uint(1),
        })
      );
    });

    it("updates retry count after failure", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Failure 1"))],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-scheduled-payment",
        [Cl.uint(1)],
        wallet1
      );

      const payment = result.value as any;
      expect(payment["retry-count"]).toBeUint(1);
      expect(payment.status).toBeUint(1); // Still PENDING for retry
    });

    it("schedules second retry after second failure", () => {
      // First failure
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Failure 1"))],
        wallet1
      );

      // Second failure
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Failure 2"))],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          "retry-scheduled": Cl.bool(true),
          "next-retry": Cl.uint(simnet.blockHeight + 86400),
          attempt: Cl.uint(2),
        })
      );
    });

    it("marks payment as FAILED after max retry attempts", () => {
      // Failure 1
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Failure 1"))],
        wallet1
      );

      // Failure 2
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Failure 2"))],
        wallet1
      );

      // Failure 3 - should mark as FAILED
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Failure 3"))],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          "retry-scheduled": Cl.bool(false),
          "next-retry": Cl.uint(0),
          attempt: Cl.uint(3),
        })
      );

      const { result: paymentData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-scheduled-payment",
        [Cl.uint(1)],
        wallet1
      );

      const payment = paymentData.value as any;
      expect(payment.status).toBeUint(4); // STATUS-FAILED
    });

    it("records failed execution in history", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Payment failed"))],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-execution",
        [Cl.uint(1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "executed-at": Cl.uint(simnet.blockHeight),
          "amount-charged": Cl.uint(100000000),
          "fee-charged": Cl.uint(0),
          success: Cl.bool(false),
          "error-code": Cl.none(),
          "error-message": Cl.some(Cl.stringUtf8("Payment failed")),
          "transaction-hash": Cl.none(),
        })
      );
    });

    it("updates analytics with failed payment", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Failure"))],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-analytics",
        [Cl.uint(1)],
        wallet1
      );

      const analytics = result.value as any;
      expect(analytics["total-payments"]).toBeUint(1);
      expect(analytics["failed-payments"]).toBeUint(1);
      expect(analytics["successful-payments"]).toBeUint(0);
    });

    it("decreases user reliability score on failure", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Failure"))],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-payment-stats",
        [Cl.principal(wallet1)],
        wallet1
      );

      const stats = result.value as any;
      expect(stats["failed-payment-count"]).toBeUint(1);
      expect(stats["payment-reliability-score"]).toBeLessThan(Cl.uint(10000));
    });
  });

  describe("Retry System Toggle", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );
    });

    it("allows owner to disable retry system", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-retry-system",
        [Cl.bool(false)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents non-owner from toggling retry system", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-retry-system",
        [Cl.bool(false)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(800)); // err-owner-only
    });

    it("does not schedule retry when system is disabled", () => {
      // Disable retry system
      simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-retry-system",
        [Cl.bool(false)],
        deployer
      );

      // Trigger failure
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Failure"))],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          "retry-scheduled": Cl.bool(false),
          "next-retry": Cl.uint(0),
          attempt: Cl.uint(1),
        })
      );
    });
  });

  describe("Payment Method Management", () => {
    it("registers a new payment method", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "register-payment-method",
        [
          Cl.uint(1), // METHOD-STX
          Cl.bool(true), // is-default
          Cl.bool(false), // auto-recharge-enabled
          Cl.uint(0), // auto-recharge-threshold
          Cl.uint(0), // auto-recharge-amount
        ],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("verifies payment method details", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-payment-method",
        [
          Cl.uint(2), // METHOD-ESCROW
          Cl.bool(true),
          Cl.bool(true),
          Cl.uint(1000000),
          Cl.uint(5000000),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-method",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "method-type": Cl.uint(2),
          "is-default": Cl.bool(true),
          "is-active": Cl.bool(true),
          "escrow-balance": Cl.uint(0),
          "auto-recharge-enabled": Cl.bool(true),
          "auto-recharge-threshold": Cl.uint(1000000),
          "auto-recharge-amount": Cl.uint(5000000),
          "created-at": Cl.uint(simnet.blockHeight),
          "last-used": Cl.uint(0),
        })
      );
    });

    it("rejects invalid payment method type", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "register-payment-method",
        [
          Cl.uint(99), // Invalid method
          Cl.bool(true),
          Cl.bool(false),
          Cl.uint(0),
          Cl.uint(0),
        ],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(810)); // err-invalid-payment-method
    });

    it("allows registering multiple payment methods", () => {
      const methods = [1, 2, 3]; // All valid methods

      methods.forEach((method) => {
        const { result } = simnet.callPublicFn(
          CONTRACT_NAME,
          "register-payment-method",
          [
            Cl.uint(method),
            Cl.bool(false),
            Cl.bool(false),
            Cl.uint(0),
            Cl.uint(0),
          ],
          wallet1
        );

        expect(result).toBeOk(Cl.uint(1));
      });
    });

    it("registers method with auto-recharge enabled", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-payment-method",
        [
          Cl.uint(2), // ESCROW
          Cl.bool(true),
          Cl.bool(true), // Auto-recharge enabled
          Cl.uint(10000000), // Threshold: 10 STX
          Cl.uint(50000000), // Recharge: 50 STX
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-method",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      const method = result.value as any;
      expect(method["auto-recharge-enabled"]).toBeBool(true);
      expect(method["auto-recharge-threshold"]).toBeUint(10000000);
      expect(method["auto-recharge-amount"]).toBeUint(50000000);
    });
  });

  describe("Refund Processing", () => {
    beforeEach(() => {
      // Schedule and execute a successful payment
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );

      simnet.mineEmptyBlocks(101);

      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );
    });

    it("processes full refund successfully", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [
          Cl.uint(1), // payment-id
          Cl.uint(100000000), // Full refund
          Cl.stringUtf8("Customer requested refund"),
        ],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(1)); // refund-id
    });

    it("verifies refund record details", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [
          Cl.uint(1),
          Cl.uint(100000000),
          Cl.stringUtf8("Refund reason"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-refund",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "payment-id": Cl.uint(1),
          "subscription-id": Cl.uint(1),
          requester: Cl.principal(wallet1),
          "original-amount": Cl.uint(100000000),
          "refund-amount": Cl.uint(100000000),
          "fee-refunded": Cl.uint(1500000),
          reason: Cl.stringUtf8("Refund reason"),
          status: Cl.uint(3), // STATUS-SUCCESS
          "requested-at": Cl.uint(simnet.blockHeight),
          "processed-at": Cl.some(Cl.uint(simnet.blockHeight)),
          "approved-by": Cl.some(Cl.principal(deployer)),
        })
      );
    });

    it("processes partial refund successfully", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [
          Cl.uint(1),
          Cl.uint(50000000), // Half refund
          Cl.stringUtf8("Partial refund"),
        ],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(1));

      const { result: refundData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-refund",
        [Cl.uint(1)],
        wallet1
      );

      const refund = refundData.value as any;
      expect(refund["refund-amount"]).toBeUint(50000000);
      expect(refund["fee-refunded"]).toBeUint(750000); // Half of fee
    });

    it("updates payment status to REFUNDED", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [Cl.uint(1), Cl.uint(100000000), Cl.stringUtf8("Refund")],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-scheduled-payment",
        [Cl.uint(1)],
        wallet1
      );

      const payment = result.value as any;
      expect(payment.status).toBeUint(5); // STATUS-REFUNDED
    });

    it("updates refund analytics", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [Cl.uint(1), Cl.uint(100000000), Cl.stringUtf8("Refund")],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-analytics",
        [Cl.uint(1)],
        wallet1
      );

      const analytics = result.value as any;
      expect(analytics["total-refunds"]).toBeUint(1);
      expect(analytics["total-refunded-amount"]).toBeUint(100000000);
    });

    it("updates user refund statistics", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [Cl.uint(1), Cl.uint(100000000), Cl.stringUtf8("Refund")],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-payment-stats",
        [Cl.principal(wallet1)],
        wallet1
      );

      const stats = result.value as any;
      expect(stats["total-refunds-received"]).toBeUint(1);
    });

    it("updates global refund stats", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [Cl.uint(1), Cl.uint(100000000), Cl.stringUtf8("Refund")],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-stats",
        [],
        deployer
      );

      expect(result).toBeOk(
        Cl.tuple({
          "total-payments": Cl.uint(1),
          "total-volume": Cl.uint(100000000),
          "total-refunds": Cl.uint(1),
          "total-refund-volume": Cl.uint(100000000),
        })
      );
    });

    it("prevents non-payer from requesting refund", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [Cl.uint(1), Cl.uint(100000000), Cl.stringUtf8("Unauthorized")],
        wallet3 // Different user
      );

      expect(result).toBeErr(Cl.uint(802)); // err-unauthorized
    });

    it("prevents refund of non-successful payment", () => {
      // Schedule a new payment that hasn't been executed
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(2),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 1000),
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [Cl.uint(2), Cl.uint(100000000), Cl.stringUtf8("Refund")],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(811)); // err-refund-not-allowed
    });

    it("prevents refund exceeding payment amount", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [
          Cl.uint(1),
          Cl.uint(200000000), // More than paid
          Cl.stringUtf8("Excessive refund"),
        ],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(804)); // err-invalid-amount
    });

    it("prevents refund outside refund window", () => {
      // Advance time beyond refund window (30 days)
      simnet.mineEmptyBlocks(2592001);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [Cl.uint(1), Cl.uint(100000000), Cl.stringUtf8("Too late")],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(811)); // err-refund-not-allowed
    });
  });

  describe("Payment Cancellation", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 1000),
        ],
        wallet1
      );
    });

    it("allows payer to cancel pending payment", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cancel-payment",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("updates payment status to CANCELLED", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "cancel-payment",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-scheduled-payment",
        [Cl.uint(1)],
        wallet1
      );

      const payment = result.value as any;
      expect(payment.status).toBeUint(6); // STATUS-CANCELLED
    });

    it("prevents non-payer from canceling payment", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cancel-payment",
        [Cl.uint(1)],
        wallet2 // Different user
      );

      expect(result).toBeErr(Cl.uint(802)); // err-unauthorized
    });

    it("prevents canceling already processed payment", () => {
      // Execute the payment first
      simnet.mineEmptyBlocks(1001);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      // Try to cancel
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "cancel-payment",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(809)); // err-invalid-status
    });

    it("records cancellation in transaction history", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "cancel-payment",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-transaction-history",
        [Cl.principal(wallet1), Cl.uint(2)], // Second transaction
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "payment-id": Cl.uint(1),
          "transaction-type": Cl.stringAscii("payment"),
          amount: Cl.uint(100000000),
          timestamp: Cl.uint(simnet.blockHeight),
          status: Cl.uint(6), // STATUS-CANCELLED
        })
      );
    });
  });

  describe("Transaction History", () => {
    it("creates transaction on payment schedule", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 1000),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-transaction-history",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome();
    });

    it("creates transaction on successful payment", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );

      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-transaction-history",
        [Cl.principal(wallet1), Cl.uint(2)],
        wallet1
      );

      const tx = result.value as any;
      expect(tx["transaction-type"]).toBeAscii("payment");
      expect(tx.status).toBeUint(3); // STATUS-SUCCESS
    });

    it("creates transaction on retry", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(1), Cl.some(Cl.stringUtf8("Failure"))],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-transaction-history",
        [Cl.principal(wallet1), Cl.uint(2)],
        wallet1
      );

      const tx = result.value as any;
      expect(tx["transaction-type"]).toBeAscii("retry");
    });

    it("creates transaction on refund", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );

      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "process-refund",
        [Cl.uint(1), Cl.uint(100000000), Cl.stringUtf8("Refund")],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-transaction-history",
        [Cl.principal(wallet1), Cl.uint(3)],
        wallet1
      );

      const tx = result.value as any;
      expect(tx["transaction-type"]).toBeAscii("refund");
    });
  });

  describe("Payment Analytics", () => {
    it("tracks multiple successful payments", () => {
      // Create and execute 3 payments
      for (let i = 1; i <= 3; i++) {
        simnet.callPublicFn(
          CONTRACT_NAME,
          "schedule-payment",
          [
            Cl.uint(1), // Same subscription
            Cl.principal(wallet2),
            Cl.uint(100000000),
            Cl.uint(1),
            Cl.uint(simnet.blockHeight + 100),
          ],
          wallet1
        );

        simnet.mineEmptyBlocks(101);
        simnet.callPublicFn(
          CONTRACT_NAME,
          "execute-payment",
          [Cl.uint(i)],
          wallet1
        );
      }

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-analytics",
        [Cl.uint(1)],
        wallet1
      );

      const analytics = result.value as any;
      expect(analytics["total-payments"]).toBeUint(3);
      expect(analytics["successful-payments"]).toBeUint(3);
      expect(analytics["total-amount-paid"]).toBeUint(300000000);
    });

    it("calculates success rate correctly", () => {
      // 2 successful, 1 failed
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(2)],
        wallet1
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "handle-payment-failure",
        [Cl.uint(3), Cl.some(Cl.stringUtf8("Failure"))],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-analytics",
        [Cl.uint(1)],
        wallet1
      );

      const analytics = result.value as any;
      expect(analytics["success-rate"]).toBeUint(6666); // 66.66%
    });

    it("calculates average payment amount", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(200000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(2)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-analytics",
        [Cl.uint(1)],
        wallet1
      );

      const analytics = result.value as any;
      expect(analytics["average-payment-amount"]).toBeUint(150000000);
    });
  });

  describe("Platform Fee Management", () => {
    it("allows owner to set platform fee", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-platform-fee",
        [Cl.uint(200)], // 2%
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents non-owner from setting fee", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-platform-fee",
        [Cl.uint(200)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(800)); // err-owner-only
    });

    it("prevents setting fee above maximum (10%)", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-platform-fee",
        [Cl.uint(1100)], // 11%
        deployer
      );

      expect(result).toBeErr(Cl.uint(804)); // err-invalid-amount
    });

    it("calculates fee correctly after update", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "set-platform-fee",
        [Cl.uint(500)], // 5%
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "calculate-payment-fee",
        [Cl.uint(1000000)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(50000)); // 5% of 1 STX
    });
  });

  describe("Read-Only Functions", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 1000),
        ],
        wallet1
      );
    });

    it("checks if payment is due", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-payment-due",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeBool(false); // Not due yet
    });

    it("checks if payment is due after time passes", () => {
      simnet.mineEmptyBlocks(1001);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-payment-due",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeBool(true);
    });

    it("checks refund eligibility for successful payment", () => {
      simnet.mineEmptyBlocks(1001);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-refund-eligible",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeBool(true);
    });

    it("checks refund eligibility for pending payment", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-refund-eligible",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeBool(false); // Not executed yet
    });

    it("returns none for non-existent payment", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-scheduled-payment",
        [Cl.uint(999)],
        wallet1
      );

      expect(result).toBeNone();
    });

    it("returns none for non-existent payment execution", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-execution",
        [Cl.uint(1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeNone();
    });

    it("returns none for non-existent refund", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-refund",
        [Cl.uint(999)],
        wallet1
      );

      expect(result).toBeNone();
    });
  });

  describe("Edge Cases and Complex Scenarios", () => {
    it("handles multiple payments for same subscription", () => {
      // Create 5 payments for same subscription
      for (let i = 1; i <= 5; i++) {
        simnet.callPublicFn(
          CONTRACT_NAME,
          "schedule-payment",
          [
            Cl.uint(1),
            Cl.principal(wallet2),
            Cl.uint(100000000),
            Cl.uint(1),
            Cl.uint(simnet.blockHeight + 100),
          ],
          wallet1
        );
        simnet.mineEmptyBlocks(101);
        simnet.callPublicFn(
          CONTRACT_NAME,
          "execute-payment",
          [Cl.uint(i)],
          wallet1
        );
      }

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-payment-analytics",
        [Cl.uint(1)],
        wallet1
      );

      const analytics = result.value as any;
      expect(analytics["total-payments"]).toBeUint(5);
      expect(analytics["total-amount-paid"]).toBeUint(500000000);
    });

    it("handles payment with minimum amount", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(1), // Minimum amount
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("tracks user reliability across multiple payments", () => {
      // 2 successful, 2 failed
      for (let i = 1; i <= 4; i++) {
        simnet.callPublicFn(
          CONTRACT_NAME,
          "schedule-payment",
          [
            Cl.uint(1),
            Cl.principal(wallet2),
            Cl.uint(100000000),
            Cl.uint(1),
            Cl.uint(simnet.blockHeight + 100),
          ],
          wallet1
        );

        if (i <= 2) {
          simnet.mineEmptyBlocks(101);
          simnet.callPublicFn(
            CONTRACT_NAME,
            "execute-payment",
            [Cl.uint(i)],
            wallet1
          );
        } else {
          simnet.callPublicFn(
            CONTRACT_NAME,
            "handle-payment-failure",
            [Cl.uint(i), Cl.some(Cl.stringUtf8("Failure"))],
            wallet1
          );
        }
      }

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-payment-stats",
        [Cl.principal(wallet1)],
        wallet1
      );

      const stats = result.value as any;
      expect(stats["payment-reliability-score"]).toBeUint(5000); // 50%
    });

    it("handles refund window boundary", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "schedule-payment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(100000000),
          Cl.uint(1),
          Cl.uint(simnet.blockHeight + 100),
        ],
        wallet1
      );
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "execute-payment",
        [Cl.uint(1)],
        wallet1
      );

      // Just before window expires
      simnet.mineEmptyBlocks(2591999);

      const { result: eligible1 } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-refund-eligible",
        [Cl.uint(1)],
        wallet1
      );
      expect(eligible1).toBeBool(true);

      // After window expires
      simnet.mineEmptyBlocks(2);

      const { result: eligible2 } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-refund-eligible",
        [Cl.uint(1)],
        wallet1
      );
      expect(eligible2).toBeBool(false);
    });

    it("handles zero fee when fee is set to 0", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "set-platform-fee",
        [Cl.uint(0)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "calculate-payment-fee",
        [Cl.uint(100000000)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(0));
    });
  });
});
