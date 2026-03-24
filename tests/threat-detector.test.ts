import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const reporter1 = accounts.get("wallet_1")!;
const reporter2 = accounts.get("wallet_2")!;
const suspectAccount = accounts.get("wallet_3")!;
const unauthorized = accounts.get("wallet_4")!;

const CONTRACT = "threat-detector";
const EMPTY_EVIDENCE = Cl.buff(new Uint8Array(32));

describe("threat-detector contract", () => {
  describe("submit-flag", () => {
    it("submits a click fraud flag", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "submit-flag",
        [Cl.uint(1), Cl.uint(1), EMPTY_EVIDENCE],
        reporter1,
      );
      expect(result.result).toBeOk(Cl.uint(0)); // First flag index
    });

    it("submits a view spam flag", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "submit-flag",
        [Cl.uint(1), Cl.uint(2), EMPTY_EVIDENCE],
        reporter2,
      );
      expect(result.result).toBeOk(Cl.uint(1)); // Second flag index
    });

    it("rejects invalid flag type (0)", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "submit-flag",
        [Cl.uint(1), Cl.uint(0), EMPTY_EVIDENCE],
        reporter1,
      );
      expect(result.result).toBeErr(Cl.uint(704));
    });

    it("rejects invalid flag type (6+)", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "submit-flag",
        [Cl.uint(1), Cl.uint(6), EMPTY_EVIDENCE],
        reporter1,
      );
      expect(result.result).toBeErr(Cl.uint(704));
    });

    it("increments fraud score on each flag", () => {
      // Submit 3 flags to campaign 10
      simnet.callPublicFn(CONTRACT, "submit-flag", [Cl.uint(10), Cl.uint(1), EMPTY_EVIDENCE], reporter1);
      simnet.callPublicFn(CONTRACT, "submit-flag", [Cl.uint(10), Cl.uint(2), EMPTY_EVIDENCE], reporter2);
      simnet.callPublicFn(CONTRACT, "submit-flag", [Cl.uint(10), Cl.uint(3), EMPTY_EVIDENCE], reporter1);

      const score = simnet.callReadOnlyFn(
        CONTRACT,
        "get-campaign-score",
        [Cl.uint(10)],
        deployer,
      );
      // Score should be 30 (10 per flag)
      expect(score.result).toBeTuple({
        "fraud-score": Cl.uint(30),
        "flag-count": Cl.uint(3),
        "last-checked": Cl.uint(expect.anything()),
        "threat-level": Cl.uint(1), // LOW (25-49)
        "suspicious-views": Cl.uint(0),
        "total-views-at-check": Cl.uint(0),
      });
    });
  });

  describe("read-only queries", () => {
    it("returns default score for unflagged campaign", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-campaign-score",
        [Cl.uint(999)],
        deployer,
      );
      expect(result.result).toBeTuple({
        "fraud-score": Cl.uint(0),
        "flag-count": Cl.uint(0),
        "last-checked": Cl.uint(0),
        "threat-level": Cl.uint(0),
        "suspicious-views": Cl.uint(0),
        "total-views-at-check": Cl.uint(0),
      });
    });

    it("returns threat level 0 for clean campaign", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-threat-level",
        [Cl.uint(999)],
        deployer,
      );
      expect(result.result).toBeUint(0);
    });

    it("returns false for unblocked account", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "is-account-blocked",
        [Cl.principal(suspectAccount)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });

    it("returns default account threats", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-account-threats",
        [Cl.principal(suspectAccount)],
        deployer,
      );
      expect(result.result).toBeTuple({
        "total-flags-received": Cl.uint(0),
        "total-flags-resolved": Cl.uint(0),
        "threat-level": Cl.uint(0),
        "last-flagged": Cl.uint(0),
        "is-blocked": Cl.bool(false),
      });
    });
  });

  describe("admin functions", () => {
    it("allows admin to update campaign score", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "update-campaign-score",
        [Cl.uint(20), Cl.uint(75), Cl.uint(150), Cl.uint(1000)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects score above 100", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "update-campaign-score",
        [Cl.uint(21), Cl.uint(101), Cl.uint(0), Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(704));
    });

    it("prevents non-admin from updating score", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "update-campaign-score",
        [Cl.uint(22), Cl.uint(50), Cl.uint(0), Cl.uint(0)],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(700));
    });

    it("allows admin to block an account", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "block-account",
        [Cl.principal(suspectAccount)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("confirms blocked account status", () => {
      simnet.callPublicFn(
        CONTRACT,
        "block-account",
        [Cl.principal(suspectAccount)],
        deployer,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "is-account-blocked",
        [Cl.principal(suspectAccount)],
        deployer,
      );
      expect(result.result).toBeBool(true);
    });

    it("allows admin to unblock an account", () => {
      simnet.callPublicFn(
        CONTRACT,
        "block-account",
        [Cl.principal(suspectAccount)],
        deployer,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "unblock-account",
        [Cl.principal(suspectAccount)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents non-admin from blocking", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "block-account",
        [Cl.principal(suspectAccount)],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(700));
    });

    it("allows admin to resolve a flag", () => {
      simnet.callPublicFn(
        CONTRACT,
        "submit-flag",
        [Cl.uint(30), Cl.uint(1), EMPTY_EVIDENCE],
        reporter1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "resolve-flag",
        [Cl.uint(30), Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents resolving already resolved flag", () => {
      simnet.callPublicFn(
        CONTRACT,
        "submit-flag",
        [Cl.uint(31), Cl.uint(1), EMPTY_EVIDENCE],
        reporter1,
      );
      simnet.callPublicFn(
        CONTRACT,
        "resolve-flag",
        [Cl.uint(31), Cl.uint(0)],
        deployer,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "resolve-flag",
        [Cl.uint(31), Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(702));
    });
  });
});
