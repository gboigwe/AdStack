import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const advertiser1 = accounts.get("wallet_1")!;
const publisher1 = accounts.get("wallet_2")!;
const publisher2 = accounts.get("wallet_3")!;
const unauthorized = accounts.get("wallet_4")!;

const CONTRACT = "partner-hub";

// Status constants matching contract
const STATUS_PENDING = 1;
const STATUS_ACTIVE = 2;
const STATUS_PAUSED = 3;
const STATUS_TERMINATED = 4;

describe("partner-hub contract", () => {
  describe("propose-partnership", () => {
    it("creates a partnership proposal", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "propose-partnership",
        [
          Cl.principal(publisher1),
          Cl.uint(1500), // 15% commission
          Cl.stringAscii("Lets collaborate on tech campaigns"),
        ],
        advertiser1,
      );
      expect(result.result).toBeOk(Cl.uint(0)); // First partnership ID
    });

    it("rejects self-partnership", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "propose-partnership",
        [Cl.principal(advertiser1), Cl.uint(1500), Cl.stringAscii("Self")],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(904));
    });

    it("rejects duplicate partnership", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "propose-partnership",
        [Cl.principal(publisher1), Cl.uint(2000), Cl.stringAscii("Duplicate")],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(902));
    });

    it("rejects commission below minimum (1%)", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "propose-partnership",
        [Cl.principal(publisher2), Cl.uint(50), Cl.stringAscii("Too low")],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(903));
    });

    it("rejects commission above maximum (50%)", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "propose-partnership",
        [Cl.principal(publisher2), Cl.uint(5001), Cl.stringAscii("Too high")],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(903));
    });
  });

  describe("accept-partnership", () => {
    it("allows invited publisher to accept", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "accept-partnership",
        [Cl.uint(0)],
        publisher1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects acceptance from wrong principal", () => {
      // Create a new proposal first
      simnet.callPublicFn(
        CONTRACT,
        "propose-partnership",
        [Cl.principal(publisher2), Cl.uint(2000), Cl.stringAscii("New deal")],
        advertiser1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "accept-partnership",
        [Cl.uint(1)], // The new proposal
        publisher1, // Wrong publisher
      );
      expect(result.result).toBeErr(Cl.uint(900));
    });

    it("rejects accepting an already active partnership", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "accept-partnership",
        [Cl.uint(0)], // Already accepted above
        publisher1,
      );
      expect(result.result).toBeErr(Cl.uint(906));
    });
  });

  describe("pause-partnership", () => {
    it("allows partner to pause", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "pause-partnership",
        [Cl.uint(0)],
        advertiser1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects pause from non-partner", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "pause-partnership",
        [Cl.uint(0)],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(900));
    });

    it("rejects pausing already paused partnership", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "pause-partnership",
        [Cl.uint(0)],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(906));
    });
  });

  describe("resume-partnership", () => {
    it("allows partner to resume", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "resume-partnership",
        [Cl.uint(0)],
        publisher1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects resuming active partnership", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "resume-partnership",
        [Cl.uint(0)],
        publisher1,
      );
      expect(result.result).toBeErr(Cl.uint(906));
    });
  });

  describe("terminate-partnership", () => {
    it("allows partner to terminate", () => {
      // Create and accept a new partnership for termination testing
      simnet.callPublicFn(
        CONTRACT,
        "propose-partnership",
        [Cl.principal(unauthorized), Cl.uint(1000), Cl.stringAscii("To terminate")],
        deployer,
      );
      simnet.callPublicFn(
        CONTRACT,
        "accept-partnership",
        [Cl.uint(2)],
        unauthorized,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "terminate-partnership",
        [Cl.uint(2)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects terminating already terminated", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "terminate-partnership",
        [Cl.uint(2)],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(906));
    });
  });

  describe("campaign enrollment", () => {
    it("allows advertiser to enroll campaign", () => {
      // Partnership 0 is active (resumed above)
      const result = simnet.callPublicFn(
        CONTRACT,
        "enroll-campaign",
        [Cl.uint(0), Cl.uint(1)],
        advertiser1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects enrollment from publisher side", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "enroll-campaign",
        [Cl.uint(0), Cl.uint(2)],
        publisher1,
      );
      expect(result.result).toBeErr(Cl.uint(900));
    });

    it("rejects enrollment in terminated partnership", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "enroll-campaign",
        [Cl.uint(2), Cl.uint(1)],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(905));
    });
  });

  describe("record-activity (admin)", () => {
    it("allows admin to record activity", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-activity",
        [Cl.uint(0), Cl.uint(1), Cl.uint(500), Cl.uint(25000)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects activity from non-admin", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-activity",
        [Cl.uint(0), Cl.uint(1), Cl.uint(100), Cl.uint(5000)],
        advertiser1,
      );
      expect(result.result).toBeErr(Cl.uint(900));
    });
  });

  describe("read-only queries", () => {
    it("returns partnership details", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-partnership",
        [Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeSome(
        Cl.tuple({
          advertiser: Cl.principal(advertiser1),
          publisher: Cl.principal(publisher1),
          "commission-rate": Cl.uint(1500),
          status: Cl.uint(STATUS_ACTIVE),
          "campaigns-shared": Cl.uint(1),
          "total-revenue": Cl.uint(25000),
          "created-at": Cl.uint(expect.anything()),
          "last-activity": Cl.uint(expect.anything()),
        }),
      );
    });

    it("returns none for nonexistent partnership", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-partnership",
        [Cl.uint(999)],
        deployer,
      );
      expect(result.result).toBeNone();
    });

    it("looks up partnership by parties", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-partnership-by-parties",
        [Cl.principal(advertiser1), Cl.principal(publisher1)],
        deployer,
      );
      expect(result.result).toBeSome(expect.anything());
    });

    it("returns none for unpartnered parties", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-partnership-by-parties",
        [Cl.principal(unauthorized), Cl.principal(publisher1)],
        deployer,
      );
      expect(result.result).toBeNone();
    });

    it("reports active partnership status", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "is-partnership-active",
        [Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeBool(true);
    });

    it("reports terminated partnership as inactive", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "is-partnership-active",
        [Cl.uint(2)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });

    it("returns total active partnerships", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-active-partnerships",
        [],
        deployer,
      );
      // Partnership 0 is active, 1 is pending, 2 is terminated
      expect(result.result).toBeUint(1);
    });

    it("returns total partnerships counter", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-partnerships",
        [],
        deployer,
      );
      expect(result.result).toBeUint(3); // 0, 1, 2
    });

    it("returns commission rate for partnership", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-commission-rate",
        [Cl.uint(0)],
        deployer,
      );
      expect(result.result).toBeUint(1500);
    });

    it("returns default commission for nonexistent", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-commission-rate",
        [Cl.uint(999)],
        deployer,
      );
      expect(result.result).toBeUint(1500); // DEFAULT_COMMISSION
    });

    it("returns campaign enrollment", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-campaign-enrollment",
        [Cl.uint(0), Cl.uint(1)],
        deployer,
      );
      expect(result.result).toBeSome(
        Cl.tuple({
          "enrolled-at": Cl.uint(expect.anything()),
          "is-active": Cl.bool(true),
          "views-generated": Cl.uint(500),
          "revenue-earned": Cl.uint(25000),
        }),
      );
    });

    it("returns platform paused status", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "is-platform-paused",
        [],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });
  });

  describe("admin platform pause", () => {
    it("allows admin to pause platform", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-platform-paused",
        [Cl.bool(true)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects proposals when paused", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "propose-partnership",
        [Cl.principal(publisher2), Cl.uint(1500), Cl.stringAscii("Paused")],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(900));
    });

    it("prevents non-admin from unpausing", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-platform-paused",
        [Cl.bool(false)],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(900));
    });

    it("allows admin to unpause", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-platform-paused",
        [Cl.bool(false)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });
  });
});
