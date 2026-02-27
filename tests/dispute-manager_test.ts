import { describe, expect, it, beforeEach } from "vitest";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";

const CONTRACT_NAME = "dispute-manager";

describe("dispute-manager contract tests", () => {
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

  describe("Contract Initialization", () => {
    it("initializes simnet", () => {
      expect(simnet.blockHeight).toBeDefined();
      expect(simnet.blockHeight).toBeGreaterThan(0);
    });

    it("starts with zero total filed", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-filed",
        [],
        deployer
      );
      expect(result).toBeUint(0);
    });

    it("starts with zero total resolved", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-resolved",
        [],
        deployer
      );
      expect(result).toBeUint(0);
    });

    it("starts with case nonce at zero", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-case-nonce",
        [],
        deployer
      );
      expect(result).toBeUint(0);
    });
  });

  describe("Filing Disputes", () => {
    it("allows filing a payment dispute", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(2),
          Cl.uint(5000000),
          Cl.uint(1),
          Cl.stringUtf8("Payment not received for completed campaign"),
          Cl.stringAscii("payment"),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("increments case nonce after filing", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("Test dispute"),
          Cl.stringAscii("general"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-case-nonce",
        [],
        deployer
      );
      expect(result).toBeUint(1);
    });

    it("stores correct case data", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(2),
          Cl.uint(3),
          Cl.uint(10000000),
          Cl.uint(5),
          Cl.stringUtf8("Fraudulent click activity detected"),
          Cl.stringAscii("fraud"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-case",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "claimant": Cl.principal(wallet1),
          "respondent": Cl.principal(wallet2),
          "dispute-type": Cl.uint(2),
          "severity": Cl.uint(3),
          "status": Cl.uint(1),
          "amount": Cl.uint(10000000),
          "campaign-id": Cl.uint(5),
          "description": Cl.stringUtf8("Fraudulent click activity detected"),
          "filed-at": Cl.uint(simnet.blockHeight),
          "last-activity": Cl.uint(simnet.blockHeight),
          "sla-deadline": Cl.uint(simnet.blockHeight + 720),
          "escalation-count": Cl.uint(0),
          "priority": Cl.uint(2),
        })
      );
    });

    it("rejects filing against self", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet1),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("Self dispute"),
          Cl.stringAscii("test"),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(403));
    });

    it("rejects invalid dispute type", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(99),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("Invalid type"),
          Cl.stringAscii("test"),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(401));
    });

    it("rejects invalid severity level", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(99),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("Invalid severity"),
          Cl.stringAscii("test"),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(402));
    });

    it("rejects zero amount", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(0),
          Cl.uint(1),
          Cl.stringUtf8("Zero amount"),
          Cl.stringAscii("test"),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(404));
    });

    it("files multiple disputes with incrementing IDs", () => {
      const { result: r1 } = simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("First dispute"),
          Cl.stringAscii("general"),
        ],
        wallet1
      );
      expect(r1).toBeOk(Cl.uint(1));

      const { result: r2 } = simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet1),
          Cl.uint(2),
          Cl.uint(2),
          Cl.uint(2000000),
          Cl.uint(2),
          Cl.stringUtf8("Second dispute"),
          Cl.stringAscii("fraud"),
        ],
        wallet3
      );
      expect(r2).toBeOk(Cl.uint(2));
    });

    it("updates total filed count", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("Test"),
          Cl.stringAscii("test"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-filed",
        [],
        deployer
      );
      expect(result).toBeUint(1);
    });
  });

  describe("Dispute Lifecycle", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(2),
          Cl.uint(5000000),
          Cl.uint(1),
          Cl.stringUtf8("Lifecycle test dispute"),
          Cl.stringAscii("payment"),
        ],
        wallet1
      );
    });

    it("allows respondent to acknowledge dispute", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "acknowledge-dispute",
        [Cl.uint(1)],
        wallet2
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects acknowledge from non-respondent", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "acknowledge-dispute",
        [Cl.uint(1)],
        wallet3
      );
      expect(result).toBeErr(Cl.uint(406));
    });

    it("allows owner to move to investigation", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "acknowledge-dispute",
        [Cl.uint(1)],
        wallet2
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "move-to-investigation",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects investigation from non-owner", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "acknowledge-dispute",
        [Cl.uint(1)],
        wallet2
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "move-to-investigation",
        [Cl.uint(1)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(400));
    });

    it("allows escalation to arbitration", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "acknowledge-dispute",
        [Cl.uint(1)],
        wallet2
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "move-to-investigation",
        [Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "escalate-to-arbitration",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows resolving a case under investigation", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "acknowledge-dispute",
        [Cl.uint(1)],
        wallet2
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "move-to-investigation",
        [Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "resolve-case",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows dismissing a filed case", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "dismiss-case",
        [Cl.uint(1), Cl.stringUtf8("Insufficient evidence")],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects dismiss from non-owner", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "dismiss-case",
        [Cl.uint(1), Cl.stringUtf8("Not authorized")],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(400));
    });

    it("updates total resolved after resolution", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "acknowledge-dispute",
        [Cl.uint(1)],
        wallet2
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "move-to-investigation",
        [Cl.uint(1)],
        deployer
      );
      simnet.callPublicFn(
        CONTRACT_NAME,
        "resolve-case",
        [Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-resolved",
        [],
        deployer
      );
      expect(result).toBeUint(1);
    });

    it("updates total dismissed after dismissal", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "dismiss-case",
        [Cl.uint(1), Cl.stringUtf8("Invalid claim")],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-total-dismissed",
        [],
        deployer
      );
      expect(result).toBeUint(1);
    });
  });

  describe("Counter-Claims", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(2),
          Cl.uint(5000000),
          Cl.uint(1),
          Cl.stringUtf8("Counter-claim test"),
          Cl.stringAscii("payment"),
        ],
        wallet1
      );
    });

    it("allows respondent to file counter-claim", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "file-counter-claim",
        [Cl.uint(1), Cl.uint(3000000), Cl.stringUtf8("Service was delivered as agreed")],
        wallet2
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects counter-claim from non-respondent", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "file-counter-claim",
        [Cl.uint(1), Cl.uint(3000000), Cl.stringUtf8("Unauthorized counter-claim")],
        wallet3
      );
      expect(result).toBeErr(Cl.uint(406));
    });

    it("stores counter-claim data correctly", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-counter-claim",
        [Cl.uint(1), Cl.uint(4000000), Cl.stringUtf8("Respondent counter-claim text")],
        wallet2
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-counter-claim",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeSome(
        Cl.tuple({
          "counter-claimant": Cl.principal(wallet2),
          "amount": Cl.uint(4000000),
          "description": Cl.stringUtf8("Respondent counter-claim text"),
          "filed-at": Cl.uint(simnet.blockHeight),
          "accepted": Cl.bool(false),
        })
      );
    });
  });

  describe("SLA Management", () => {
    it("allows owner to set default SLA", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-default-sla",
        [Cl.uint(2000)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects SLA change from non-owner", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-default-sla",
        [Cl.uint(2000)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(400));
    });

    it("checks SLA breach status", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("SLA test"),
          Cl.stringAscii("sla"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-sla-breached",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(false));
    });
  });

  describe("Admin Configuration", () => {
    it("allows owner to set minimum dispute amount", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-min-dispute-amount",
        [Cl.uint(500000)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to set max active per party", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-max-active-per-party",
        [Cl.uint(20)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to set filing cooldown", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-filing-cooldown",
        [Cl.uint(100)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects admin config from non-owner", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-min-dispute-amount",
        [Cl.uint(500000)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(400));
    });
  });

  describe("Severity and Priority", () => {
    it("assigns normal priority for low severity", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("Low severity"),
          Cl.stringAscii("test"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-case",
        [Cl.uint(1)],
        deployer
      );

      const caseData = result as any;
      expect(caseData.value?.data?.priority).toEqual(Cl.uint(1));
    });

    it("assigns high priority for critical severity", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(4),
          Cl.uint(50000000),
          Cl.uint(1),
          Cl.stringUtf8("Critical severity dispute"),
          Cl.stringAscii("critical"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-case",
        [Cl.uint(1)],
        deployer
      );

      const caseData = result as any;
      expect(caseData.value?.data?.priority).toEqual(Cl.uint(4));
    });

    it("allows owner to update severity", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("Severity update test"),
          Cl.stringAscii("test"),
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "update-severity",
        [Cl.uint(1), Cl.uint(3)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Timeline Tracking", () => {
    it("records timeline entry on filing", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("Timeline test"),
          Cl.stringAscii("test"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-timeline-entry",
        [Cl.uint(1), Cl.uint(0)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "action": Cl.stringAscii("filed"),
          "actor": Cl.principal(wallet1),
          "timestamp": Cl.uint(simnet.blockHeight),
          "note": Cl.stringUtf8("Dispute filed"),
        })
      );
    });
  });

  describe("Read-Only Queries", () => {
    it("returns none for non-existent case", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-case",
        [Cl.uint(999)],
        deployer
      );
      expect(result).toBeNone();
    });

    it("returns case age", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "file-dispute",
        [
          Cl.principal(wallet2),
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(1),
          Cl.stringUtf8("Age test"),
          Cl.stringAscii("test"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-case-age",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(0));
    });
  });
});
