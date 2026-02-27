import { describe, expect, it, beforeEach } from "vitest";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";

const CONTRACT_NAME = "arbitrator-registry";

describe("arbitrator-registry contract tests", () => {
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

  describe("Registration", () => {
    it("allows registering as arbitrator", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("payment-disputes"), Cl.uint(10000000)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("stores arbitrator data correctly", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("fraud-detection"), Cl.uint(20000000)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-arbitrator",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "owner": Cl.principal(wallet1),
          "specialization": Cl.stringAscii("fraud-detection"),
          "tier": Cl.uint(1),
          "status": Cl.uint(1),
          "stake-amount": Cl.uint(20000000),
          "reputation-score": Cl.uint(500),
          "registered-at": Cl.uint(simnet.blockHeight),
          "last-active": Cl.uint(simnet.blockHeight),
        })
      );
    });

    it("rejects duplicate registration", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("general"), Cl.uint(10000000)],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("general"), Cl.uint(10000000)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(501));
    });

    it("rejects registration below minimum stake", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("test"), Cl.uint(100)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(502));
    });

    it("initializes performance record", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("general"), Cl.uint(10000000)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-arbitrator-performance",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "cases-completed": Cl.uint(0),
          "cases-active": Cl.uint(0),
          "favorable-rulings": Cl.uint(0),
          "overturned-count": Cl.uint(0),
          "avg-resolution-time": Cl.uint(0),
          "total-rewards-earned": Cl.uint(0),
        })
      );
    });
  });

  describe("Profile Management", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("payment-disputes"), Cl.uint(10000000)],
        wallet1
      );
    });

    it("allows updating profile specialization", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "update-profile",
        [Cl.stringAscii("fraud-and-payment")],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects profile update from unregistered user", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "update-profile",
        [Cl.stringAscii("new-spec")],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(500));
    });
  });

  describe("Case Assignment", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("payment-disputes"), Cl.uint(10000000)],
        wallet1
      );
    });

    it("allows owner to assign case to arbitrator", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "assign-case",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects assignment from non-owner", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "assign-case",
        [Cl.uint(1), Cl.principal(wallet1)],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(503));
    });

    it("rejects assignment to unregistered arbitrator", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "assign-case",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(500));
    });

    it("allows arbitrator to accept assignment", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "assign-case",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "accept-assignment",
        [Cl.uint(1)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects accept from wrong arbitrator", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "assign-case",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "accept-assignment",
        [Cl.uint(1)],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(506));
    });

    it("stores assignment data", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "assign-case",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-case-assignment",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "arbitrator": Cl.principal(wallet1),
          "assigned-at": Cl.uint(simnet.blockHeight),
          "accepted": Cl.bool(false),
          "completed": Cl.bool(false),
          "completion-block": Cl.uint(0),
        })
      );
    });
  });

  describe("Case Completion and Rating", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("general"), Cl.uint(10000000)],
        wallet1
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "assign-case",
        [Cl.uint(1), Cl.principal(wallet1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "accept-assignment",
        [Cl.uint(1)],
        wallet1
      );
    });

    it("allows owner to mark case as complete", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "complete-case",
        [Cl.uint(1), Cl.bool(true)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows rating after case completion", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "complete-case",
        [Cl.uint(1), Cl.bool(true)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "rate-arbitrator",
        [
          Cl.principal(wallet1),
          Cl.uint(1),
          Cl.uint(8),
          Cl.stringUtf8("Fair and thorough judgment"),
        ],
        wallet2
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects rating with invalid score", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "complete-case",
        [Cl.uint(1), Cl.bool(true)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "rate-arbitrator",
        [
          Cl.principal(wallet1),
          Cl.uint(1),
          Cl.uint(15),
          Cl.stringUtf8("Invalid score"),
        ],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(509));
    });
  });

  describe("Tier and Reputation", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("general"), Cl.uint(10000000)],
        wallet1
      );
    });

    it("starts at junior tier", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-arbitrator-tier",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("checks arbitrator availability", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-arbitrator-available",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Suspension and Reactivation", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("general"), Cl.uint(10000000)],
        wallet1
      );
    });

    it("allows owner to suspend arbitrator", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "suspend-arbitrator",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("marks suspended arbitrator unavailable", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "suspend-arbitrator",
        [Cl.principal(wallet1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-arbitrator-available",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(false));
    });

    it("allows owner to reactivate arbitrator", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "suspend-arbitrator",
        [Cl.principal(wallet1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "reactivate-arbitrator",
        [Cl.principal(wallet1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects suspension from non-owner", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "suspend-arbitrator",
        [Cl.principal(wallet1)],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(503));
    });
  });

  describe("Stake Slashing", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "register-arbitrator",
        [Cl.stringAscii("general"), Cl.uint(10000000)],
        wallet1
      );
    });

    it("allows owner to slash stake", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "slash-stake",
        [Cl.principal(wallet1), Cl.uint(2000000)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects slash from non-owner", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "slash-stake",
        [Cl.principal(wallet1), Cl.uint(2000000)],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(503));
    });

    it("rejects slash exceeding stake", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "slash-stake",
        [Cl.principal(wallet1), Cl.uint(999000000)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(511));
    });
  });

  describe("Admin Configuration", () => {
    it("allows owner to set minimum stake", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-min-stake",
        [Cl.uint(5000000)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to set max concurrent cases", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-max-concurrent-cases",
        [Cl.uint(10)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to set base reward rate", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-base-reward-rate",
        [Cl.uint(30)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects admin config from non-owner", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-min-stake",
        [Cl.uint(5000000)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(503));
    });
  });
});
