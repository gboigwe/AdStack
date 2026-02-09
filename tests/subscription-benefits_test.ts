import { describe, expect, it, beforeEach } from "vitest";
import { Simnet } from "@hirosystems/clarinet-sdk";
import { Cl } from "@stacks/transactions";

const CONTRACT_NAME = "subscription-benefits";

describe("subscription-benefits contract tests", () => {
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
    it("ensures simnet is initialized", () => {
      expect(simnet.blockHeight).toBeDefined();
      expect(simnet.blockHeight).toBeGreaterThan(0);
    });

    it("initializes with correct tier constants", () => {
      // Verify tier constants through a tier creation
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [
          Cl.stringUtf8("Free Tier"),
          Cl.stringUtf8("Basic free access"),
          Cl.uint(0),
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("initializes with contract owner set to deployer", () => {
      // Try action that only owner can do - should succeed
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-grace-period",
        [Cl.bool(false)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Tier Management", () => {
    it("allows owner to create Free tier", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [
          Cl.stringUtf8("Free"),
          Cl.stringUtf8("Basic features for free users"),
          Cl.uint(0),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));

      const { result: tierData } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-tier-config",
        [Cl.uint(1)],
        deployer
      );

      expect(tierData).toBeSome(
        Cl.tuple({
          "tier-name": Cl.stringUtf8("Free"),
          "tier-description": Cl.stringUtf8("Basic features for free users"),
          "monthly-price": Cl.uint(0),
          "is-active": Cl.bool(true),
          "created-at": Cl.uint(simnet.blockHeight),
          "updated-at": Cl.uint(simnet.blockHeight),
        })
      );
    });

    it("allows owner to create Basic tier", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [
          Cl.stringUtf8("Basic"),
          Cl.stringUtf8("Essential features for small teams"),
          Cl.uint(10000000), // 10 STX
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("allows owner to create Pro tier", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [
          Cl.stringUtf8("Pro"),
          Cl.stringUtf8("Advanced features for growing businesses"),
          Cl.uint(50000000), // 50 STX
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("allows owner to create Enterprise tier", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [
          Cl.stringUtf8("Enterprise"),
          Cl.stringUtf8("Full features with priority support"),
          Cl.uint(100000000), // 100 STX
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("prevents non-owner from creating tiers", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [
          Cl.stringUtf8("Unauthorized Tier"),
          Cl.stringUtf8("Should fail"),
          Cl.uint(10000000),
        ],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(900)); // err-owner-only
    });

    it("increments tier nonce correctly", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Tier 1"), Cl.stringUtf8("Description"), Cl.uint(0)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Tier 2"), Cl.stringUtf8("Description"), Cl.uint(0)],
        deployer
      );

      expect(result).toBeOk(Cl.uint(2));
    });

    it("creates multiple tiers successfully", () => {
      const tiers = ["Free", "Basic", "Pro", "Enterprise"];
      const prices = [0, 10000000, 50000000, 100000000];

      tiers.forEach((tier, index) => {
        const { result } = simnet.callPublicFn(
          CONTRACT_NAME,
          "create-tier",
          [
            Cl.stringUtf8(tier),
            Cl.stringUtf8(`${tier} tier description`),
            Cl.uint(prices[index]),
          ],
          deployer
        );
        expect(result).toBeOk(Cl.uint(index + 1));
      });
    });
  });

  describe("Feature Gating - Adding Features", () => {
    beforeEach(() => {
      // Create tiers
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );
    });

    it("allows owner to add basic campaigns feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1), // tier-id
          Cl.uint(1), // FEATURE-BASIC-CAMPAIGNS
          Cl.stringUtf8("Basic Campaigns"),
          Cl.stringUtf8("Create and manage basic advertising campaigns"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to add advanced analytics feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(2), // FEATURE-ADVANCED-ANALYTICS
          Cl.stringUtf8("Advanced Analytics"),
          Cl.stringUtf8("Detailed analytics and insights"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to add custom targeting feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(3), // FEATURE-CUSTOM-TARGETING
          Cl.stringUtf8("Custom Targeting"),
          Cl.stringUtf8("Advanced audience targeting options"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to add API access feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(4), // FEATURE-API-ACCESS
          Cl.stringUtf8("API Access"),
          Cl.stringUtf8("Programmatic access via REST API"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to add priority support feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(5), // FEATURE-PRIORITY-SUPPORT
          Cl.stringUtf8("Priority Support"),
          Cl.stringUtf8("24/7 priority customer support"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to add white label feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(6), // FEATURE-WHITE-LABEL
          Cl.stringUtf8("White Label"),
          Cl.stringUtf8("Brand customization options"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to add advanced reporting feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(7), // FEATURE-ADVANCED-REPORTING
          Cl.stringUtf8("Advanced Reporting"),
          Cl.stringUtf8("Custom report generation"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to add bulk operations feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(8), // FEATURE-BULK-OPERATIONS
          Cl.stringUtf8("Bulk Operations"),
          Cl.stringUtf8("Batch process multiple campaigns"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to add team collaboration feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(9), // FEATURE-TEAM-COLLABORATION
          Cl.stringUtf8("Team Collaboration"),
          Cl.stringUtf8("Multi-user team workspace"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to add custom integrations feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(10), // FEATURE-CUSTOM-INTEGRATIONS
          Cl.stringUtf8("Custom Integrations"),
          Cl.stringUtf8("Connect with third-party tools"),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents non-owner from adding features", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Unauthorized Feature"),
          Cl.stringUtf8("Should fail"),
        ],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(900)); // err-owner-only
    });

    it("prevents adding feature to non-existent tier", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(999),
          Cl.uint(1),
          Cl.stringUtf8("Feature"),
          Cl.stringUtf8("Description"),
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(905)); // err-invalid-tier
    });

    it("retrieves feature configuration correctly", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Basic Campaigns"),
          Cl.stringUtf8("Campaign management"),
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-tier-feature",
        [Cl.uint(1), Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          enabled: Cl.bool(true),
          "feature-name": Cl.stringUtf8("Basic Campaigns"),
          "feature-description": Cl.stringUtf8("Campaign management"),
          "added-at": Cl.uint(simnet.blockHeight),
        })
      );
    });
  });

  describe("Usage Tracking - Setting Limits", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );
    });

    it("sets campaigns usage limit with hard limit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1), // tier-id
          Cl.uint(1), // USAGE-CAMPAIGNS
          Cl.stringUtf8("Campaigns"),
          Cl.uint(10), // 10 campaigns per month
          Cl.bool(true), // hard-limit
          Cl.uint(0), // no overage fee
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("sets impressions usage limit with soft limit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(2), // USAGE-IMPRESSIONS
          Cl.stringUtf8("Impressions"),
          Cl.uint(100000), // 100k impressions
          Cl.bool(false), // soft-limit
          Cl.uint(5), // 5 micro-STX per impression overage
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("sets clicks usage limit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(3), // USAGE-CLICKS
          Cl.stringUtf8("Clicks"),
          Cl.uint(10000),
          Cl.bool(false),
          Cl.uint(10),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("sets conversions usage limit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(4), // USAGE-CONVERSIONS
          Cl.stringUtf8("Conversions"),
          Cl.uint(1000),
          Cl.bool(false),
          Cl.uint(20),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("sets API calls usage limit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(5), // USAGE-API-CALLS
          Cl.stringUtf8("API Calls"),
          Cl.uint(50000),
          Cl.bool(true),
          Cl.uint(0),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("sets team members usage limit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(6), // USAGE-TEAM-MEMBERS
          Cl.stringUtf8("Team Members"),
          Cl.uint(5),
          Cl.bool(true),
          Cl.uint(0),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("sets storage usage limit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(7), // USAGE-STORAGE-GB
          Cl.stringUtf8("Storage (GB)"),
          Cl.uint(100),
          Cl.bool(false),
          Cl.uint(100000), // 0.1 STX per GB overage
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("sets reports usage limit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(8), // USAGE-REPORTS
          Cl.stringUtf8("Reports"),
          Cl.uint(50),
          Cl.bool(true),
          Cl.uint(0),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents non-owner from setting usage limits", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Campaigns"),
          Cl.uint(10),
          Cl.bool(true),
          Cl.uint(0),
        ],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(900)); // err-owner-only
    });

    it("prevents setting limit for non-existent tier", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(999),
          Cl.uint(1),
          Cl.stringUtf8("Campaigns"),
          Cl.uint(10),
          Cl.bool(true),
          Cl.uint(0),
        ],
        deployer
      );

      expect(result).toBeErr(Cl.uint(905)); // err-invalid-tier
    });

    it("retrieves usage limit configuration correctly", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Campaigns"),
          Cl.uint(10),
          Cl.bool(true),
          Cl.uint(0),
        ],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-tier-usage-limit",
        [Cl.uint(1), Cl.uint(1)],
        deployer
      );

      expect(result).toBeSome(
        Cl.tuple({
          "limit-name": Cl.stringUtf8("Campaigns"),
          "monthly-limit": Cl.uint(10),
          "hard-limit": Cl.bool(true),
          "overage-fee": Cl.uint(0),
          "reset-period": Cl.uint(2592000),
        })
      );
    });
  });

  describe("User Benefits Activation", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );
    });

    it("activates benefits for user successfully", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [
          Cl.principal(wallet1),
          Cl.uint(1), // tier-id
          Cl.uint(1), // subscription-id
          Cl.uint(2592000), // 30 days duration
        ],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("stores user benefits correctly", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-benefits",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "current-tier": Cl.uint(1),
          "subscription-id": Cl.uint(1),
          "activated-at": Cl.uint(simnet.blockHeight),
          "expires-at": Cl.uint(simnet.blockHeight + 2592000),
          "is-active": Cl.bool(true),
          "in-grace-period": Cl.bool(false),
          "grace-period-ends": Cl.uint(0),
          "auto-renew": Cl.bool(true),
          "last-tier-change": Cl.uint(simnet.blockHeight),
        })
      );
    });

    it("prevents non-owner from activating benefits", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet2), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(900)); // err-owner-only
    });

    it("prevents activating benefits for invalid tier", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(999), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(905)); // err-invalid-tier
    });

    it("activates benefits for multiple users", () => {
      const { result1 } = simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );

      const { result2 } = simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet2), Cl.uint(1), Cl.uint(2), Cl.uint(2592000)],
        deployer
      );

      expect(result1).toBeOk(Cl.bool(true));
      expect(result2).toBeOk(Cl.bool(true));
    });
  });

  describe("Feature Access Control", () => {
    beforeEach(() => {
      // Create tier and add feature
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Basic Campaigns"),
          Cl.stringUtf8("Campaign management"),
        ],
        deployer
      );

      // Activate benefits for wallet1
      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );
    });

    it("grants access to feature in user's tier", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "has-feature-access",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("denies access to feature not in user's tier", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "has-feature-access",
        [Cl.principal(wallet1), Cl.uint(2)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(false));
    });

    it("denies access for user without benefits", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "has-feature-access",
        [Cl.principal(wallet2), Cl.uint(1)],
        wallet2
      );

      expect(result).toBeOk(Cl.bool(false));
    });

    it("allows requesting feature access successfully", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "request-feature-access",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("denies feature access request for unavailable feature", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "request-feature-access",
        [Cl.uint(2)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(903)); // err-feature-not-available
    });

    it("checks access for expired subscription", () => {
      // Mine blocks to expire subscription
      simnet.mineEmptyBlocks(2592001);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "has-feature-access",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(false));
    });
  });

  describe("Usage Tracking and Enforcement", () => {
    beforeEach(() => {
      // Setup tier with usage limits
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(1), // USAGE-CAMPAIGNS
          Cl.stringUtf8("Campaigns"),
          Cl.uint(10),
          Cl.bool(true), // hard-limit
          Cl.uint(0),
        ],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );
    });

    it("tracks usage within limits successfully", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(5)], // Track 5 campaigns
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          "new-usage": Cl.uint(5),
          remaining: Cl.uint(5),
          "overage-fee": Cl.uint(0),
        })
      );
    });

    it("prevents usage beyond hard limit", () => {
      // Use up to limit
      simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(10)],
        wallet1
      );

      // Try to exceed
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(904)); // err-quota-exceeded
    });

    it("allows incremental usage tracking", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(3)],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(4)],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          "new-usage": Cl.uint(7),
          remaining: Cl.uint(3),
          "overage-fee": Cl.uint(0),
        })
      );
    });

    it("checks usage limit correctly", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(8)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "check-usage-limit",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(2)],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          allowed: Cl.bool(true),
          remaining: Cl.uint(0),
          overage: Cl.uint(0),
          "overage-fee": Cl.uint(0),
        })
      );
    });

    it("prevents tracking usage for inactive subscription", () => {
      // Mine blocks to expire
      simnet.mineEmptyBlocks(2592001);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(906)); // err-subscription-expired
    });

    it("prevents tracking usage for user without benefits", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(1)],
        wallet2
      );

      expect(result).toBeErr(Cl.uint(901)); // err-not-found
    });
  });

  describe("Overage Fee Calculation", () => {
    beforeEach(() => {
      // Setup tier with soft limit
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(2), // USAGE-IMPRESSIONS
          Cl.stringUtf8("Impressions"),
          Cl.uint(1000),
          Cl.bool(false), // soft-limit
          Cl.uint(5), // 5 micro-STX per impression
        ],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );
    });

    it("allows usage with soft limit and calculates overage", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(2), Cl.uint(1100)], // 100 over limit
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          "new-usage": Cl.uint(1100),
          remaining: Cl.uint(0),
          "overage-fee": Cl.uint(500), // 100 * 5
        })
      );
    });

    it("calculates cumulative overage fees", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(2), Cl.uint(1050)],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(2), Cl.uint(100)],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          "new-usage": Cl.uint(1150),
          remaining: Cl.uint(0),
          "overage-fee": Cl.uint(500), // 100 * 5 (additional overage)
        })
      );
    });

    it("charges no overage when within limit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(2), Cl.uint(500)],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          "new-usage": Cl.uint(500),
          remaining: Cl.uint(0),
          "overage-fee": Cl.uint(0),
        })
      );
    });
  });

  describe("Usage Quota Alerts", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Campaigns"),
          Cl.uint(100),
          Cl.bool(true),
          Cl.uint(0),
        ],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );
    });

    it("triggers 75% threshold alert", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(75)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-quota-alerts",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "threshold-75-reached": Cl.bool(true),
          "threshold-90-reached": Cl.bool(false),
          "threshold-100-reached": Cl.bool(false),
          "last-alert-sent": Cl.uint(simnet.blockHeight),
          "overage-alert-sent": Cl.bool(false),
        })
      );
    });

    it("triggers 90% threshold alert", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(90)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-quota-alerts",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "threshold-75-reached": Cl.bool(true),
          "threshold-90-reached": Cl.bool(true),
          "threshold-100-reached": Cl.bool(false),
          "last-alert-sent": Cl.uint(simnet.blockHeight),
          "overage-alert-sent": Cl.bool(false),
        })
      );
    });

    it("triggers 100% threshold alert", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(100)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-quota-alerts",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeSome(
        Cl.tuple({
          "threshold-75-reached": Cl.bool(true),
          "threshold-90-reached": Cl.bool(true),
          "threshold-100-reached": Cl.bool(true),
          "last-alert-sent": Cl.uint(simnet.blockHeight),
          "overage-alert-sent": Cl.bool(false),
        })
      );
    });

    it("maintains alert thresholds once reached", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(80)],
        wallet1
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(5)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-quota-alerts",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      const alerts = result.value as any;
      expect(alerts["threshold-75-reached"]).toBeBool(true);
    });
  });

  describe("Tier Upgrades with Proration", () => {
    beforeEach(() => {
      // Create multiple tiers
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Pro"), Cl.stringUtf8("Pro tier"), Cl.uint(50000000)],
        deployer
      );

      // Activate user on Basic tier
      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );
    });

    it("allows user to upgrade tier", () => {
      // Wait to pass cooldown
      simnet.mineEmptyBlocks(604801);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "upgrade-tier",
        [Cl.uint(2)], // Upgrade to Pro
        wallet1
      );

      expect(result).toBeOk();
    });

    it("calculates prorated upgrade cost correctly", () => {
      simnet.mineEmptyBlocks(604801);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "calculate-upgrade-cost",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(2)],
        wallet1
      );

      expect(result).toBeOk();
    });

    it("prevents downgrade via upgrade function", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "upgrade-tier",
        [Cl.uint(0)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(907)); // err-invalid-upgrade
    });

    it("prevents upgrade to non-existent tier", () => {
      simnet.mineEmptyBlocks(604801);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "upgrade-tier",
        [Cl.uint(999)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(905)); // err-invalid-tier
    });

    it("enforces cooldown period on tier changes", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "upgrade-tier",
        [Cl.uint(2)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(910)); // err-cooldown-active
    });

    it("updates user tier after successful upgrade", () => {
      simnet.mineEmptyBlocks(604801);

      simnet.callPublicFn(CONTRACT_NAME, "upgrade-tier", [Cl.uint(2)], wallet1);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-tier",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(2));
    });
  });

  describe("Tier Downgrades", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Pro"), Cl.stringUtf8("Pro tier"), Cl.uint(50000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(2), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );
    });

    it("allows user to downgrade tier", () => {
      simnet.mineEmptyBlocks(604801);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "downgrade-tier",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeOk();
    });

    it("prevents upgrade via downgrade function", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "downgrade-tier",
        [Cl.uint(3)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(907)); // err-invalid-upgrade
    });

    it("prevents downgrade to non-existent tier", () => {
      simnet.mineEmptyBlocks(604801);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "downgrade-tier",
        [Cl.uint(999)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(905)); // err-invalid-tier
    });

    it("enforces cooldown on downgrades", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "downgrade-tier",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(910)); // err-cooldown-active
    });

    it("downgrade is not effective immediately", () => {
      simnet.mineEmptyBlocks(604801);

      simnet.callPublicFn(CONTRACT_NAME, "downgrade-tier", [Cl.uint(1)], wallet1);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-tier",
        [Cl.principal(wallet1)],
        wallet1
      );

      // Should still be on Pro tier (2) until next billing cycle
      expect(result).toBeOk(Cl.uint(2));
    });
  });

  describe("Grace Period Handling", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(100)], // Short duration for testing
        deployer
      );
    });

    it("grants grace period on benefit expiration", () => {
      // Mine past expiration
      simnet.mineEmptyBlocks(101);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "expire-benefits",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(
        Cl.tuple({
          "grace-period": Cl.bool(true),
          "ends-at": Cl.uint(simnet.blockHeight + 259200), // 3 days grace period
        })
      );
    });

    it("maintains access during grace period", () => {
      simnet.mineEmptyBlocks(101);

      simnet.callPublicFn(
        CONTRACT_NAME,
        "expire-benefits",
        [Cl.principal(wallet1)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-subscription-active",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("deactivates after grace period ends", () => {
      simnet.mineEmptyBlocks(101);

      // First expiration grants grace period
      simnet.callPublicFn(
        CONTRACT_NAME,
        "expire-benefits",
        [Cl.principal(wallet1)],
        deployer
      );

      // Mine past grace period
      simnet.mineEmptyBlocks(259201);

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-subscription-active",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(false));
    });

    it("allows owner to disable grace period", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-grace-period",
        [Cl.bool(false)],
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents non-owner from toggling grace period", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-grace-period",
        [Cl.bool(false)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(900)); // err-owner-only
    });

    it("allows owner to set grace period duration", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-grace-period-duration",
        [Cl.uint(432000)], // 5 days
        deployer
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("prevents non-owner from setting grace period duration", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "set-grace-period-duration",
        [Cl.uint(432000)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(900)); // err-owner-only
    });

    it("deactivates immediately when grace period disabled", () => {
      // Disable grace period
      simnet.callPublicFn(
        CONTRACT_NAME,
        "toggle-grace-period",
        [Cl.bool(false)],
        deployer
      );

      simnet.mineEmptyBlocks(101);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "expire-benefits",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeOk(
        Cl.tuple({
          "grace-period": Cl.bool(false),
          "ends-at": Cl.uint(0),
        })
      );
    });

    it("prevents expiring benefits before expiration time", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "expire-benefits",
        [Cl.principal(wallet1)],
        deployer
      );

      expect(result).toBeErr(Cl.uint(909)); // err-benefit-expired
    });

    it("prevents non-owner from expiring benefits", () => {
      simnet.mineEmptyBlocks(101);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "expire-benefits",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(900)); // err-owner-only
    });
  });

  describe("Custom Benefits", () => {
    it("allows owner to grant custom benefit", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "grant-custom-benefit",
        [
          Cl.principal(wallet1),
          Cl.stringUtf8("Extra Storage"),
          Cl.uint(100),
          Cl.some(Cl.uint(simnet.blockHeight + 1000000)),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("allows granting custom benefit without expiration", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "grant-custom-benefit",
        [
          Cl.principal(wallet1),
          Cl.stringUtf8("Lifetime Bonus"),
          Cl.uint(500),
          Cl.none(),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("prevents non-owner from granting custom benefits", () => {
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "grant-custom-benefit",
        [
          Cl.principal(wallet2),
          Cl.stringUtf8("Extra Feature"),
          Cl.uint(10),
          Cl.none(),
        ],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(900)); // err-owner-only
    });

    it("increments benefit nonce correctly", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "grant-custom-benefit",
        [
          Cl.principal(wallet1),
          Cl.stringUtf8("Benefit 1"),
          Cl.uint(10),
          Cl.none(),
        ],
        deployer
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "grant-custom-benefit",
        [
          Cl.principal(wallet1),
          Cl.stringUtf8("Benefit 2"),
          Cl.uint(20),
          Cl.none(),
        ],
        deployer
      );

      expect(result).toBeOk(Cl.uint(2));
    });
  });

  describe("Subscription Status Checks", () => {
    beforeEach(() => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );
    });

    it("returns active for valid subscription", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-subscription-active",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeOk(Cl.bool(true));
    });

    it("returns false for non-existent subscription", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "is-subscription-active",
        [Cl.principal(wallet2)],
        wallet2
      );

      expect(result).toBeOk(Cl.bool(false));
    });

    it("returns correct user tier", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-tier",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeOk(Cl.uint(1));
    });

    it("returns free tier for user without benefits", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-tier",
        [Cl.principal(wallet2)],
        wallet2
      );

      expect(result).toBeOk(Cl.uint(0)); // TIER-FREE
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("handles tier config retrieval for non-existent tier", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-tier-config",
        [Cl.uint(999)],
        deployer
      );

      expect(result).toBeNone();
    });

    it("handles feature retrieval for non-existent combination", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-tier-feature",
        [Cl.uint(1), Cl.uint(99)],
        deployer
      );

      expect(result).toBeNone();
    });

    it("handles usage limit retrieval for non-existent combination", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-tier-usage-limit",
        [Cl.uint(1), Cl.uint(99)],
        deployer
      );

      expect(result).toBeNone();
    });

    it("handles usage check without tier limit configured", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );

      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "check-usage-limit",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(10)],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          allowed: Cl.bool(false),
          remaining: Cl.uint(0),
          overage: Cl.uint(0),
          "overage-fee": Cl.uint(0),
        })
      );
    });

    it("handles zero usage tracking", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Campaigns"),
          Cl.uint(10),
          Cl.bool(true),
          Cl.uint(0),
        ],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(0)],
        wallet1
      );

      expect(result).toBeOk(
        Cl.tuple({
          "new-usage": Cl.uint(0),
          remaining: Cl.uint(10),
          "overage-fee": Cl.uint(0),
        })
      );
    });

    it("handles upgrade to same tier", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );

      simnet.mineEmptyBlocks(604801);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "upgrade-tier",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(907)); // err-invalid-upgrade
    });

    it("handles downgrade to same tier", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );

      simnet.mineEmptyBlocks(604801);

      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "downgrade-tier",
        [Cl.uint(1)],
        wallet1
      );

      expect(result).toBeErr(Cl.uint(907)); // err-invalid-upgrade
    });

    it("handles usage retrieval for non-existent period", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-usage",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(999999)],
        wallet1
      );

      expect(result).toBeNone();
    });

    it("handles engagement metrics for new user", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-engagement",
        [Cl.principal(wallet1)],
        wallet1
      );

      expect(result).toBeNone();
    });

    it("handles tier analytics for non-existent tier", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-tier-analytics",
        [Cl.uint(999)],
        deployer
      );

      expect(result).toBeNone();
    });

    it("handles quota alerts for user without usage", () => {
      const { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-quota-alerts",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );

      expect(result).toBeNone();
    });
  });

  describe("Complex Scenarios", () => {
    it("handles complete user journey: signup to upgrade", () => {
      // Create tiers
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Pro"), Cl.stringUtf8("Pro tier"), Cl.uint(50000000)],
        deployer
      );

      // Add features
      simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Basic Campaigns"),
          Cl.stringUtf8("Basic features"),
        ],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "set-tier-usage-limit",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Campaigns"),
          Cl.uint(10),
          Cl.bool(true),
          Cl.uint(0),
        ],
        deployer
      );

      // Activate user
      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );

      // Use features
      simnet.callPublicFn(
        CONTRACT_NAME,
        "request-feature-access",
        [Cl.uint(1)],
        wallet1
      );

      // Track usage
      simnet.callPublicFn(
        CONTRACT_NAME,
        "track-usage",
        [Cl.uint(1), Cl.uint(5)],
        wallet1
      );

      // Wait for cooldown
      simnet.mineEmptyBlocks(604801);

      // Upgrade
      const { result } = simnet.callPublicFn(
        CONTRACT_NAME,
        "upgrade-tier",
        [Cl.uint(2)],
        wallet1
      );

      expect(result).toBeOk();
    });

    it("handles multiple users with different tiers", () => {
      // Create tiers
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Pro"), Cl.stringUtf8("Pro tier"), Cl.uint(50000000)],
        deployer
      );

      // Activate different users
      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(2592000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet2), Cl.uint(2), Cl.uint(2), Cl.uint(2592000)],
        deployer
      );

      // Check tiers
      const { result: tier1 } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-tier",
        [Cl.principal(wallet1)],
        wallet1
      );

      const { result: tier2 } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "get-user-tier",
        [Cl.principal(wallet2)],
        wallet2
      );

      expect(tier1).toBeOk(Cl.uint(1));
      expect(tier2).toBeOk(Cl.uint(2));
    });

    it("handles feature access with expiration and grace period", () => {
      simnet.callPublicFn(
        CONTRACT_NAME,
        "create-tier",
        [Cl.stringUtf8("Basic"), Cl.stringUtf8("Basic tier"), Cl.uint(10000000)],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "add-tier-feature",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Basic Campaigns"),
          Cl.stringUtf8("Basic features"),
        ],
        deployer
      );

      simnet.callPublicFn(
        CONTRACT_NAME,
        "activate-benefits",
        [Cl.principal(wallet1), Cl.uint(1), Cl.uint(1), Cl.uint(100)],
        deployer
      );

      // Access during active period
      let { result } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "has-feature-access",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));

      // Expire and grant grace period
      simnet.mineEmptyBlocks(101);
      simnet.callPublicFn(
        CONTRACT_NAME,
        "expire-benefits",
        [Cl.principal(wallet1)],
        deployer
      );

      // Access during grace period
      let { result: result2 } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "has-feature-access",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );
      expect(result2).toBeOk(Cl.bool(true));

      // Access after grace period
      simnet.mineEmptyBlocks(259201);
      let { result: result3 } = simnet.callReadOnlyFn(
        CONTRACT_NAME,
        "has-feature-access",
        [Cl.principal(wallet1), Cl.uint(1)],
        wallet1
      );
      expect(result3).toBeOk(Cl.bool(false));
    });
  });
});
