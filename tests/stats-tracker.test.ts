import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const publisher1 = accounts.get("wallet_1")!;
const publisher2 = accounts.get("wallet_2")!;
const viewer1 = accounts.get("wallet_3")!;
const viewer2 = accounts.get("wallet_4")!;

const CONTRACT = "stats-tracker";

describe("stats-tracker contract", () => {
  describe("submit-view", () => {
    it("records a valid view submission", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(1), Cl.principal(viewer1)],
        publisher1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents self-dealing (publisher as viewer)", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(1), Cl.principal(publisher1)],
        publisher1,
      );
      expect(result.result).toBeErr(Cl.uint(303));
    });

    it("tracks multiple views from different publishers", () => {
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(1), Cl.principal(viewer1)],
        publisher1,
      );
      const result = simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(1), Cl.principal(viewer1)],
        publisher2,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("increments unique viewer count on first view only", () => {
      // First view
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(5), Cl.principal(viewer1)],
        publisher1,
      );
      // Second view from same viewer
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(5), Cl.principal(viewer1)],
        publisher2,
      );
      // Different viewer
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(5), Cl.principal(viewer2)],
        publisher1,
      );

      const analytics = simnet.callReadOnlyFn(
        CONTRACT,
        "get-analytics",
        [Cl.uint(5)],
        deployer,
      );
      expect(analytics.result).toBeTuple({
        "total-views": Cl.uint(3),
        "unique-viewers": Cl.uint(2),
        "total-spent": Cl.uint(0),
        "last-view-block": Cl.uint(expect.anything()),
      });
    });
  });

  describe("read-only queries", () => {
    it("returns default analytics for unseen campaign", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-analytics",
        [Cl.uint(999)],
        deployer,
      );
      expect(result.result).toBeTuple({
        "total-views": Cl.uint(0),
        "unique-viewers": Cl.uint(0),
        "total-spent": Cl.uint(0),
        "last-view-block": Cl.uint(0),
      });
    });

    it("returns false for has-viewed on unseen campaign", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "has-viewed",
        [Cl.uint(999), Cl.principal(viewer1)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });

    it("returns true for has-viewed after submission", () => {
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(10), Cl.principal(viewer1)],
        publisher1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "has-viewed",
        [Cl.uint(10), Cl.principal(viewer1)],
        deployer,
      );
      expect(result.result).toBeBool(true);
    });

    it("returns publisher stats after submissions", () => {
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(20), Cl.principal(viewer1)],
        publisher1,
      );
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(20), Cl.principal(viewer2)],
        publisher1,
      );

      const stats = simnet.callReadOnlyFn(
        CONTRACT,
        "get-publisher-stats",
        [Cl.uint(20), Cl.principal(publisher1)],
        deployer,
      );
      expect(stats.result).toBeTuple({
        "views-submitted": Cl.uint(2),
        "valid-views": Cl.uint(2),
        "last-submit-block": Cl.uint(expect.anything()),
      });
    });
  });

  describe("admin functions", () => {
    it("allows admin to record campaign spend", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-campaign-spend",
        [Cl.uint(1), Cl.uint(500000)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents non-admin from recording spend", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-campaign-spend",
        [Cl.uint(1), Cl.uint(500000)],
        publisher1,
      );
      expect(result.result).toBeErr(Cl.uint(300));
    });

    it("allows admin to invalidate a view", () => {
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(30), Cl.principal(viewer1)],
        publisher1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "invalidate-view",
        [Cl.uint(30), Cl.principal(viewer1)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents non-admin from invalidating views", () => {
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(31), Cl.principal(viewer1)],
        publisher1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "invalidate-view",
        [Cl.uint(31), Cl.principal(viewer1)],
        publisher1,
      );
      expect(result.result).toBeErr(Cl.uint(300));
    });
  });

  describe("global counters", () => {
    it("tracks total views across campaigns", () => {
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(40), Cl.principal(viewer1)],
        publisher1,
      );
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(41), Cl.principal(viewer1)],
        publisher1,
      );
      simnet.callPublicFn(
        CONTRACT,
        "submit-view",
        [Cl.uint(42), Cl.principal(viewer2)],
        publisher1,
      );

      const total = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-views",
        [],
        deployer,
      );
      // Value will be at least 3 from this test (may be more from prior tests)
      expect(Number(Cl.deserialize(Cl.serialize(total.result)))).toBeGreaterThanOrEqual(3);
    });
  });
});
