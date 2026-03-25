import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const publisher1 = accounts.get("wallet_1")!;
const publisher2 = accounts.get("wallet_2")!;
const unauthorized = accounts.get("wallet_3")!;

const CONTRACT = "cash-distributor";
const ONE_STX = 1_000_000;

describe("cash-distributor contract", () => {
  describe("record-earnings", () => {
    it("records earnings with platform fee deduction (admin)", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-earnings",
        [Cl.uint(1), Cl.principal(publisher1), Cl.uint(ONE_STX)],
        deployer,
      );
      // net = 1_000_000 - (1_000_000 * 50 / 1000) = 950_000
      expect(result.result).toBeOk(Cl.uint(950000));
    });

    it("rejects zero amount", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-earnings",
        [Cl.uint(1), Cl.principal(publisher1), Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(605));
    });

    it("rejects unauthorized earnings recording", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-earnings",
        [Cl.uint(1), Cl.principal(publisher1), Cl.uint(ONE_STX)],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(600));
    });

    it("accumulates earnings for same publisher/campaign", () => {
      simnet.callPublicFn(
        CONTRACT,
        "record-earnings",
        [Cl.uint(5), Cl.principal(publisher1), Cl.uint(ONE_STX)],
        deployer,
      );
      simnet.callPublicFn(
        CONTRACT,
        "record-earnings",
        [Cl.uint(5), Cl.principal(publisher1), Cl.uint(ONE_STX)],
        deployer,
      );

      const earnings = simnet.callReadOnlyFn(
        CONTRACT,
        "get-publisher-earnings",
        [Cl.uint(5), Cl.principal(publisher1)],
        deployer,
      );
      expect(earnings.result).toBeTuple({
        "gross-earnings": Cl.uint(2 * ONE_STX),
        "fees-deducted": Cl.uint(100000), // 50000 * 2
        "net-earnings": Cl.uint(1900000), // 950000 * 2
        claimed: Cl.uint(0),
        "last-updated": Cl.uint(expect.anything()),
      });
    });
  });

  describe("read-only queries", () => {
    it("returns default earnings for unseen publisher", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-publisher-earnings",
        [Cl.uint(999), Cl.principal(publisher2)],
        deployer,
      );
      expect(result.result).toBeTuple({
        "gross-earnings": Cl.uint(0),
        "fees-deducted": Cl.uint(0),
        "net-earnings": Cl.uint(0),
        claimed: Cl.uint(0),
        "last-updated": Cl.uint(0),
      });
    });

    it("returns zero claimable for unseen publisher", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-claimable-amount",
        [Cl.uint(999), Cl.principal(publisher2)],
        deployer,
      );
      expect(result.result).toBeUint(0);
    });

    it("returns correct claimable after earnings", () => {
      simnet.callPublicFn(
        CONTRACT,
        "record-earnings",
        [Cl.uint(10), Cl.principal(publisher1), Cl.uint(2 * ONE_STX)],
        deployer,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-claimable-amount",
        [Cl.uint(10), Cl.principal(publisher1)],
        deployer,
      );
      // net = 2_000_000 - (2_000_000 * 50 / 1000) = 1_900_000
      expect(result.result).toBeUint(1900000);
    });

    it("returns publisher totals", () => {
      simnet.callPublicFn(
        CONTRACT,
        "record-earnings",
        [Cl.uint(15), Cl.principal(publisher1), Cl.uint(ONE_STX)],
        deployer,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-publisher-totals",
        [Cl.principal(publisher1)],
        deployer,
      );
      // totals are accumulated across test runs
      expect(result.result).toBeTuple({
        "total-earned": Cl.uint(expect.anything()),
        "total-claimed": Cl.uint(expect.anything()),
        "total-fees": Cl.uint(expect.anything()),
        "payout-count": Cl.uint(expect.anything()),
      });
    });

    it("returns distribution stats", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-distribution-stats",
        [],
        deployer,
      );
      expect(result.result).toBeTuple({
        "total-distributed": Cl.uint(expect.anything()),
        "total-fees": Cl.uint(expect.anything()),
        "total-payouts": Cl.uint(expect.anything()),
        paused: Cl.bool(false),
      });
    });
  });

  describe("admin functions", () => {
    it("allows admin to pause payouts", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-payouts-paused",
        [Cl.bool(true)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents non-admin from pausing payouts", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-payouts-paused",
        [Cl.bool(true)],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(600));
    });

    // Clarity 4: get-contract-version
    it("returns contract version 4.0.0", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-contract-version",
        [],
        deployer,
      );
      expect(result.result).toBeAscii("4.0.0");
    });

    it("confirms payouts paused status", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-payouts-paused",
        [Cl.bool(true)],
        deployer,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "are-payouts-paused",
        [],
        deployer,
      );
      expect(result.result).toBeBool(true);
    });
  });
});
