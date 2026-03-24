import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const proposer1 = accounts.get("wallet_1")!;
const voter1 = accounts.get("wallet_2")!;
const voter2 = accounts.get("wallet_3")!;
const voter3 = accounts.get("wallet_4")!;
const nonAdmin = accounts.get("wallet_5")!;

const CONTRACT = "vote-handler";
const MIN_DURATION = 144;
const MAX_DURATION = 4320;

describe("vote-handler contract", () => {
  describe("create-proposal", () => {
    it("creates a proposal with valid parameters", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Reduce platform fee"),
          Cl.stringAscii("Lower the platform fee from 5% to 3% for publishers"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );
      expect(result.result).toBeOk(Cl.uint(0));
    });

    it("rejects empty title", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii(""),
          Cl.stringAscii("Some description"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );
      expect(result.result).toBeErr(Cl.uint(404));
    });

    it("rejects empty description", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Valid Title"),
          Cl.stringAscii(""),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );
      expect(result.result).toBeErr(Cl.uint(405));
    });

    it("rejects duration below minimum", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Short Vote"),
          Cl.stringAscii("Too short duration"),
          Cl.uint(10),
        ],
        proposer1,
      );
      expect(result.result).toBeErr(Cl.uint(406));
    });

    it("rejects duration above maximum", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Long Vote"),
          Cl.stringAscii("Too long duration"),
          Cl.uint(MAX_DURATION + 1),
        ],
        proposer1,
      );
      expect(result.result).toBeErr(Cl.uint(406));
    });

    it("increments proposal count", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Count Test"),
          Cl.stringAscii("Testing counter"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );

      const count = simnet.callReadOnlyFn(
        CONTRACT,
        "get-proposal-count",
        [],
        deployer,
      );
      expect(Number(Cl.deserialize(Cl.serialize(count.result)))).toBeGreaterThanOrEqual(1);
    });
  });

  describe("cast-vote", () => {
    it("allows voting in favor", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Vote For Test"),
          Cl.stringAscii("Test voting"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "cast-vote",
        [Cl.uint(0), Cl.bool(true)],
        voter1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("allows voting against", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Vote Against Test"),
          Cl.stringAscii("Test voting against"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "cast-vote",
        [Cl.uint(0), Cl.bool(false)],
        voter2,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents double voting", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Double Vote Test"),
          Cl.stringAscii("Prevent double voting"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );

      simnet.callPublicFn(
        CONTRACT,
        "cast-vote",
        [Cl.uint(0), Cl.bool(true)],
        voter1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "cast-vote",
        [Cl.uint(0), Cl.bool(false)],
        voter1,
      );
      expect(result.result).toBeErr(Cl.uint(402));
    });

    it("rejects vote on non-existent proposal", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "cast-vote",
        [Cl.uint(99999), Cl.bool(true)],
        voter1,
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });
  });

  describe("read-only queries", () => {
    it("returns has-voted false before voting", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("HasVoted Test"),
          Cl.stringAscii("Check has-voted"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "has-voted",
        [Cl.uint(0), Cl.principal(voter1)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });

    it("returns has-voted true after voting", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("HasVoted After"),
          Cl.stringAscii("Check has-voted after"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );

      simnet.callPublicFn(
        CONTRACT,
        "cast-vote",
        [Cl.uint(0), Cl.bool(true)],
        voter1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "has-voted",
        [Cl.uint(0), Cl.principal(voter1)],
        deployer,
      );
      expect(result.result).toBeBool(true);
    });

    it("returns proposal status", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Status Check"),
          Cl.stringAscii("Check status"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-proposal-status",
        [Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.uint(1)); // STATUS_ACTIVE
    });

    it("returns error for non-existent proposal status", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-proposal-status",
        [Cl.uint(99999)],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(401));
    });
  });

  describe("cancel-proposal", () => {
    it("allows proposer to cancel their proposal", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Cancel Me"),
          Cl.stringAscii("To be cancelled"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "cancel-proposal",
        [Cl.uint(0)],
        proposer1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("allows admin to cancel any proposal", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Admin Cancel"),
          Cl.stringAscii("Admin can cancel"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "cancel-proposal",
        [Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents non-proposer non-admin from cancelling", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Cannot Cancel"),
          Cl.stringAscii("Others cannot cancel"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "cancel-proposal",
        [Cl.uint(0)],
        voter1,
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });
  });

  describe("admin functions", () => {
    it("allows admin to pause governance", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-governance-paused",
        [Cl.bool(true)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents non-admin from pausing governance", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-governance-paused",
        [Cl.bool(true)],
        nonAdmin,
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });

    it("blocks proposal creation when paused", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-governance-paused",
        [Cl.bool(true)],
        deployer,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "create-proposal",
        [
          Cl.stringAscii("Paused Create"),
          Cl.stringAscii("Should fail"),
          Cl.uint(MIN_DURATION),
        ],
        proposer1,
      );
      expect(result.result).toBeErr(Cl.uint(400));
    });
  });
});
