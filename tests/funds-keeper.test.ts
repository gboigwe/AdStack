import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const advertiser1 = accounts.get("wallet_1")!;
const publisher1 = accounts.get("wallet_2")!;
const publisher2 = accounts.get("wallet_3")!;
const unauthorized = accounts.get("wallet_4")!;

const CONTRACT = "funds-keeper";
const ONE_STX = 1_000_000;

describe("funds-keeper contract", () => {
  describe("create-escrow", () => {
    it("creates an escrow with valid parameters (admin only)", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-escrow",
        [Cl.uint(1), Cl.principal(advertiser1), Cl.uint(5 * ONE_STX)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects escrow below minimum amount", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-escrow",
        [Cl.uint(2), Cl.principal(advertiser1), Cl.uint(1000)],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(505));
    });

    it("rejects duplicate escrow for same campaign", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-escrow",
        [Cl.uint(10), Cl.principal(advertiser1), Cl.uint(ONE_STX)],
        deployer,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "create-escrow",
        [Cl.uint(10), Cl.principal(advertiser1), Cl.uint(ONE_STX)],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(503));
    });

    it("rejects unauthorized escrow creation", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-escrow",
        [Cl.uint(3), Cl.principal(advertiser1), Cl.uint(ONE_STX)],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(500));
    });
  });

  describe("read-only queries", () => {
    it("returns escrow details after creation", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-escrow",
        [Cl.uint(20), Cl.principal(advertiser1), Cl.uint(3 * ONE_STX)],
        deployer,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-escrow",
        [Cl.uint(20)],
        deployer,
      );
      expect(result.result).not.toBeNone();
    });

    it("returns none for non-existent escrow", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-escrow",
        [Cl.uint(99999)],
        deployer,
      );
      expect(result.result).toBeNone();
    });

    it("returns full balance for new escrow", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-escrow",
        [Cl.uint(21), Cl.principal(advertiser1), Cl.uint(5 * ONE_STX)],
        deployer,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-escrow-balance",
        [Cl.uint(21)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.uint(5 * ONE_STX));
    });

    it("returns platform stats", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-platform-stats",
        [],
        deployer,
      );
      // Should be a tuple with escrowed, released, refunded
      expect(result.result).toBeTuple({
        escrowed: Cl.uint(expect.anything()),
        released: Cl.uint(expect.anything()),
        refunded: Cl.uint(expect.anything()),
      });
    });

    it("returns default publisher release for unseen publisher", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-publisher-release",
        [Cl.uint(1), Cl.principal(publisher1)],
        deployer,
      );
      expect(result.result).toBeTuple({
        "total-released": Cl.uint(0),
        "release-count": Cl.uint(0),
        "last-release-block": Cl.uint(0),
      });
    });
  });

  describe("complete-escrow", () => {
    it("allows admin to complete an active escrow", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-escrow",
        [Cl.uint(30), Cl.principal(advertiser1), Cl.uint(ONE_STX)],
        deployer,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "complete-escrow",
        [Cl.uint(30)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects completing already closed escrow", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-escrow",
        [Cl.uint(31), Cl.principal(advertiser1), Cl.uint(ONE_STX)],
        deployer,
      );
      simnet.callPublicFn(
        CONTRACT,
        "complete-escrow",
        [Cl.uint(31)],
        deployer,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "complete-escrow",
        [Cl.uint(31)],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(504));
    });

    it("rejects unauthorized completion", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-escrow",
        [Cl.uint(32), Cl.principal(advertiser1), Cl.uint(ONE_STX)],
        deployer,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "complete-escrow",
        [Cl.uint(32)],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(500));
    });
  });

  // Clarity 4 specific tests
  describe("Clarity 4: version and platform stats", () => {
    it("returns contract version 4.0.0", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-contract-version",
        [],
        deployer,
      );
      expect(result.result).toBeAscii("4.0.0");
    });

    it("returns platform stats tuple", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-platform-stats",
        [],
        deployer,
      );
      expect(result.result).toBeTuple({
        escrowed: expect.anything(),
        released: expect.anything(),
        refunded: expect.anything(),
      });
    });
  });
});
