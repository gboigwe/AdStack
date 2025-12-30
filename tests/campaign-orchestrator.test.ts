
import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const advertiser = accounts.get("wallet_1")!;
const publisher1 = accounts.get("wallet_2")!;
const publisher2 = accounts.get("wallet_3")!;
const publisher3 = accounts.get("wallet_4")!;

const contractName = "campaign-orchestrator";

// Helper to extract response values
function getResponseOk(result: any) {
  if (result.result.type === 7) { // ResponseOk
    return result.result.value;
  }
  throw new Error(`Expected ResponseOk, got ${result.result.type}`);
}

function getResponseErr(result: any) {
  if (result.result.type === 8) { // ResponseErr
    return result.result.value;
  }
  throw new Error(`Expected ResponseErr, got ${result.result.type}`);
}

// ════════════════════════════════════════════════════════════════════════════
// SETUP AND SINGLE OPERATIONS
// ════════════════════════════════════════════════════════════════════════════

describe("AdStack Campaign Orchestrator - Bulk Operations Tests", () => {

  beforeEach(() => {
    // Initialize campaign types for testing
    // Note: In a real implementation, these would be set up by the contract owner
    // For testing purposes, we'll assume campaign type 1 exists
  });

  describe("Single Campaign Creation", () => {
    it("should create a campaign successfully", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "create-campaign",
        [
          Cl.uint(1), // campaign-type
          Cl.uint(1000000), // budget
          Cl.uint(10000), // cost-per-view
          Cl.uint(100), // duration
          Cl.uint(50), // target-views
          Cl.uint(10), // daily-view-limit
          Cl.none(), // targeting-data
          Cl.bool(true) // refundable
        ],
        advertiser
      );

      expect(result).toBeOk(Cl.uint(1)); // First campaign ID
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // BULK CAMPAIGN CREATION TESTS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Bulk Campaign Creation", () => {
    it("should bulk create campaigns successfully", () => {
      const campaigns = [
        {
          campaignType: 1,
          budget: 1000000,
          costPerView: 10000,
          duration: 100,
          targetViews: 50,
          dailyViewLimit: 10,
          targetingData: null,
          refundable: true
        },
        {
          campaignType: 1,
          budget: 2000000,
          costPerView: 15000,
          duration: 150,
          targetViews: 75,
          dailyViewLimit: 15,
          targetingData: null,
          refundable: false
        }
      ];

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-create-campaigns",
        [Cl.list(campaigns.map(c => Cl.tuple({
          'campaign-type': Cl.uint(c.campaignType),
          'budget': Cl.uint(c.budget),
          'cost-per-view': Cl.uint(c.costPerView),
          'duration': Cl.uint(c.duration),
          'target-views': Cl.uint(c.targetViews),
          'daily-view-limit': Cl.uint(c.dailyViewLimit),
          'targeting-data': c.targetingData ? Cl.some(Cl.stringUtf8(c.targetingData)) : Cl.none(),
          'refundable': Cl.bool(c.refundable)
        })))],
        advertiser
      );

      expect(result).toBeOk(Cl.tuple({
        "total-campaigns": Cl.uint(2),
        results: Cl.list([
          Cl.tuple({
            "campaign-id": Cl.uint(1),
            "platform-fee": Cl.uint(20000), // 2% of 1000000
            "start-height": Cl.uint(simnet.blockHeight),
            "end-height": Cl.uint(simnet.blockHeight + 100)
          }),
          Cl.tuple({
            "campaign-id": Cl.uint(2),
            "platform-fee": Cl.uint(40000), // 2% of 2000000
            "start-height": Cl.uint(simnet.blockHeight),
            "end-height": Cl.uint(simnet.blockHeight + 150)
          })
        ])
      }));
    });

    it("should handle maximum bulk campaigns (5 campaigns)", () => {
      const campaigns = Array.from({length: 5}, (_, i) => ({
        campaignType: 1,
        budget: 500000,
        costPerView: 5000,
        duration: 50,
        targetViews: 25,
        dailyViewLimit: 5,
        targetingData: null,
        refundable: i % 2 === 0
      }));

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-create-campaigns",
        [Cl.list(campaigns.map(c => Cl.tuple({
          'campaign-type': Cl.uint(c.campaignType),
          'budget': Cl.uint(c.budget),
          'cost-per-view': Cl.uint(c.costPerView),
          'duration': Cl.uint(c.duration),
          'target-views': Cl.uint(c.targetViews),
          'daily-view-limit': Cl.uint(c.dailyViewLimit),
          'targeting-data': c.targetingData ? Cl.some(Cl.stringUtf8(c.targetingData)) : Cl.none(),
          'refundable': Cl.bool(c.refundable)
        })))],
        advertiser
      );

      expect(result).toBeOk(Cl.tuple({
        "total-campaigns": Cl.uint(5),
        results: Cl.list(campaigns.map((_, i) => Cl.tuple({
          "campaign-id": Cl.uint(i + 1),
          "platform-fee": Cl.uint(10000), // 2% of 500000
          "start-height": Cl.uint(simnet.blockHeight),
          "end-height": Cl.uint(simnet.blockHeight + 50)
        })))
      }));
    });

    it("should reject bulk campaign creation with empty list", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-create-campaigns",
        [Cl.list([])],
        advertiser
      );

      expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_PARAMS
    });

    it("should validate each campaign individually in bulk creation", () => {
      const campaigns = [
        {
          campaignType: 1,
          budget: 1000000,
          costPerView: 10000,
          duration: 100,
          targetViews: 50,
          dailyViewLimit: 10,
          targetingData: null,
          refundable: true
        },
        {
          campaignType: 999, // Invalid campaign type
          budget: 500000,
          costPerView: 5000,
          duration: 50,
          targetViews: 25,
          dailyViewLimit: 5,
          targetingData: null,
          refundable: false
        }
      ];

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-create-campaigns",
        [Cl.list(campaigns.map(c => Cl.tuple({
          'campaign-type': Cl.uint(c.campaignType),
          'budget': Cl.uint(c.budget),
          'cost-per-view': Cl.uint(c.costPerView),
          'duration': Cl.uint(c.duration),
          'target-views': Cl.uint(c.targetViews),
          'daily-view-limit': Cl.uint(c.dailyViewLimit),
          'targeting-data': c.targetingData ? Cl.some(Cl.stringUtf8(c.targetingData)) : Cl.none(),
          'refundable': Cl.bool(c.refundable)
        })))],
        advertiser
      );

      expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_PARAMS from invalid campaign type
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // BULK VIEW RECORDING TESTS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Bulk View Recording", () => {
    beforeEach(() => {
      // Create campaigns and verify publishers
      simnet.callPublicFn(
        contractName,
        "create-campaign",
        [
          Cl.uint(1),
          Cl.uint(1000000),
          Cl.uint(10000),
          Cl.uint(100),
          Cl.uint(50),
          Cl.uint(10),
          Cl.none(),
          Cl.bool(true)
        ],
        advertiser
      );

      simnet.callPublicFn(
        contractName,
        "create-campaign",
        [
          Cl.uint(1),
          Cl.uint(2000000),
          Cl.uint(15000),
          Cl.uint(150),
          Cl.uint(75),
          Cl.uint(15),
          Cl.none(),
          Cl.bool(false)
        ],
        advertiser
      );

      // Verify publishers
      simnet.callPublicFn(contractName, "verify-publisher", [Cl.principal(publisher1), Cl.uint(80)], deployer);
      simnet.callPublicFn(contractName, "verify-publisher", [Cl.principal(publisher2), Cl.uint(90)], deployer);
      simnet.callPublicFn(contractName, "verify-publisher", [Cl.principal(publisher3), Cl.uint(85)], deployer);
    });

    it("should bulk record views successfully", () => {
      const views = [
        { campaignId: 1, publisher: publisher1, viewProof: null },
        { campaignId: 1, publisher: publisher2, viewProof: null },
        { campaignId: 2, publisher: publisher3, viewProof: null }
      ];

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-record-views",
        [Cl.list(views.map(v => Cl.tuple({
          'campaign-id': Cl.uint(v.campaignId),
          'publisher': Cl.principal(v.publisher),
          'view-proof': v.viewProof ? Cl.some(Cl.buff(v.viewProof)) : Cl.none()
        })))],
        deployer
      );

      expect(result).toBeOk(Cl.tuple({
        "total-views": Cl.uint(3),
        results: Cl.list([
          Cl.tuple({
            "campaign-id": Cl.uint(1),
            "publisher": Cl.principal(publisher1),
            "amount-paid": Cl.uint(10000),
            "timestamp": Cl.uint(simnet.blockHeight)
          }),
          Cl.tuple({
            "campaign-id": Cl.uint(1),
            "publisher": Cl.principal(publisher2),
            "amount-paid": Cl.uint(10000),
            "timestamp": Cl.uint(simnet.blockHeight)
          }),
          Cl.tuple({
            "campaign-id": Cl.uint(2),
            "publisher": Cl.principal(publisher3),
            "amount-paid": Cl.uint(15000),
            "timestamp": Cl.uint(simnet.blockHeight)
          })
        ])
      }));
    });

    it("should handle maximum bulk views (10 views)", () => {
      const views = Array.from({length: 10}, (_, i) => ({
        campaignId: (i % 2) + 1, // Alternate between campaign 1 and 2
        publisher: [publisher1, publisher2, publisher3][i % 3],
        viewProof: null
      }));

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-record-views",
        [Cl.list(views.map(v => Cl.tuple({
          'campaign-id': Cl.uint(v.campaignId),
          'publisher': Cl.principal(v.publisher),
          'view-proof': v.viewProof ? Cl.some(Cl.buff(v.viewProof)) : Cl.none()
        })))],
        deployer
      );

      expect(result).toBeOk(Cl.tuple({
        "total-views": Cl.uint(10),
        results: Cl.list(views.map(v => Cl.tuple({
          "campaign-id": Cl.uint(v.campaignId),
          "publisher": Cl.principal(v.publisher),
          "amount-paid": Cl.uint(v.campaignId === 1 ? 10000 : 15000),
          "timestamp": Cl.uint(simnet.blockHeight)
        })))
      }));
    });

    it("should reject bulk view recording with empty list", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-record-views",
        [Cl.list([])],
        deployer
      );

      expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_PARAMS
    });

    it("should validate each view individually in bulk recording", () => {
      const views = [
        { campaignId: 1, publisher: publisher1, viewProof: null }, // Valid
        { campaignId: 999, publisher: publisher2, viewProof: null } // Invalid campaign
      ];

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-record-views",
        [Cl.list(views.map(v => Cl.tuple({
          'campaign-id': Cl.uint(v.campaignId),
          'publisher': Cl.principal(v.publisher),
          'view-proof': v.viewProof ? Cl.some(Cl.buff(v.viewProof)) : Cl.none()
        })))],
        deployer
      );

      expect(result).toBeErr(Cl.uint(404)); // ERR_NOT_FOUND for invalid campaign
    });

    it("should reject bulk views for unverified publishers", () => {
      const unverifiedPublisher = accounts.get("wallet_5")!;
      const views = [
        { campaignId: 1, publisher: unverifiedPublisher, viewProof: null }
      ];

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-record-views",
        [Cl.list(views.map(v => Cl.tuple({
          'campaign-id': Cl.uint(v.campaignId),
          'publisher': Cl.principal(v.publisher),
          'view-proof': v.viewProof ? Cl.some(Cl.buff(v.viewProof)) : Cl.none()
        })))],
        deployer
      );

      expect(result).toBeErr(Cl.uint(407)); // ERR_PUBLISHER_NOT-VERIFIED
    });

    it("should enforce daily view limits in bulk operations", () => {
      // Record views up to the daily limit for campaign 1
      const maxViews = 10; // daily-view-limit for campaign 1
      const views = Array.from({length: maxViews}, () => ({
        campaignId: 1,
        publisher: publisher1,
        viewProof: null
      }));

      // First batch should succeed
      simnet.callPublicFn(
        contractName,
        "bulk-record-views",
        [Cl.list(views.map(v => Cl.tuple({
          'campaign-id': Cl.uint(v.campaignId),
          'publisher': Cl.principal(v.publisher),
          'view-proof': v.viewProof ? Cl.some(Cl.buff(v.viewProof)) : Cl.none()
        })))],
        deployer
      );

      // Next view should fail due to daily limit
      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-record-views",
        [Cl.list([Cl.tuple({
          'campaign-id': Cl.uint(1),
          'publisher': Cl.principal(publisher1),
          'view-proof': Cl.none()
        })])],
        deployer
      );

      expect(result).toBeErr(Cl.uint(406)); // ERR_VIEW-LIMIT-REACHED
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // BULK PUBLISHER VERIFICATION TESTS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Bulk Publisher Verification", () => {
    it("should bulk verify publishers successfully", () => {
      const publishers = [
        { publisher: publisher1, initialScore: 80 },
        { publisher: publisher2, initialScore: 90 },
        { publisher: publisher3, initialScore: 85 }
      ];

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-verify-publishers",
        [Cl.list(publishers.map(p => Cl.tuple({
          'publisher': Cl.principal(p.publisher),
          'initial-score': Cl.uint(p.initialScore)
        })))],
        deployer
      );

      expect(result).toBeOk(Cl.tuple({
        "total-publishers": Cl.uint(3),
        results: Cl.list([
          Cl.tuple({
            "publisher": Cl.principal(publisher1),
            "initial-score": Cl.uint(80),
            "verified-at": Cl.uint(simnet.blockHeight)
          }),
          Cl.tuple({
            "publisher": Cl.principal(publisher2),
            "initial-score": Cl.uint(90),
            "verified-at": Cl.uint(simnet.blockHeight)
          }),
          Cl.tuple({
            "publisher": Cl.principal(publisher3),
            "initial-score": Cl.uint(85),
            "verified-at": Cl.uint(simnet.blockHeight)
          })
        ])
      }));
    });

    it("should handle maximum bulk publisher verification (10 publishers)", () => {
      const publishers = Array.from({length: 10}, (_, i) => ({
        publisher: accounts.get(`wallet_${i + 1}`)!,
        initialScore: 70 + (i * 2) // Scores from 70 to 88
      }));

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-verify-publishers",
        [Cl.list(publishers.map(p => Cl.tuple({
          'publisher': Cl.principal(p.publisher),
          'initial-score': Cl.uint(p.initialScore)
        })))],
        deployer
      );

      expect(result).toBeOk(Cl.tuple({
        "total-publishers": Cl.uint(10),
        results: Cl.list(publishers.map(p => Cl.tuple({
          "publisher": Cl.principal(p.publisher),
          "initial-score": Cl.uint(p.initialScore),
          "verified-at": Cl.uint(simnet.blockHeight)
        })))
      }));
    });

    it("should reject bulk publisher verification by non-admin", () => {
      const publishers = [{ publisher: publisher1, initialScore: 80 }];

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-verify-publishers",
        [Cl.list(publishers.map(p => Cl.tuple({
          'publisher': Cl.principal(p.publisher),
          'initial-score': Cl.uint(p.initialScore)
        })))],
        advertiser
      );

      expect(result).toBeErr(Cl.uint(401)); // ERR_NOT-AUTHORIZED
    });

    it("should reject bulk publisher verification with empty list", () => {
      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-verify-publishers",
        [Cl.list([])],
        deployer
      );

      expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_PARAMS
    });

    it("should validate reputation scores in bulk verification", () => {
      const publishers = [
        { publisher: publisher1, initialScore: 80 }, // Valid
        { publisher: publisher2, initialScore: 150 } // Invalid (> 100)
      ];

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-verify-publishers",
        [Cl.list(publishers.map(p => Cl.tuple({
          'publisher': Cl.principal(p.publisher),
          'initial-score': Cl.uint(p.initialScore)
        })))],
        deployer
      );

      expect(result).toBeErr(Cl.uint(400)); // ERR_INVALID_PARAMS from invalid score
    });
  });

  // ════════════════════════════════════════════════════════════════════════════
  // INTEGRATION TESTS
  // ════════════════════════════════════════════════════════════════════════════

  describe("Bulk Operations Integration", () => {
    it("should handle complete bulk workflow", () => {
      // 1. Bulk verify publishers
      const publishers = [
        { publisher: publisher1, initialScore: 80 },
        { publisher: publisher2, initialScore: 90 }
      ];

      simnet.callPublicFn(
        contractName,
        "bulk-verify-publishers",
        [Cl.list(publishers.map(p => Cl.tuple({
          'publisher': Cl.principal(p.publisher),
          'initial-score': Cl.uint(p.initialScore)
        })))],
        deployer
      );

      // 2. Bulk create campaigns
      const campaigns = [
        {
          campaignType: 1,
          budget: 1000000,
          costPerView: 10000,
          duration: 100,
          targetViews: 50,
          dailyViewLimit: 10,
          targetingData: null,
          refundable: true
        },
        {
          campaignType: 1,
          budget: 2000000,
          costPerView: 15000,
          duration: 150,
          targetViews: 75,
          dailyViewLimit: 15,
          targetingData: null,
          refundable: false
        }
      ];

      simnet.callPublicFn(
        contractName,
        "bulk-create-campaigns",
        [Cl.list(campaigns.map(c => Cl.tuple({
          'campaign-type': Cl.uint(c.campaignType),
          'budget': Cl.uint(c.budget),
          'cost-per-view': Cl.uint(c.costPerView),
          'duration': Cl.uint(c.duration),
          'target-views': Cl.uint(c.targetViews),
          'daily-view-limit': Cl.uint(c.dailyViewLimit),
          'targeting-data': c.targetingData ? Cl.some(Cl.stringUtf8(c.targetingData)) : Cl.none(),
          'refundable': Cl.bool(c.refundable)
        })))],
        advertiser
      );

      // 3. Bulk record views
      const views = [
        { campaignId: 1, publisher: publisher1, viewProof: null },
        { campaignId: 1, publisher: publisher2, viewProof: null },
        { campaignId: 2, publisher: publisher1, viewProof: null }
      ];

      const { result } = simnet.callPublicFn(
        contractName,
        "bulk-record-views",
        [Cl.list(views.map(v => Cl.tuple({
          'campaign-id': Cl.uint(v.campaignId),
          'publisher': Cl.principal(v.publisher),
          'view-proof': v.viewProof ? Cl.some(Cl.buff(v.viewProof)) : Cl.none()
        })))],
        deployer
      );

      expect(result).toBeOk(Cl.tuple({
        "total-views": Cl.uint(3),
        results: Cl.list([
          Cl.tuple({
            "campaign-id": Cl.uint(1),
            "publisher": Cl.principal(publisher1),
            "amount-paid": Cl.uint(10000),
            "timestamp": Cl.uint(simnet.blockHeight)
          }),
          Cl.tuple({
            "campaign-id": Cl.uint(1),
            "publisher": Cl.principal(publisher2),
            "amount-paid": Cl.uint(10000),
            "timestamp": Cl.uint(simnet.blockHeight)
          }),
          Cl.tuple({
            "campaign-id": Cl.uint(2),
            "publisher": Cl.principal(publisher1),
            "amount-paid": Cl.uint(15000),
            "timestamp": Cl.uint(simnet.blockHeight)
          })
        ])
      }));
    });

    it("should maintain data consistency across bulk operations", () => {
      // Bulk create campaigns
      const campaigns = [{
        campaignType: 1,
        budget: 1000000,
        costPerView: 10000,
        duration: 100,
        targetViews: 50,
        dailyViewLimit: 10,
        targetingData: null,
        refundable: true
      }];

      simnet.callPublicFn(
        contractName,
        "bulk-create-campaigns",
        [Cl.list(campaigns.map(c => Cl.tuple({
          'campaign-type': Cl.uint(c.campaignType),
          'budget': Cl.uint(c.budget),
          'cost-per-view': Cl.uint(c.costPerView),
          'duration': Cl.uint(c.duration),
          'target-views': Cl.uint(c.targetViews),
          'daily-view-limit': Cl.uint(c.dailyViewLimit),
          'targeting-data': c.targetingData ? Cl.some(Cl.stringUtf8(c.targetingData)) : Cl.none(),
          'refundable': Cl.bool(c.refundable)
        })))],
        advertiser
      );

      // Single campaign creation
      simnet.callPublicFn(
        contractName,
        "create-campaign",
        [
          Cl.uint(1),
          Cl.uint(500000),
          Cl.uint(5000),
          Cl.uint(50),
          Cl.uint(25),
          Cl.uint(5),
          Cl.none(),
          Cl.bool(false)
        ],
        advertiser
      );

      // Verify campaign counter consistency
      // Should have 2 campaigns total
      const campaign1 = simnet.callReadOnlyFn(contractName, "get-campaign-metrics", [Cl.uint(1)], advertiser);
      const campaign2 = simnet.callReadOnlyFn(contractName, "get-campaign-metrics", [Cl.uint(2)], advertiser);

      expect(campaign1.result).not.toBeErr();
      expect(campaign2.result).not.toBeErr();
    });
  });
});
