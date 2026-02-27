import { describe, expect, it, beforeEach } from "vitest";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";

const EVIDENCE_CONTRACT = "evidence-vault";
const JUDGMENT_CONTRACT = "judgment-executor";

describe("evidence-vault contract tests", () => {
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

  describe("Evidence Submission", () => {
    it("allows submitting evidence for a case", () => {
      const hash = new Uint8Array(32).fill(0xab);
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.buffer(hash),
          Cl.stringAscii("QmTestCID123456789"),
          Cl.uint(1024),
          Cl.uint(1),
          Cl.stringUtf8("Screenshot of failed payment"),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("increments evidence IDs", () => {
      const hash1 = new Uint8Array(32).fill(0x01);
      const hash2 = new Uint8Array(32).fill(0x02);

      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.buffer(hash1),
          Cl.stringAscii("QmFirst"),
          Cl.uint(512),
          Cl.uint(1),
          Cl.stringUtf8("First evidence"),
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(2),
          Cl.buffer(hash2),
          Cl.stringAscii("QmSecond"),
          Cl.uint(2048),
          Cl.uint(2),
          Cl.stringUtf8("Second evidence"),
        ],
        wallet2
      );
      expect(result).toBeOk(Cl.uint(2));
    });

    it("stores evidence metadata", () => {
      const hash = new Uint8Array(32).fill(0xcd);
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(5),
          Cl.uint(3),
          Cl.buffer(hash),
          Cl.stringAscii("QmMetadataTest"),
          Cl.uint(4096),
          Cl.uint(2),
          Cl.stringUtf8("Communication log export"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        EVIDENCE_CONTRACT,
        "get-evidence",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "case-id": Cl.uint(5),
          "submitter": Cl.principal(wallet1),
          "evidence-type": Cl.uint(3),
          "content-hash": Cl.buffer(hash),
          "ipfs-cid": Cl.stringAscii("QmMetadataTest"),
          "file-size": Cl.uint(4096),
          "access-level": Cl.uint(2),
          "description": Cl.stringUtf8("Communication log export"),
          "submitted-at": Cl.uint(simnet.blockHeight),
          "verified": Cl.bool(false),
          "verified-by": Cl.principal(deployer),
        })
      );
    });

    it("rejects invalid evidence type", () => {
      const hash = new Uint8Array(32).fill(0x00);
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(99),
          Cl.buffer(hash),
          Cl.stringAscii("QmBad"),
          Cl.uint(100),
          Cl.uint(1),
          Cl.stringUtf8("Invalid type"),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(602));
    });

    it("rejects invalid access level", () => {
      const hash = new Uint8Array(32).fill(0x00);
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.buffer(hash),
          Cl.stringAscii("QmBad"),
          Cl.uint(100),
          Cl.uint(99),
          Cl.stringUtf8("Invalid access"),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(603));
    });

    it("tracks case evidence count", () => {
      const hash = new Uint8Array(32).fill(0x11);
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(3),
          Cl.uint(1),
          Cl.buffer(hash),
          Cl.stringAscii("QmCount1"),
          Cl.uint(100),
          Cl.uint(1),
          Cl.stringUtf8("Evidence 1"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        EVIDENCE_CONTRACT,
        "get-case-evidence-index",
        [Cl.uint(3)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "total-items": Cl.uint(1),
          "last-submitted-at": Cl.uint(simnet.blockHeight),
        })
      );
    });
  });

  describe("Evidence Verification", () => {
    beforeEach(() => {
      const hash = new Uint8Array(32).fill(0xaa);
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.buffer(hash),
          Cl.stringAscii("QmVerify"),
          Cl.uint(512),
          Cl.uint(1),
          Cl.stringUtf8("Evidence to verify"),
        ],
        wallet1
      );
    });

    it("allows owner to verify evidence", () => {
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "verify-evidence",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects verification from non-owner", () => {
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "verify-evidence",
        [Cl.uint(1)],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(600));
    });

    it("rejects verification of non-existent evidence", () => {
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "verify-evidence",
        [Cl.uint(999)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(601));
    });
  });

  describe("Access Control", () => {
    beforeEach(() => {
      const hash = new Uint8Array(32).fill(0xbb);
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.buffer(hash),
          Cl.stringAscii("QmAccess"),
          Cl.uint(256),
          Cl.uint(1),
          Cl.stringUtf8("Access control test"),
        ],
        wallet1
      );
    });

    it("allows granting access to evidence", () => {
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "grant-access",
        [Cl.uint(1), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("confirms access after grant", () => {
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "grant-access",
        [Cl.uint(1), Cl.principal(wallet2)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        EVIDENCE_CONTRACT,
        "has-access",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows revoking access", () => {
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "grant-access",
        [Cl.uint(1), Cl.principal(wallet2)],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "revoke-access",
        [Cl.uint(1), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Case Sealing", () => {
    beforeEach(() => {
      const hash = new Uint8Array(32).fill(0xcc);
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.buffer(hash),
          Cl.stringAscii("QmSeal"),
          Cl.uint(512),
          Cl.uint(1),
          Cl.stringUtf8("Seal test evidence"),
        ],
        wallet1
      );
    });

    it("allows owner to seal case evidence", () => {
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "seal-case-evidence",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("confirms sealed status", () => {
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "seal-case-evidence",
        [Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        EVIDENCE_CONTRACT,
        "is-case-sealed",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents new evidence on sealed case", () => {
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "seal-case-evidence",
        [Cl.uint(1)],
        deployer
      );

      const hash2 = new Uint8Array(32).fill(0xdd);
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.buffer(hash2),
          Cl.stringAscii("QmBlocked"),
          Cl.uint(100),
          Cl.uint(1),
          Cl.stringUtf8("Should be rejected"),
        ],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(607));
    });

    it("allows owner to unseal case", () => {
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "seal-case-evidence",
        [Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "unseal-case-evidence",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Evidence Challenges", () => {
    beforeEach(() => {
      const hash = new Uint8Array(32).fill(0xee);
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.buffer(hash),
          Cl.stringAscii("QmChallenge"),
          Cl.uint(512),
          Cl.uint(1),
          Cl.stringUtf8("Challengeable evidence"),
        ],
        wallet1
      );
    });

    it("allows challenging evidence", () => {
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "challenge-evidence",
        [Cl.uint(1), Cl.stringUtf8("Evidence appears tampered")],
        wallet2
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows resolving challenge", () => {
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "challenge-evidence",
        [Cl.uint(1), Cl.stringUtf8("Suspicious metadata")],
        wallet2
      );

      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "resolve-challenge",
        [Cl.uint(1), Cl.bool(false)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Integrity Checkpoints", () => {
    beforeEach(() => {
      const hash = new Uint8Array(32).fill(0xff);
      simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "submit-evidence",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.buffer(hash),
          Cl.stringAscii("QmCheckpoint"),
          Cl.uint(512),
          Cl.uint(1),
          Cl.stringUtf8("Checkpoint evidence"),
        ],
        wallet1
      );
    });

    it("allows creating integrity checkpoint", () => {
      const checkpointHash = new Uint8Array(32).fill(0x99);
      const { result } = simnet.callPublicFn(
        EVIDENCE_CONTRACT,
        "create-integrity-checkpoint",
        [Cl.uint(1), Cl.buffer(checkpointHash)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });
  });
});

describe("judgment-executor contract tests", () => {
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

  describe("Issuing Judgments", () => {
    it("allows owner to issue judgment", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "issue-judgment",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(4000000),
          Cl.uint(500000),
          Cl.uint(500000),
          Cl.stringUtf8("Claimant provided sufficient evidence of non-payment"),
          Cl.uint(1),
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("stores judgment data correctly", () => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "issue-judgment",
        [
          Cl.uint(5),
          Cl.uint(3),
          Cl.uint(2500000),
          Cl.uint(2500000),
          Cl.uint(250000),
          Cl.stringUtf8("Split decision due to shared responsibility"),
          Cl.uint(0),
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        JUDGMENT_CONTRACT,
        "get-judgment",
        [Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "judgment-id": Cl.uint(1),
          "case-id": Cl.uint(5),
          "arbitrator": Cl.principal(deployer),
          "outcome": Cl.uint(3),
          "claimant-award": Cl.uint(2500000),
          "respondent-award": Cl.uint(2500000),
          "arbitrator-fee": Cl.uint(250000),
          "reasoning": Cl.stringUtf8("Split decision due to shared responsibility"),
          "penalty-level": Cl.uint(0),
          "issued-at": Cl.uint(simnet.blockHeight),
          "executed": Cl.bool(false),
          "finalized": Cl.bool(false),
        })
      );
    });

    it("rejects judgment from non-owner", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "issue-judgment",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(0),
          Cl.uint(100000),
          Cl.stringUtf8("Unauthorized"),
          Cl.uint(0),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(700));
    });

    it("rejects invalid outcome", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "issue-judgment",
        [
          Cl.uint(1),
          Cl.uint(99),
          Cl.uint(1000000),
          Cl.uint(0),
          Cl.uint(100000),
          Cl.stringUtf8("Bad outcome"),
          Cl.uint(0),
        ],
        deployer
      );
      expect(result).toBeErr(Cl.uint(701));
    });

    it("maps judgment to case", () => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "issue-judgment",
        [
          Cl.uint(7),
          Cl.uint(2),
          Cl.uint(0),
          Cl.uint(5000000),
          Cl.uint(300000),
          Cl.stringUtf8("Respondent case upheld"),
          Cl.uint(2),
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        JUDGMENT_CONTRACT,
        "get-judgment-by-case",
        [Cl.uint(7)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "judgment-id": Cl.uint(1),
        })
      );
    });
  });

  describe("Judgment Execution", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "issue-judgment",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(4000000),
          Cl.uint(500000),
          Cl.uint(500000),
          Cl.stringUtf8("Execute test"),
          Cl.uint(0),
        ],
        deployer
      );
    });

    it("allows owner to execute judgment", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "execute-judgment",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects double execution", () => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "execute-judgment",
        [Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "execute-judgment",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeErr(Cl.uint(704));
    });

    it("allows finalizing after execution", () => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "execute-judgment",
        [Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "finalize-judgment",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Appeals", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "issue-judgment",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.uint(3000000),
          Cl.uint(1000000),
          Cl.uint(500000),
          Cl.stringUtf8("Appeal test judgment"),
          Cl.uint(1),
        ],
        deployer
      );
    });

    it("allows filing an appeal", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "file-appeal",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("New evidence discovered that contradicts the ruling"),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("stores appeal data", () => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "file-appeal",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Procedural error in evidence review"),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        JUDGMENT_CONTRACT,
        "get-appeal",
        [Cl.uint(1), Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "appellant": Cl.principal(wallet1),
          "case-id": Cl.uint(1),
          "appeal-round": Cl.uint(1),
          "grounds": Cl.stringUtf8("Procedural error in evidence review"),
          "status": Cl.uint(1),
          "filed-at": Cl.uint(simnet.blockHeight),
          "decided-at": Cl.uint(0),
          "decision-reason": Cl.stringUtf8(""),
        })
      );
    });

    it("allows deciding appeal as granted", () => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "file-appeal",
        [Cl.uint(1), Cl.uint(1), Cl.stringUtf8("Grounds for appeal")],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "decide-appeal",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.bool(true),
          Cl.stringUtf8("New evidence warrants reconsideration"),
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows deciding appeal as denied", () => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "file-appeal",
        [Cl.uint(1), Cl.uint(1), Cl.stringUtf8("Appeal grounds")],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "decide-appeal",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.bool(false),
          Cl.stringUtf8("Original judgment stands, no new evidence"),
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("checks appeal eligibility", () => {
      const { result } = simnet.callReadOnlyFn(
        JUDGMENT_CONTRACT,
        "can-appeal-judgment",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("denies appeal after finalization", () => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "execute-judgment",
        [Cl.uint(1)],
        deployer
      );
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "finalize-judgment",
        [Cl.uint(1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        JUDGMENT_CONTRACT,
        "can-appeal-judgment",
        [Cl.uint(1)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(false));
    });
  });

  describe("Settlement Offers", () => {
    it("allows making a settlement offer", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "offer-settlement",
        [
          Cl.uint(1),
          Cl.uint(3000000),
          Cl.uint(2000000),
          Cl.stringUtf8("50-50 split proposed"),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows accepting a settlement", () => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "offer-settlement",
        [
          Cl.uint(1),
          Cl.uint(3000000),
          Cl.uint(2000000),
          Cl.stringUtf8("Settlement terms"),
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "accept-settlement",
        [Cl.uint(1)],
        wallet2
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Penalty Ledger", () => {
    it("allows applying penalties", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "apply-penalty",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(2)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects penalty from non-owner", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "apply-penalty",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1)],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(700));
    });

    it("stores penalty data", () => {
      simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "apply-penalty",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(3)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        JUDGMENT_CONTRACT,
        "get-penalty-ledger",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "total-penalties": Cl.uint(1),
          "highest-penalty": Cl.uint(3),
          "last-penalty-at": Cl.uint(simnet.blockHeight),
          "banned": Cl.bool(false),
        })
      );
    });
  });

  describe("Admin Configuration", () => {
    it("allows owner to set appeal window", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "set-appeal-window",
        [Cl.uint(2880)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to set max appeal rounds", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "set-max-appeal-rounds",
        [Cl.uint(5)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to set default split ratio", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "set-default-split-ratio",
        [Cl.uint(60)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects admin config from non-owner", () => {
      const { result } = simnet.callPublicFn(
        JUDGMENT_CONTRACT,
        "set-appeal-window",
        [Cl.uint(5000)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(700));
    });
  });
});
