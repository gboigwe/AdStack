import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

declare const simnet: any;

describe("Ad Creative NFT Contract - Comprehensive Tests", () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const contractOwner = deployer;
  const creator1 = accounts.get("wallet_1")!;
  const creator2 = accounts.get("wallet_2")!;
  const buyer1 = accounts.get("wallet_3")!;
  const buyer2 = accounts.get("wallet_4")!;
  const randomUser = accounts.get("wallet_5")!;

  const validName = "Summer Campaign Ad 2024" as const;
  const validDescription = "A vibrant summer advertisement featuring beach scenes and products" as const;
  const validIpfsHash = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const validMediaType = "image/jpeg" as const;
  const validLicenseType = "standard" as const;
  const validCategory = "display" as const;
  const validTags = Cl.list([
    Cl.stringAscii("summer"),
    Cl.stringAscii("beach"),
    Cl.stringAscii("products")
  ]);

  const defaultRoyaltyPercentage = 10; // 10%

  beforeEach(() => {
    // Reset contract state
    simnet.setDataVar("ad-creative-nft", "last-token-id", Cl.uint(0));
    simnet.setDataVar("ad-creative-nft", "royalty-percentage", Cl.uint(defaultRoyaltyPercentage));
  });

  describe("SIP-009 Compliance", () => {
    it("should implement SIP-009 required functions", () => {
      // Check get-last-token-id
      const lastTokenId = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(lastTokenId.result).toBeOk(Cl.uint(0));

      // Check get-token-uri
      const tokenUri = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-token-uri",
        [Cl.uint(1)],
        deployer
      );
      expect(tokenUri.result).toBeOk(Cl.none());

      // Check get-owner
      const owner = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toBeOk(Cl.none());
    });

    it("should support NFT transfers", () => {
      // Mint NFT first
      const mint = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );
      const tokenId = 1;

      // Transfer NFT
      const transfer = simnet.callPublicFn(
        "ad-creative-nft",
        "transfer",
        [Cl.uint(tokenId), Cl.principal(creator1), Cl.principal(buyer1)],
        creator1
      );

      expect(transfer.result).toBeOk(Cl.bool(true));

      // Verify new owner
      const owner = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-owner",
        [Cl.uint(tokenId)],
        deployer
      );
      expect(owner.result).toBeOk(Cl.some(Cl.principal(buyer1)));
    });

    it("should prevent unauthorized transfers", () => {
      // Mint NFT
      simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );
      const tokenId = 1;

      // Try to transfer from wrong sender
      const transfer = simnet.callPublicFn(
        "ad-creative-nft",
        "transfer",
        [Cl.uint(tokenId), Cl.principal(creator1), Cl.principal(buyer1)],
        buyer1
      );

      expect(transfer.result).toBeErr(Cl.uint(20000)); // ERR_UNAUTHORIZED
    });
  });

  describe("Minting", () => {
    it("should mint a new creative NFT with valid parameters", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );

      expect(result.result).toBeOk(Cl.uint(1));

      // Check NFT ownership
      const owner = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-owner",
        [Cl.uint(1)],
        deployer
      );
      expect(owner.result).toBeOk(Cl.some(Cl.principal(creator1)));

      // Check creative info
      const creative = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-creative-info",
        [Cl.uint(1)],
        deployer
      );

      expect(creative.result).toBeSome(
        Cl.tuple({
          creator: Cl.principal(creator1),
          name: Cl.stringUtf8(validName),
          description: Cl.stringUtf8(validDescription),
          "ipfs-hash": Cl.stringAscii(validIpfsHash),
          "media-type": Cl.stringAscii(validMediaType),
          "created-at": expect.anything(),
          "minted-at": expect.anything(),
          "total-impressions": Cl.uint(0),
          "total-revenue": Cl.uint(0)
        })
      );

      // Check royalty info
      const royalty = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-royalty-info",
        [Cl.uint(1)],
        deployer
      );

      expect(royalty.result).toBeSome(
        Cl.tuple({
          "creator-royalty": Cl.uint(defaultRoyaltyPercentage),
          "total-secondary-sales": Cl.uint(0),
          "last-sale-price": Cl.uint(0),
          "total-royalties-paid": Cl.uint(0)
        })
      );

      // Check license
      const license = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-license",
        [Cl.uint(1)],
        deployer
      );

      expect(license.result).toBeSome(
        Cl.tuple({
          "license-type": Cl.stringAscii(validLicenseType),
          "commercial-use": Cl.bool(true),
          "derivative-works": Cl.bool(false),
          "attribution-required": Cl.bool(true)
        })
      );

      // Check category
      const category = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-category-info",
        [Cl.uint(1)],
        deployer
      );

      expect(category.result).toBeSome(
        Cl.tuple({
          category: Cl.stringAscii(validCategory),
          tags: validTags,
          dimensions: Cl.stringAscii(""),
          "file-size": Cl.uint(0)
        })
      );
    });

    it("should mint multiple NFTs with incrementing token IDs", () => {
      // First mint
      simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );

      // Second mint
      const result2 = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8("Second Creative"),
          Cl.stringUtf8("Another description"),
          Cl.stringAscii("QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6ucd"),
          Cl.stringAscii("video/mp4"),
          Cl.stringAscii("premium"),
          Cl.bool(false),
          Cl.stringAscii("video"),
          Cl.list([Cl.stringAscii("video"), Cl.stringAscii("premium")])
        ],
        creator2
      );

      expect(result2.result).toBeOk(Cl.uint(2));

      const lastTokenId = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-last-token-id",
        [],
        deployer
      );
      expect(lastTokenId.result).toBeOk(Cl.uint(2));
    });

    it("should reject minting with empty name", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(""),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );

      expect(result.result).toBeErr(Cl.uint(20003)); // ERR_INVALID_PARAMS
    });

    it("should reject minting with empty IPFS hash", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(""),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );

      expect(result.result).toBeErr(Cl.uint(20003)); // ERR_INVALID_PARAMS
    });
  });

  describe("Secondary Sales with Royalties", () => {
    let tokenId: number;

    beforeEach(() => {
      const mint = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );
      tokenId = 1;
    });

    it("should execute sale with royalty payment", () => {
      const salePrice = 1000000; // 1 STX
      const royaltyAmount = (salePrice * defaultRoyaltyPercentage) / 100;
      const sellerAmount = salePrice - royaltyAmount;

      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "sell-with-royalty",
        [Cl.uint(tokenId), Cl.principal(buyer1), Cl.uint(salePrice)],
        creator1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Check royalty transfer to creator
      expect(result.events[0].event).toBe("stx_transfer_event");
      expect(result.events[0].data.amount).toBe(royaltyAmount.toString());
      expect(result.events[0].data.sender).toBe(buyer1);
      expect(result.events[0].data.recipient).toBe(creator1);

      // Check payment to seller
      expect(result.events[1].event).toBe("stx_transfer_event");
      expect(result.events[1].data.amount).toBe(sellerAmount.toString());
      expect(result.events[1].data.sender).toBe(buyer1);
      expect(result.events[1].data.recipient).toBe(creator1);

      // Check NFT transfer
      expect(result.events[2].event).toBe("nft_transfer_event");
      expect(result.events[2].data.sender).toBe(creator1);
      expect(result.events[2].data.recipient).toBe(buyer1);
      expect(result.events[2].data.value.value).toBe(tokenId);

      // Verify royalty info updated
      const royalty = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-royalty-info",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(royalty.value.data["total-secondary-sales"]).toBeUint(1);
      expect(royalty.value.data["last-sale-price"]).toBeUint(salePrice);
      expect(royalty.value.data["total-royalties-paid"]).toBeUint(royaltyAmount);
    });

    it("should handle sale with zero royalty (if royalty set to 0)", () => {
      // Set royalty to 0
      simnet.callPublicFn(
        "ad-creative-nft",
        "set-royalty-percentage",
        [Cl.uint(0)],
        contractOwner
      );

      const salePrice = 1000000;

      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "sell-with-royalty",
        [Cl.uint(tokenId), Cl.principal(buyer1), Cl.uint(salePrice)],
        creator1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Only one STX transfer (to seller, no royalty)
      expect(result.events[0].event).toBe("stx_transfer_event");
      expect(result.events[0].data.amount).toBe(salePrice.toString());
      expect(result.events.length).toBe(2); // STX transfer + NFT transfer
    });

    it("should prevent sale by non-owner", () => {
      const salePrice = 1000000;

      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "sell-with-royalty",
        [Cl.uint(tokenId), Cl.principal(buyer1), Cl.uint(salePrice)],
        buyer1
      );

      expect(result.result).toBeErr(Cl.uint(20000)); // ERR_UNAUTHORIZED
    });

    it("should reject sale with zero price", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "sell-with-royalty",
        [Cl.uint(tokenId), Cl.principal(buyer1), Cl.uint(0)],
        creator1
      );

      expect(result.result).toBeErr(Cl.uint(20003)); // ERR_INVALID_PARAMS
    });

    it("should calculate royalty correctly", () => {
      const salePrice = 1000000;
      const expectedRoyalty = (salePrice * defaultRoyaltyPercentage) / 100;

      const royalty = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "calculate-royalty",
        [Cl.uint(salePrice), Cl.uint(tokenId)],
        deployer
      );

      expect(royalty.result).toBeOk(Cl.uint(expectedRoyalty));
    });
  });

  describe("Creative Metrics", () => {
    let tokenId: number;

    beforeEach(() => {
      const mint = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );
      tokenId = 1;
    });

    it("should allow owner to update metrics", () => {
      const impressions = 1000;
      const revenue = 500000;

      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "update-creative-metrics",
        [Cl.uint(tokenId), Cl.uint(impressions), Cl.uint(revenue)],
        creator1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const creative = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-creative-info",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(creative.value.data["total-impressions"]).toBeUint(impressions);
      expect(creative.value.data["total-revenue"]).toBeUint(revenue);
    });

    it("should allow contract owner to update metrics", () => {
      const impressions = 2000;
      const revenue = 750000;

      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "update-creative-metrics",
        [Cl.uint(tokenId), Cl.uint(impressions), Cl.uint(revenue)],
        contractOwner
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("should accumulate metrics over multiple updates", () => {
      // First update
      simnet.callPublicFn(
        "ad-creative-nft",
        "update-creative-metrics",
        [Cl.uint(tokenId), Cl.uint(1000), Cl.uint(500000)],
        creator1
      );

      // Second update
      simnet.callPublicFn(
        "ad-creative-nft",
        "update-creative-metrics",
        [Cl.uint(tokenId), Cl.uint(500), Cl.uint(250000)],
        creator1
      );

      const creative = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-creative-info",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(creative.value.data["total-impressions"]).toBeUint(1500);
      expect(creative.value.data["total-revenue"]).toBeUint(750000);
    });

    it("should prevent unauthorized users from updating metrics", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "update-creative-metrics",
        [Cl.uint(tokenId), Cl.uint(1000), Cl.uint(500000)],
        randomUser
      );

      expect(result.result).toBeErr(Cl.uint(20000)); // ERR_UNAUTHORIZED
    });
  });

  describe("License Management", () => {
    let tokenId: number;

    beforeEach(() => {
      const mint = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );
      tokenId = 1;
    });

    it("should allow owner to update license", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "update-license",
        [Cl.uint(tokenId), Cl.bool(false), Cl.bool(true), Cl.bool(false)],
        creator1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const license = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-license",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(license.result).toBeSome(
        Cl.tuple({
          "license-type": Cl.stringAscii(validLicenseType),
          "commercial-use": Cl.bool(false),
          "derivative-works": Cl.bool(true),
          "attribution-required": Cl.bool(false)
        })
      );
    });

    it("should prevent non-owner from updating license", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "update-license",
        [Cl.uint(tokenId), Cl.bool(false), Cl.bool(true), Cl.bool(false)],
        buyer1
      );

      expect(result.result).toBeErr(Cl.uint(20000)); // ERR_UNAUTHORIZED
    });
  });

  describe("Burning", () => {
    let tokenId: number;

    beforeEach(() => {
      const mint = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );
      tokenId = 1;
    });

    it("should allow owner to burn NFT", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "burn",
        [Cl.uint(tokenId)],
        creator1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Check NFT no longer exists
      const owner = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-owner",
        [Cl.uint(tokenId)],
        deployer
      );
      expect(owner.result).toBeOk(Cl.none());
    });

    it("should prevent non-owner from burning", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "burn",
        [Cl.uint(tokenId)],
        buyer1
      );

      expect(result.result).toBeErr(Cl.uint(20000)); // ERR_UNAUTHORIZED
    });

    it("should prevent burning non-existent NFT", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "burn",
        [Cl.uint(999)],
        creator1
      );

      expect(result.result).toBeErr(Cl.uint(20001)); // ERR_NOT_FOUND
    });
  });

  describe("Admin Functions", () => {
    it("should allow contract owner to set royalty percentage", () => {
      const newPercentage = 15;

      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "set-royalty-percentage",
        [Cl.uint(newPercentage)],
        contractOwner
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const royalty = simnet.getDataVar("ad-creative-nft", "royalty-percentage");
      expect(royalty).toBeUint(newPercentage);
    });

    it("should prevent non-owner from setting royalty", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "set-royalty-percentage",
        [Cl.uint(15)],
        creator1
      );

      expect(result.result).toBeErr(Cl.uint(20000)); // ERR_UNAUTHORIZED
    });

    it("should reject royalty percentage > 100", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "set-royalty-percentage",
        [Cl.uint(150)],
        contractOwner
      );

      expect(result.result).toBeErr(Cl.uint(20003)); // ERR_INVALID_PARAMS
    });

    it("should allow royalty percentage of 0", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "set-royalty-percentage",
        [Cl.uint(0)],
        contractOwner
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Read-Only Functions", () => {
    let tokenId: number;

    beforeEach(() => {
      const mint = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );
      tokenId = 1;
    });

    it("should return token URI (IPFS hash)", () => {
      const result = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-token-uri",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(result.result).toBeOk(Cl.some(Cl.stringAscii(validIpfsHash)));
    });

    it("should return none for non-existent token URI", () => {
      const result = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-token-uri",
        [Cl.uint(999)],
        deployer
      );

      expect(result.result).toBeOk(Cl.none());
    });

    it("should get creative info", () => {
      const result = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-creative-info",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(result.result).toBeSome();
    });

    it("should get royalty info", () => {
      const result = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-royalty-info",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(result.result).toBeSome();
    });

    it("should get license", () => {
      const result = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-license",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(result.result).toBeSome();
    });

    it("should get category info", () => {
      const result = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-category-info",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(result.result).toBeSome();
    });

    it("should return none for non-existent creative info", () => {
      const result = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-creative-info",
        [Cl.uint(999)],
        deployer
      );

      expect(result.result).toBeNone();
    });
  });

  describe("Edge Cases", () => {
    it("should handle maximum string lengths", () => {
      const longName = "a".repeat(256) as `${string}`;
      const longDescription = "b".repeat(1024) as `${string}`;
      const longCategory = "c".repeat(64) as `${string}`;
      const longTags = Cl.list([
        Cl.stringAscii("a".repeat(32)),
        Cl.stringAscii("b".repeat(32))
      ]);

      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(longName),
          Cl.stringUtf8(longDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(longCategory),
          longTags
        ],
        creator1
      );

      expect(result.result).toBeOk(Cl.uint(1));
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
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          maxTags
        ],
        creator1
      );

      expect(result.result).toBeOk(Cl.uint(1));
    });

    it("should handle multiple sales of same NFT", () => {
      // Mint
      simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(validName),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );
      const tokenId = 1;

      // First sale: creator -> buyer1
      simnet.callPublicFn(
        "ad-creative-nft",
        "sell-with-royalty",
        [Cl.uint(tokenId), Cl.principal(buyer1), Cl.uint(1000000)],
        creator1
      );

      // Second sale: buyer1 -> buyer2
      const secondSale = simnet.callPublicFn(
        "ad-creative-nft",
        "sell-with-royalty",
        [Cl.uint(tokenId), Cl.principal(buyer2), Cl.uint(2000000)],
        buyer1
      );

      expect(secondSale.result).toBeOk(Cl.bool(true));

      // Check royalty info accumulated
      const royalty = simnet.callReadOnlyFn(
        "ad-creative-nft",
        "get-royalty-info",
        [Cl.uint(tokenId)],
        deployer
      );

      expect(royalty.value.data["total-secondary-sales"]).toBeUint(2);
      expect(royalty.value.data["last-sale-price"]).toBeUint(2000000);
      
      // Total royalties: 10% of 1M + 10% of 2M = 300k
      expect(royalty.value.data["total-royalties-paid"]).toBeUint(300000);
    });
  });

  describe("Error Conditions", () => {
    it("should handle ERR_UNAUTHORIZED (20000)", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "set-royalty-percentage",
        [Cl.uint(15)],
        creator1
      );
      expect(result.result).toBeErr(Cl.uint(20000));
    });

    it("should handle ERR_NOT_FOUND (20001)", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "burn",
        [Cl.uint(999)],
        creator1
      );
      expect(result.result).toBeErr(Cl.uint(20001));
    });

    it("should handle ERR_INVALID_PARAMS (20003)", () => {
      const result = simnet.callPublicFn(
        "ad-creative-nft",
        "mint-creative",
        [
          Cl.stringUtf8(""),
          Cl.stringUtf8(validDescription),
          Cl.stringAscii(validIpfsHash),
          Cl.stringAscii(validMediaType),
          Cl.stringAscii(validLicenseType),
          Cl.bool(true),
          Cl.stringAscii(validCategory),
          validTags
        ],
        creator1
      );
      expect(result.result).toBeErr(Cl.uint(20003));
    });
  });
});
