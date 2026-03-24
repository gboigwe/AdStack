import { describe, it, expect } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const advertiser = accounts.get("wallet_1")!;
const publisher1 = accounts.get("wallet_2")!;
const publisher2 = accounts.get("wallet_3")!;
const unauthorized = accounts.get("wallet_4")!;

const CONTRACT = "audience-selector";

describe("audience-selector contract", () => {
  describe("create-segment", () => {
    it("creates a segment for a campaign", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(1), Cl.stringAscii("Tech Enthusiasts"), Cl.uint(50), Cl.bool(true)],
        advertiser,
      );
      expect(result.result).toBeOk(Cl.uint(0)); // First segment ID
    });

    it("creates a second segment for the same campaign", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(2), Cl.stringAscii("Crypto Traders"), Cl.uint(30), Cl.bool(false)],
        advertiser,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(2), Cl.stringAscii("DeFi Users"), Cl.uint(40), Cl.bool(true)],
        advertiser,
      );
      expect(result.result).toBeOk(Cl.uint(2)); // Third segment overall
    });

    it("rejects empty segment name", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(3), Cl.stringAscii(""), Cl.uint(50), Cl.bool(false)],
        advertiser,
      );
      expect(result.result).toBeErr(Cl.uint(803));
    });

    it("rejects reputation above 100", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(3), Cl.stringAscii("Bad Segment"), Cl.uint(101), Cl.bool(false)],
        advertiser,
      );
      expect(result.result).toBeErr(Cl.uint(803));
    });

    it("enforces max 5 segments per campaign", () => {
      // Create 5 segments for campaign 50
      for (let i = 0; i < 5; i++) {
        const r = simnet.callPublicFn(
          CONTRACT,
          "create-segment",
          [Cl.uint(50), Cl.stringAscii(`Segment ${i}`), Cl.uint(10), Cl.bool(false)],
          advertiser,
        );
        expect(r.result).toBeOk(Cl.uint(expect.anything()));
      }

      // 6th should fail
      const result = simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(50), Cl.stringAscii("One Too Many"), Cl.uint(10), Cl.bool(false)],
        advertiser,
      );
      expect(result.result).toBeErr(Cl.uint(804));
    });
  });

  describe("add-segment-tag", () => {
    it("adds a tag to a segment", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(100), Cl.stringAscii("Tag Test"), Cl.uint(0), Cl.bool(false)],
        advertiser,
      );

      // Get the segment ID from the counter
      const segId = 8; // After all previous creates

      const result = simnet.callPublicFn(
        CONTRACT,
        "add-segment-tag",
        [Cl.uint(segId), Cl.stringAscii("blockchain")],
        advertiser,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects empty tag", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(101), Cl.stringAscii("Empty Tag Test"), Cl.uint(0), Cl.bool(false)],
        advertiser,
      );
      const segId = 9;

      const result = simnet.callPublicFn(
        CONTRACT,
        "add-segment-tag",
        [Cl.uint(segId), Cl.stringAscii("")],
        advertiser,
      );
      expect(result.result).toBeErr(Cl.uint(803));
    });

    it("rejects tag from non-creator non-admin", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(102), Cl.stringAscii("Auth Test"), Cl.uint(0), Cl.bool(false)],
        advertiser,
      );
      const segId = 10;

      const result = simnet.callPublicFn(
        CONTRACT,
        "add-segment-tag",
        [Cl.uint(segId), Cl.stringAscii("nope")],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(800));
    });
  });

  describe("deactivate-segment", () => {
    it("allows creator to deactivate", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(200), Cl.stringAscii("To Deactivate"), Cl.uint(0), Cl.bool(false)],
        advertiser,
      );
      const segId = 11;

      const result = simnet.callPublicFn(
        CONTRACT,
        "deactivate-segment",
        [Cl.uint(segId)],
        advertiser,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents non-creator from deactivating", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(201), Cl.stringAscii("Protected"), Cl.uint(0), Cl.bool(false)],
        advertiser,
      );
      const segId = 12;

      const result = simnet.callPublicFn(
        CONTRACT,
        "deactivate-segment",
        [Cl.uint(segId)],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(800));
    });
  });

  describe("publisher profiles", () => {
    it("registers a publisher profile", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-publisher-profile",
        [
          Cl.stringAscii("technology"),
          Cl.stringAscii("north-america"),
          Cl.stringAscii("en"),
          Cl.uint(50000),
        ],
        publisher1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("updates an existing profile", () => {
      simnet.callPublicFn(
        CONTRACT,
        "set-publisher-profile",
        [Cl.stringAscii("tech"), Cl.stringAscii("us"), Cl.stringAscii("en"), Cl.uint(10000)],
        publisher2,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "set-publisher-profile",
        [Cl.stringAscii("finance"), Cl.stringAscii("eu"), Cl.stringAscii("en"), Cl.uint(25000)],
        publisher2,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects empty category", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "set-publisher-profile",
        [Cl.stringAscii(""), Cl.stringAscii("us"), Cl.stringAscii("en"), Cl.uint(100)],
        publisher1,
      );
      expect(result.result).toBeErr(Cl.uint(803));
    });

    it("adds publisher tag", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-publisher-tag",
        [Cl.stringAscii("web3")],
        publisher1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects tag without profile", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "add-publisher-tag",
        [Cl.stringAscii("orphan-tag")],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(801));
    });
  });

  describe("read-only queries", () => {
    it("returns segment data", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(300), Cl.stringAscii("Readable"), Cl.uint(25), Cl.bool(true)],
        advertiser,
      );
      const segId = 13;

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-segment",
        [Cl.uint(segId)],
        deployer,
      );
      expect(result.result).toBeSome(
        Cl.tuple({
          "campaign-id": Cl.uint(300),
          creator: Cl.principal(advertiser),
          name: Cl.stringAscii("Readable"),
          "min-reputation": Cl.uint(25),
          "require-verified": Cl.bool(true),
          "tag-count": Cl.uint(0),
          "created-at": Cl.uint(expect.anything()),
          "is-active": Cl.bool(true),
        }),
      );
    });

    it("returns campaign segment count", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-campaign-segment-count",
        [Cl.uint(300)],
        deployer,
      );
      expect(result.result).toBeUint(1);
    });

    it("returns publisher profile", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-publisher-profile",
        [Cl.principal(publisher1)],
        deployer,
      );
      expect(result.result).toBeSome(
        Cl.tuple({
          category: Cl.stringAscii("technology"),
          region: Cl.stringAscii("north-america"),
          language: Cl.stringAscii("en"),
          "audience-size": Cl.uint(50000),
          "tag-count": Cl.uint(1),
          "registered-at": Cl.uint(expect.anything()),
          "last-updated": Cl.uint(expect.anything()),
        }),
      );
    });

    it("returns none for unregistered publisher", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-publisher-profile",
        [Cl.principal(unauthorized)],
        deployer,
      );
      expect(result.result).toBeNone();
    });

    it("returns default match score", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-match-score",
        [Cl.uint(0), Cl.principal(publisher1)],
        deployer,
      );
      expect(result.result).toBeTuple({
        score: Cl.uint(0),
        "computed-at": Cl.uint(0),
      });
    });

    it("returns total segments count", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-segments",
        [],
        deployer,
      );
      // Should be > 0 after all the creates above
      expect(Number(result.result.value)).toBeGreaterThan(0);
    });

    it("returns total publisher profiles count", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-total-publisher-profiles",
        [],
        deployer,
      );
      expect(Number(result.result.value)).toBeGreaterThanOrEqual(2);
    });
  });

  describe("match scoring (admin)", () => {
    it("allows admin to record match score", () => {
      // First create a segment
      simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(400), Cl.stringAscii("Scored"), Cl.uint(0), Cl.bool(false)],
        deployer,
      );
      const segId = 14;

      const result = simnet.callPublicFn(
        CONTRACT,
        "record-match-score",
        [Cl.uint(segId), Cl.principal(publisher1), Cl.uint(85)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents non-admin from recording match score", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "record-match-score",
        [Cl.uint(0), Cl.principal(publisher1), Cl.uint(50)],
        unauthorized,
      );
      expect(result.result).toBeErr(Cl.uint(800));
    });

    it("rejects score above 100", () => {
      simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(401), Cl.stringAscii("Bad Score"), Cl.uint(0), Cl.bool(false)],
        deployer,
      );
      const segId = 15;

      const result = simnet.callPublicFn(
        CONTRACT,
        "record-match-score",
        [Cl.uint(segId), Cl.principal(publisher1), Cl.uint(101)],
        deployer,
      );
      expect(result.result).toBeErr(Cl.uint(803));
    });

    it("verifies recorded match score via read-only", () => {
      const segId = 14;
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-match-score",
        [Cl.uint(segId), Cl.principal(publisher1)],
        deployer,
      );
      expect(result.result).toBeTuple({
        score: Cl.uint(85),
        "computed-at": Cl.uint(expect.anything()),
      });
    });
  });

  describe("meets-segment-requirements", () => {
    it("returns true when requirements met", () => {
      // Create segment with min-reputation 50 and require-verified true
      simnet.callPublicFn(
        CONTRACT,
        "create-segment",
        [Cl.uint(500), Cl.stringAscii("Strict"), Cl.uint(50), Cl.bool(true)],
        deployer,
      );
      const segId = 16;

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "meets-segment-requirements",
        [Cl.uint(segId), Cl.principal(publisher1), Cl.uint(75), Cl.bool(true)],
        deployer,
      );
      expect(result.result).toBeBool(true);
    });

    it("returns false when reputation too low", () => {
      const segId = 16;
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "meets-segment-requirements",
        [Cl.uint(segId), Cl.principal(publisher1), Cl.uint(30), Cl.bool(true)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });

    it("returns false when not verified but required", () => {
      const segId = 16;
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "meets-segment-requirements",
        [Cl.uint(segId), Cl.principal(publisher1), Cl.uint(75), Cl.bool(false)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });

    it("returns false for nonexistent segment", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "meets-segment-requirements",
        [Cl.uint(9999), Cl.principal(publisher1), Cl.uint(100), Cl.bool(true)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });
  });
});
