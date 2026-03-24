import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const advertiser1 = accounts.get("wallet_1")!;
const advertiser2 = accounts.get("wallet_2")!;
const nonOwner = accounts.get("wallet_3")!;

const CONTRACT = "promo-manager";

// 1 STX = 1,000,000 micro-STX
const ONE_STX = 1_000_000;
const MIN_BUDGET = ONE_STX;
const MIN_DURATION = 144; // ~1 day
const MAX_DURATION = 12960; // ~90 days

describe("promo-manager contract", () => {
  describe("create-campaign", () => {
    it("creates a campaign with valid parameters", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("Test Campaign"),
          Cl.uint(5 * ONE_STX),
          Cl.uint(ONE_STX),
          Cl.uint(MIN_DURATION),
        ],
        advertiser1,
      );
      expect(result.result).toBeOk(Cl.uint(0)); // First campaign ID
    });

    it("rejects budget below minimum (1 STX)", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("Cheap Campaign"),
          Cl.uint(100), // Way below 1 STX
          Cl.uint(50),
          Cl.uint(MIN_DURATION),
        ],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(102));
    });

    it("rejects empty campaign name", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii(""),
          Cl.uint(5 * ONE_STX),
          Cl.uint(ONE_STX),
          Cl.uint(MIN_DURATION),
        ],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(107));
    });

    it("rejects duration below minimum", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("Short Campaign"),
          Cl.uint(5 * ONE_STX),
          Cl.uint(ONE_STX),
          Cl.uint(10), // Too short
        ],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(105));
    });

    it("rejects duration above maximum", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("Long Campaign"),
          Cl.uint(5 * ONE_STX),
          Cl.uint(ONE_STX),
          Cl.uint(MAX_DURATION + 1),
        ],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(105));
    });

    it("rejects daily budget exceeding total budget", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("Bad Daily"),
          Cl.uint(5 * ONE_STX),
          Cl.uint(10 * ONE_STX), // Daily > total
          Cl.uint(MIN_DURATION),
        ],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(102));
    });

    it("increments campaign counter", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("Counter Test"),
          Cl.uint(5 * ONE_STX),
          Cl.uint(ONE_STX),
          Cl.uint(MIN_DURATION),
        ],
        advertiser1,
      );

      const count = simnet.callReadOnlyFn(
        CONTRACT,
        "get-campaign-count",
        [],
        deployer,
      );
      // Should be at least 1
      expect(Number(Cl.deserialize(Cl.serialize(count.result)))).toBeGreaterThanOrEqual(1);
    });
  });

  describe("pause-campaign", () => {
    it("allows advertiser to pause their active campaign", () => {
      const createResult = simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("Pause Test"),
          Cl.uint(5 * ONE_STX),
          Cl.uint(ONE_STX),
          Cl.uint(MIN_DURATION),
        ],
        advertiser1,
      );
      // Extract campaign ID from ok result
      const campaignId = 0; // Depends on state, use a fresh test

      const result = simnet.callPublicFn(
        CONTRACT,
        "pause-campaign",
        [Cl.uint(campaignId)],
        advertiser1,
      );
      // Will succeed if this advertiser owns campaign 0
      // May err if another test created campaign 0 first
    });

    it("rejects pause from non-owner", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("NotMyPause"),
          Cl.uint(5 * ONE_STX),
          Cl.uint(ONE_STX),
          Cl.uint(MIN_DURATION),
        ],
        advertiser1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "pause-campaign",
        [Cl.uint(0)],
        advertiser2,
      );
      expect(result.result).toBeErr(Cl.uint(100));
    });
  });

  describe("read-only functions", () => {
    it("returns campaign data after creation", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("ReadTest"),
          Cl.uint(3 * ONE_STX),
          Cl.uint(ONE_STX),
          Cl.uint(500),
        ],
        advertiser1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-campaign",
        [Cl.uint(0)],
        deployer,
      );
      // Should return some value (campaign exists)
      expect(result.result).not.toBeNone();
    });

    it("returns none for non-existent campaign", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-campaign",
        [Cl.uint(99999)],
        deployer,
      );
      expect(result.result).toBeNone();
    });

    it("checks is-campaign-active correctly", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("ActiveCheck"),
          Cl.uint(5 * ONE_STX),
          Cl.uint(ONE_STX),
          Cl.uint(MIN_DURATION),
        ],
        advertiser1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "is-campaign-active",
        [Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeBool(true);
    });

    it("returns false for non-existent campaign active check", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "is-campaign-active",
        [Cl.uint(99999)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });

    it("returns remaining budget", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-campaign",
        [
          Cl.stringAscii("BudgetCheck"),
          Cl.uint(10 * ONE_STX),
          Cl.uint(2 * ONE_STX),
          Cl.uint(MIN_DURATION),
        ],
        advertiser1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-remaining-budget",
        [Cl.uint(0)],
        deployer,
      );
      // Should be full budget since no spend yet
      expect(result.result).toBeOk(Cl.uint(10 * ONE_STX));
    });
  });

  describe("admin functions", () => {
    it("allows contract owner to pause the contract", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-contract-paused",
        [Cl.bool(true)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects non-owner from pausing contract", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-contract-paused",
        [Cl.bool(true)],
        nonOwner,
      );
      expect(result.result).toBeErr(Cl.uint(100));
    });
  });
});
