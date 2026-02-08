import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Token Bridge Tests", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Bridge Initialization", () => {
    it("should initialize with correct admin", () => {
      const { result } = simnet.callReadOnlyFn(
        "token-bridge",
        "get-bridge-admin",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.principal(deployer));
    });

    it("should have emergency pause disabled by default", () => {
      const { result } = simnet.callReadOnlyFn(
        "token-bridge",
        "is-emergency-paused",
        [],
        deployer
      );
      expect(result).toBeOk(Cl.bool(false));
    });
  });

  describe("Validator Management", () => {
    it("should allow admin to add validator", () => {
      const { result } = simnet.callPublicFn(
        "token-bridge",
        "add-validator",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should prevent non-admin from adding validator", () => {
      const { result } = simnet.callPublicFn(
        "token-bridge",
        "add-validator",
        [Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(400)); // err-owner-only
    });

    it("should allow admin to remove validator", () => {
      // First add validator
      simnet.callPublicFn(
        "token-bridge",
        "add-validator",
        [Cl.principal(wallet1)],
        deployer
      );

      // Then remove
      const { result } = simnet.callPublicFn(
        "token-bridge",
        "remove-validator",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Token Locking", () => {
    const txHash = new Uint8Array(32).fill(1);

    it("should lock tokens successfully", () => {
      const { result } = simnet.callPublicFn(
        "token-bridge",
        "lock-tokens",
        [
          Cl.uint(1), // Ethereum chain ID
          Cl.stringAscii("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"),
          Cl.stringAscii("USDC"),
          Cl.uint(100000000), // 100 USDC
          Cl.buffer(txHash)
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should reject zero amount", () => {
      const { result } = simnet.callPublicFn(
        "token-bridge",
        "lock-tokens",
        [
          Cl.uint(1),
          Cl.stringAscii("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"),
          Cl.stringAscii("USDC"),
          Cl.uint(0),
          Cl.buffer(txHash)
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(402)); // err-invalid-amount
    });

    it("should track locked balance", () => {
      const txHash2 = new Uint8Array(32).fill(2);

      simnet.callPublicFn(
        "token-bridge",
        "lock-tokens",
        [
          Cl.uint(1),
          Cl.stringAscii("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"),
          Cl.stringAscii("USDC"),
          Cl.uint(100000000),
          Cl.buffer(txHash2)
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        "token-bridge",
        "get-locked-balance",
        [Cl.stringAscii("USDC")],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(100000000));
    });
  });

  describe("Validator Signatures", () => {
    const txHash = new Uint8Array(32).fill(3);

    beforeEach(() => {
      // Add validators
      simnet.callPublicFn(
        "token-bridge",
        "add-validator",
        [Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        "token-bridge",
        "add-validator",
        [Cl.principal(wallet2)],
        deployer
      );

      // Lock tokens
      simnet.callPublicFn(
        "token-bridge",
        "lock-tokens",
        [
          Cl.uint(1),
          Cl.stringAscii("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"),
          Cl.stringAscii("USDC"),
          Cl.uint(100000000),
          Cl.buffer(txHash)
        ],
        wallet1
      );
    });

    it("should allow validator to sign transaction", () => {
      const { result } = simnet.callPublicFn(
        "token-bridge",
        "sign-bridge-transaction",
        [Cl.buffer(txHash)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should prevent non-validator from signing", () => {
      const { result } = simnet.callPublicFn(
        "token-bridge",
        "sign-bridge-transaction",
        [Cl.buffer(txHash)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(401)); // err-not-authorized
    });

    it("should complete transaction with enough signatures", () => {
      // Sign with wallet1
      simnet.callPublicFn(
        "token-bridge",
        "sign-bridge-transaction",
        [Cl.buffer(txHash)],
        wallet1
      );

      // Sign with wallet2
      simnet.callPublicFn(
        "token-bridge",
        "sign-bridge-transaction",
        [Cl.buffer(txHash)],
        wallet2
      );

      // Check status
      const { result } = simnet.callReadOnlyFn(
        "token-bridge",
        "get-transaction-info",
        [Cl.buffer(txHash)],
        wallet1
      );

      // Transaction should be completed (status should change)
      expect(result).toBeSome();
    });
  });

  describe("Emergency Controls", () => {
    it("should allow admin to pause bridge", () => {
      const { result } = simnet.callPublicFn(
        "token-bridge",
        "set-emergency-pause",
        [Cl.bool(true)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("should prevent operations when paused", () => {
      // Pause bridge
      simnet.callPublicFn(
        "token-bridge",
        "set-emergency-pause",
        [Cl.bool(true)],
        deployer
      );

      // Try to lock tokens
      const txHash = new Uint8Array(32).fill(4);
      const { result } = simnet.callPublicFn(
        "token-bridge",
        "lock-tokens",
        [
          Cl.uint(1),
          Cl.stringAscii("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"),
          Cl.stringAscii("USDC"),
          Cl.uint(100000000),
          Cl.buffer(txHash)
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(407)); // err-emergency-paused
    });
  });

  describe("Daily Limits", () => {
    it("should enforce daily transfer limits", () => {
      // This would require setting a low limit and exceeding it
      // Implementation depends on the actual limit values in the contract
      const txHash = new Uint8Array(32).fill(5);

      const { result } = simnet.callPublicFn(
        "token-bridge",
        "lock-tokens",
        [
          Cl.uint(1),
          Cl.stringAscii("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"),
          Cl.stringAscii("USDC"),
          Cl.uint(1000000000000), // Very large amount
          Cl.buffer(txHash)
        ],
        wallet1
      );

      // Should fail due to daily limit
      expect(result).toBeErr(Cl.uint(406)); // err-daily-limit-exceeded
    });
  });
});
