import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

declare const simnet: any;

describe("Ad Content Registry Contract - Comprehensive Tests", () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const contractOwner = deployer;
  const advertiser1 = accounts.get("wallet_1")!;
  const advertiser2 = accounts.get("wallet_2")!;
  const reporter1 = accounts.get("wallet_3")!;
  const reporter2 = accounts.get("wallet_4")!;
  const randomUser = accounts.get("wallet_5")!;

  const campaignId1 = 1;
  const campaignId2 = 2;
  
  const validIpfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const validTitle = "Summer Sale 2024" as const;
  const validDescription = "Get 50% off on all products this summer!" as const;
  const validCTA = "Shop Now" as const;
  const validUrl = "https://example.com/summer-sale" as const;
  const validTags = Cl.list([
    Cl.stringAscii("summer"),
    Cl.stringAscii("sale"),
    Cl.stringAscii("discount")
  ]);
  const validSize = 1024; // 1KB
  const validFormat = 1; // FORMAT-IMAGE

  const minContentSize = 100;
  const maxContentSize = 10485760; // 10MB
  const flagThreshold = 5;

  beforeEach(() => {
    // Reset contract state
    simnet.setDataVar("ad-content-registry", "content-nonce", Cl.uint(0));
    simnet.setDataVar("ad-content-registry", "min-content-size", Cl.uint(minContentSize));
    simnet.setDataVar("ad-content-registry", "max-content-size", Cl.uint(maxContentSize));
    simnet.setDataVar("ad-content-registry", "flag-threshold", Cl.uint(flagThreshold));
  });

  describe("Content Registration", () => {
    it("should register ad content with valid parameters", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.uint(1));

      // Check ad content entry
      const content = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content",
        [Cl.uint(1)],
        deployer
      );

      expect(content.result).toBeSome(
        Cl.tuple({
          "campaign-id": Cl.uint(campaignId1),
          owner: Cl.principal(advertiser1),
          "ipfs-hash": Cl.stringAscii(validIpfsHash),
          format: Cl.uint(validFormat),
          size: Cl.uint(validSize),
          status: Cl.uint(0), // STATUS-PENDING
          "created-at": expect.anything(),
          "updated-at": expect.anything(),
          "flags-count": Cl.uint(0)
        })
      );

      // Check metadata
      const metadata = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content-metadata",
        [Cl.uint(1)],
        deployer
      );

      expect(metadata.result).toBeSome(
        Cl.tuple({
          title: Cl.stringUtf8(validTitle),
          description: Cl.stringUtf8(validDescription),
          "call-to-action": Cl.stringUtf8(validCTA),
          "landing-url": Cl.stringUtf8(validUrl),
          tags: validTags
        })
      );

      // Check performance initialized
      const performance = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content-performance",
        [Cl.uint(1)],
        deployer
      );

      expect(performance.result).toBeSome(
        Cl.tuple({
          "total-views": Cl.uint(0),
          "total-clicks": Cl.uint(0),
          "unique-viewers": Cl.uint(0),
          "click-through-rate": Cl.uint(0),
          "last-shown": Cl.uint(0)
        })
      );
    });

    it("should register multiple content pieces with incrementing IDs", () => {
      // First content
      simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );

      // Second content
      const result2 = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId2),
          Cl.stringAscii("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucd"),
          Cl.uint(2), // FORMAT-VIDEO
          Cl.uint(2048),
          Cl.stringUtf8("Winter Sale"),
          Cl.stringUtf8("Winter discounts"),
          Cl.stringUtf8("Buy Now"),
          Cl.stringUtf8("https://example.com/winter"),
          Cl.list([Cl.stringAscii("winter"), Cl.stringAscii("sale")])
        ],
        advertiser2
      );

      expect(result2.result).toBeOk(Cl.uint(2));

      const nonce = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content-nonce",
        [],
        deployer
      );
      expect(nonce.result).toBeUint(2);
    });

    it("should reject invalid format", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(99), // Invalid format
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(107)); // err-invalid-format
    });

    it("should reject content size below minimum", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(50), // Below min
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(103)); // err-invalid-content
    });

    it("should reject content size above maximum", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(10485761), // Above max
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(103)); // err-invalid-content
    });

    it("should handle maximum tags count", () => {
      const maxTags = Cl.list([
        Cl.stringAscii("tag1"),
        Cl.stringAscii("tag2"),
        Cl.stringAscii("tag3"),
        Cl.stringAscii("tag4"),
        Cl.stringAscii("tag5"),
        Cl.stringAscii("tag6"),
        Cl.stringAscii("tag7"),
        Cl.stringAscii("tag8"),
        Cl.stringAscii("tag9"),
        Cl.stringAscii("tag10")
      ]);

      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          maxTags
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.uint(1));
    });
  });

  describe("Content Status Management", () => {
    let contentId: number;

    beforeEach(() => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );
      contentId = 1;
    });

    it("should allow owner to update content status", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "update-content-status",
        [Cl.uint(contentId), Cl.uint(1)], // STATUS-APPROVED
        contractOwner
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const content = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content",
        [Cl.uint(contentId)],
        deployer
      );

      expect(content.value.data.status).toBeUint(1); // Approved
    });

    it("should prevent non-owner from updating status", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "update-content-status",
        [Cl.uint(contentId), Cl.uint(1)],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(100)); // err-owner-only
    });

    it("should reject invalid status", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "update-content-status",
        [Cl.uint(contentId), Cl.uint(99)],
        contractOwner
      );

      expect(result.result).toBeErr(Cl.uint(105)); // err-invalid-status
    });

    it("should allow updating to all valid statuses", () => {
      const statuses = [0, 1, 2, 3, 4]; // PENDING, APPROVED, REJECTED, SUSPENDED, ARCHIVED
      
      statuses.forEach((status) => {
        const result = simnet.callPublicFn(
          "ad-content-registry",
          "update-content-status",
          [Cl.uint(contentId), Cl.uint(status)],
          contractOwner
        );
        expect(result.result).toBeOk(Cl.bool(true));
      });
    });
  });

  describe("Content Flagging", () => {
    let contentId: number;

    beforeEach(() => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );
      contentId = 1;
    });

    it("should allow users to flag content", () => {
      const reason = "Inappropriate content" as const;
      
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "flag-content",
        [Cl.uint(contentId), Cl.stringUtf8(reason)],
        reporter1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Check flag recorded
      const flag = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-flag-info",
        [Cl.uint(contentId), Cl.principal(reporter1)],
        deployer
      );

      expect(flag.result).toBeSome(
        Cl.tuple({
          reason: Cl.stringUtf8(reason),
          timestamp: expect.anything(),
          verified: Cl.bool(false)
        })
      );

      // Check flag count increased
      const content = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content",
        [Cl.uint(contentId)],
        deployer
      );
      expect(content.value.data["flags-count"]).toBeUint(1);
    });

    it("should prevent owner from flagging own content", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "flag-content",
        [Cl.uint(contentId), Cl.stringUtf8("Self flag")],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(104)); // err-unauthorized
    });

    it("should auto-suspend content after threshold flags", () => {
      // Add flags up to threshold
      for (let i = 0; i < flagThreshold; i++) {
        const reporter = accounts.get(`wallet_${i + 3}`)!;
        simnet.callPublicFn(
          "ad-content-registry",
          "flag-content",
          [Cl.uint(contentId), Cl.stringUtf8(`Flag ${i + 1}`)],
          reporter
        );
      }

      const content = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content",
        [Cl.uint(contentId)],
        deployer
      );

      expect(content.value.data.status).toBeUint(3); // STATUS-SUSPENDED
      expect(content.value.data["flags-count"]).toBeUint(flagThreshold);
    });

    it("should allow owner to verify flags", () => {
      // Add flag
      simnet.callPublicFn(
        "ad-content-registry",
        "flag-content",
        [Cl.uint(contentId), Cl.stringUtf8("Spam")],
        reporter1
      );

      // Verify flag as valid
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "verify-flag",
        [Cl.uint(contentId), Cl.principal(reporter1), Cl.bool(true)],
        contractOwner
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Check flag verified
      const flag = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-flag-info",
        [Cl.uint(contentId), Cl.principal(reporter1)],
        deployer
      );
      expect(flag.value.data.verified).toBe(Cl.bool(true));
    });

    it("should prevent non-owner from verifying flags", () => {
      simnet.callPublicFn(
        "ad-content-registry",
        "flag-content",
        [Cl.uint(contentId), Cl.stringUtf8("Spam")],
        reporter1
      );

      const result = simnet.callPublicFn(
        "ad-content-registry",
        "verify-flag",
        [Cl.uint(contentId), Cl.principal(reporter1), Cl.bool(true)],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(100)); // err-owner-only
    });
  });

  describe("Content Tracking", () => {
    let contentId: number;

    beforeEach(() => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );
      contentId = 1;

      // Approve content
      simnet.callPublicFn(
        "ad-content-registry",
        "update-content-status",
        [Cl.uint(contentId), Cl.uint(1)], // STATUS-APPROVED
        contractOwner
      );
    });

    it("should track content views", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "track-content-view",
        [Cl.uint(contentId)],
        randomUser
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const performance = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content-performance",
        [Cl.uint(contentId)],
        deployer
      );

      expect(performance.value.data["total-views"]).toBeUint(1);
      expect(performance.value.data["unique-viewers"]).toBeUint(1);
      expect(performance.value.data["last-shown"]).toBeUint(simnet.stacksBlockTime);
    });

    it("should track content clicks", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "track-content-click",
        [Cl.uint(contentId)],
        randomUser
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const performance = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content-performance",
        [Cl.uint(contentId)],
        deployer
      );

      expect(performance.value.data["total-clicks"]).toBeUint(1);
    });

    it("should calculate click-through rate correctly", () => {
      // Track views
      for (let i = 0; i < 100; i++) {
        simnet.callPublicFn(
          "ad-content-registry",
          "track-content-view",
          [Cl.uint(contentId)],
          randomUser
        );
      }

      // Track clicks
      for (let i = 0; i < 5; i++) {
        simnet.callPublicFn(
          "ad-content-registry",
          "track-content-click",
          [Cl.uint(contentId)],
          randomUser
        );
      }

      const performance = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content-performance",
        [Cl.uint(contentId)],
        deployer
      );

      // CTR should be (5/100) * 10000 = 500 (5%)
      expect(performance.value.data["click-through-rate"]).toBeUint(500);
    });

    it("should prevent tracking views for non-approved content", () => {
      // Create new content without approving
      const result2 = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId2),
          Cl.stringAscii("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucd"),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8("Pending Content"),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser2
      );
      const newContentId = 2;

      const result = simnet.callPublicFn(
        "ad-content-registry",
        "track-content-view",
        [Cl.uint(newContentId)],
        randomUser
      );

      expect(result.result).toBeErr(Cl.uint(105)); // err-invalid-status
    });
  });

  describe("Campaign Content Management", () => {
    let contentId1: number;
    let contentId2: number;

    beforeEach(() => {
      // Register first content
      const result1 = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );
      contentId1 = 1;

      // Register second content
      const result2 = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucd"),
          Cl.uint(2), // VIDEO
          Cl.uint(2048),
          Cl.stringUtf8("Video Ad"),
          Cl.stringUtf8("Video description"),
          Cl.stringUtf8("Watch Now"),
          Cl.stringUtf8("https://example.com/video"),
          Cl.list([Cl.stringAscii("video")])
        ],
        advertiser1
      );
      contentId2 = 2;
    });

    it("should add content to campaign", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "add-content-to-campaign",
        [Cl.uint(campaignId1), Cl.uint(contentId1)],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const campaign = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-campaign-contents",
        [Cl.uint(campaignId1)],
        deployer
      );

      expect(campaign.result).toBeSome(
        Cl.tuple({
          "content-ids": Cl.list([Cl.uint(contentId1)]),
          "active-content-id": Cl.uint(contentId1)
        })
      );
    });

    it("should add multiple contents to campaign", () => {
      simnet.callPublicFn(
        "ad-content-registry",
        "add-content-to-campaign",
        [Cl.uint(campaignId1), Cl.uint(contentId1)],
        advertiser1
      );

      const result = simnet.callPublicFn(
        "ad-content-registry",
        "add-content-to-campaign",
        [Cl.uint(campaignId1), Cl.uint(contentId2)],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const campaign = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-campaign-contents",
        [Cl.uint(campaignId1)],
        deployer
      );

      expect(campaign.value.data["content-ids"]).toEqual(
        Cl.list([Cl.uint(contentId1), Cl.uint(contentId2)])
      );
    });

    it("should set active content", () => {
      // Add both contents
      simnet.callPublicFn(
        "ad-content-registry",
        "add-content-to-campaign",
        [Cl.uint(campaignId1), Cl.uint(contentId1)],
        advertiser1
      );

      simnet.callPublicFn(
        "ad-content-registry",
        "add-content-to-campaign",
        [Cl.uint(campaignId1), Cl.uint(contentId2)],
        advertiser1
      );

      // Approve content 2
      simnet.callPublicFn(
        "ad-content-registry",
        "update-content-status",
        [Cl.uint(contentId2), Cl.uint(1)], // APPROVED
        contractOwner
      );

      // Set active to content 2
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "set-active-content",
        [Cl.uint(campaignId1), Cl.uint(contentId2)],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const campaign = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-campaign-contents",
        [Cl.uint(campaignId1)],
        deployer
      );

      expect(campaign.value.data["active-content-id"]).toBeUint(contentId2);
    });

    it("should prevent setting unapproved content as active", () => {
      // Add content
      simnet.callPublicFn(
        "ad-content-registry",
        "add-content-to-campaign",
        [Cl.uint(campaignId1), Cl.uint(contentId1)],
        advertiser1
      );

      // Try to set as active (still pending)
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "set-active-content",
        [Cl.uint(campaignId1), Cl.uint(contentId1)],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(105)); // err-invalid-status
    });
  });

  describe("Content Variants", () => {
    let parentContentId: number;
    let variantContentId: number;

    beforeEach(() => {
      // Register parent content
      const parent = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );
      parentContentId = 1;

      // Register variant content
      const variant = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucd"),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8("Variant Ad"),
          Cl.stringUtf8("Variant description"),
          Cl.stringUtf8("Try Now"),
          Cl.stringUtf8("https://example.com/variant"),
          Cl.list([Cl.stringAscii("variant")])
        ],
        advertiser1
      );
      variantContentId = 2;
    });

    it("should create content variant", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "create-content-variant",
        [Cl.uint(parentContentId), Cl.uint(variantContentId)],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const variants = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content-variants",
        [Cl.uint(parentContentId)],
        deployer
      );

      expect(variants.result).toBeSome(
        Cl.tuple({
          "variant-ids": Cl.list([Cl.uint(variantContentId)]),
          "test-mode": Cl.bool(true)
        })
      );
    });

    it("should prevent non-owner from creating variants", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "create-content-variant",
        [Cl.uint(parentContentId), Cl.uint(variantContentId)],
        advertiser2
      );

      expect(result.result).toBeErr(Cl.uint(104)); // err-unauthorized
    });

    it("should prevent creating variant for different campaign", () => {
      // Register content for different campaign
      const otherContent = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId2),
          Cl.stringAscii("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucf"),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8("Other Campaign"),
          Cl.stringUtf8("Other description"),
          Cl.stringUtf8("Click"),
          Cl.stringUtf8("https://example.com/other"),
          Cl.list([Cl.stringAscii("other")])
        ],
        advertiser2
      );
      const otherContentId = 3;

      const result = simnet.callPublicFn(
        "ad-content-registry",
        "create-content-variant",
        [Cl.uint(parentContentId), Cl.uint(otherContentId)],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(103)); // err-invalid-content
    });
  });

  describe("Content Archiving", () => {
    let contentId: number;

    beforeEach(() => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );
      contentId = 1;
    });

    it("should allow owner to archive content", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "archive-content",
        [Cl.uint(contentId)],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const content = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content",
        [Cl.uint(contentId)],
        deployer
      );

      expect(content.value.data.status).toBeUint(4); // STATUS-ARCHIVED
    });

    it("should prevent non-owner from archiving", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "archive-content",
        [Cl.uint(contentId)],
        advertiser2
      );

      expect(result.result).toBeErr(Cl.uint(104)); // err-unauthorized
    });
  });

  describe("Admin Functions", () => {
    it("should allow owner to set flag threshold", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "set-flag-threshold",
        [Cl.uint(10)],
        contractOwner
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const threshold = simnet.getDataVar("ad-content-registry", "flag-threshold");
      expect(threshold).toBeUint(10);
    });

    it("should prevent non-owner from setting flag threshold", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "set-flag-threshold",
        [Cl.uint(10)],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(100)); // err-owner-only
    });

    it("should allow owner to set content size limits", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "set-content-size-limits",
        [Cl.uint(1000), Cl.uint(1000000)],
        contractOwner
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const minSize = simnet.getDataVar("ad-content-registry", "min-content-size");
      const maxSize = simnet.getDataVar("ad-content-registry", "max-content-size");
      
      expect(minSize).toBeUint(1000);
      expect(maxSize).toBeUint(1000000);
    });

    it("should reject invalid size limits", () => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "set-content-size-limits",
        [Cl.uint(1000000), Cl.uint(1000)], // min > max
        contractOwner
      );

      expect(result.result).toBeErr(Cl.uint(103)); // err-invalid-content
    });
  });

  describe("Read-Only Functions", () => {
    let contentId: number;

    beforeEach(() => {
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );
      contentId = 1;

      // Approve content
      simnet.callPublicFn(
        "ad-content-registry",
        "update-content-status",
        [Cl.uint(contentId), Cl.uint(1)],
        contractOwner
      );
    });

    it("should check if content is approved", () => {
      const result = simnet.callReadOnlyFn(
        "ad-content-registry",
        "is-content-approved",
        [Cl.uint(contentId)],
        deployer
      );

      expect(result.result).toBe(Cl.bool(true));
    });

    it("should return false for non-approved content", () => {
      // Create new pending content
      const newContent = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId2),
          Cl.stringAscii("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucd"),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8("Pending"),
          Cl.stringUtf8("Description"),
          Cl.stringUtf8("CTA"),
          Cl.stringUtf8("https://example.com"),
          validTags
        ],
        advertiser2
      );
      const newContentId = 2;

      const result = simnet.callReadOnlyFn(
        "ad-content-registry",
        "is-content-approved",
        [Cl.uint(newContentId)],
        deployer
      );

      expect(result.result).toBe(Cl.bool(false));
    });

    it("should return none for non-existent content in getters", () => {
      const content = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content",
        [Cl.uint(999)],
        deployer
      );
      expect(content.result).toBeNone();

      const metadata = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content-metadata",
        [Cl.uint(999)],
        deployer
      );
      expect(metadata.result).toBeNone();

      const performance = simnet.callReadOnlyFn(
        "ad-content-registry",
        "get-content-performance",
        [Cl.uint(999)],
        deployer
      );
      expect(performance.result).toBeNone();
    });
  });

  describe("Edge Cases", () => {
    it("should handle maximum content IDs", () => {
      // Set nonce to near max
      simnet.setDataVar("ad-content-registry", "content-nonce", Cl.uint(999999));
      
      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(validTitle),
          Cl.stringUtf8(validDescription),
          Cl.stringUtf8(validCTA),
          Cl.stringUtf8(validUrl),
          validTags
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.uint(1000000));
    });

    it("should handle maximum string lengths", () => {
      const longTitle = "a".repeat(100) as `${string}`;
      const longDescription = "b".repeat(500) as `${string}`;
      const longCTA = "c".repeat(50) as `${string}`;
      const longUrl = "https://" + "a".repeat(190) + ".com" as `${string}`;

      const result = simnet.callPublicFn(
        "ad-content-registry",
        "register-ad-content",
        [
          Cl.uint(campaignId1),
          Cl.stringAscii(validIpfsHash),
          Cl.uint(validFormat),
          Cl.uint(validSize),
          Cl.stringUtf8(longTitle),
          Cl.stringUtf8(longDescription),
          Cl.stringUtf8(longCTA),
          Cl.stringUtf8(longUrl),
          validTags
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.uint(1));
    });
  });
});
