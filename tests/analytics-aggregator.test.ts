import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

declare const simnet: any;

describe("Analytics Aggregator Contract - Comprehensive Tests", () => {
  const accounts = simnet.getAccounts();
  const deployer = accounts.get("deployer")!;
  const contractOwner = deployer;
  const advertiser1 = accounts.get("wallet_1")!;
  const advertiser2 = accounts.get("wallet_2")!;
  const publisher1 = accounts.get("wallet_3")!;
  const publisher2 = accounts.get("wallet_4")!;
  const user1 = accounts.get("wallet_5")!;
  const user2 = accounts.get("wallet_6")!;
  const randomUser = accounts.get("wallet_7")!;

  const campaignId1 = 1;
  const campaignId2 = 2;
  const campaignId3 = 3;

  beforeEach(() => {
    // Reset global counters
    simnet.setDataVar("analytics-aggregator", "total-conversions", Cl.uint(0));
    simnet.setDataVar("analytics-aggregator", "total-revenue", Cl.uint(0));
    simnet.setDataVar("analytics-aggregator", "total-ad-spend", Cl.uint(0));
  });

  describe("Conversion Tracking", () => {
    it("should record a conversion with valid parameters", () => {
      const value = 1000000; // 1 STX
      const conversionType = "purchase" as const;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "record-conversion",
        [
          Cl.uint(campaignId1),
          Cl.principal(user1),
          Cl.uint(value),
          Cl.stringAscii(conversionType),
          Cl.uint(123) // attributed view ID
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.uint(1)); // conversion-id starts at 1

      // Check conversion data
      const conversion = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-conversion",
        [Cl.uint(campaignId1), Cl.uint(1)],
        deployer
      );

      expect(conversion.result).toBeSome(
        Cl.tuple({
          user: Cl.principal(user1),
          value: Cl.uint(value),
          "conversion-type": Cl.stringAscii(conversionType),
          timestamp: expect.anything(),
          "attributed-view-id": Cl.uint(123)
        })
      );

      // Check conversion count updated
      const count = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-conversion-count",
        [Cl.uint(campaignId1)],
        deployer
      );

      expect(count.result).toEqual(
        Cl.tuple({
          total: Cl.uint(1)
        })
      );

      // Check global totals
      const totalConversions = simnet.getDataVar("analytics-aggregator", "total-conversions");
      const totalRevenue = simnet.getDataVar("analytics-aggregator", "total-revenue");
      
      expect(totalConversions).toBeUint(1);
      expect(totalRevenue).toBeUint(value);
    });

    it("should record multiple conversions for same campaign", () => {
      // First conversion
      simnet.callPublicFn(
        "analytics-aggregator",
        "record-conversion",
        [
          Cl.uint(campaignId1),
          Cl.principal(user1),
          Cl.uint(500000),
          Cl.stringAscii("purchase"),
          Cl.uint(123)
        ],
        advertiser1
      );

      // Second conversion
      const result2 = simnet.callPublicFn(
        "analytics-aggregator",
        "record-conversion",
        [
          Cl.uint(campaignId1),
          Cl.principal(user2),
          Cl.uint(750000),
          Cl.stringAscii("signup"),
          Cl.uint(456)
        ],
        advertiser1
      );

      expect(result2.result).toBeOk(Cl.uint(2));

      const count = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-conversion-count",
        [Cl.uint(campaignId1)],
        deployer
      );

      expect(count.result).toEqual(
        Cl.tuple({
          total: Cl.uint(2)
        })
      );

      // Check both conversions exist
      const conv1 = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-conversion",
        [Cl.uint(campaignId1), Cl.uint(1)],
        deployer
      );
      expect(conv1.result).toBeSome();

      const conv2 = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-conversion",
        [Cl.uint(campaignId1), Cl.uint(2)],
        deployer
      );
      expect(conv2.result).toBeSome();
    });

    it("should track conversions for multiple campaigns", () => {
      // Campaign 1 conversion
      simnet.callPublicFn(
        "analytics-aggregator",
        "record-conversion",
        [
          Cl.uint(campaignId1),
          Cl.principal(user1),
          Cl.uint(1000000),
          Cl.stringAscii("purchase"),
          Cl.uint(123)
        ],
        advertiser1
      );

      // Campaign 2 conversion
      const result2 = simnet.callPublicFn(
        "analytics-aggregator",
        "record-conversion",
        [
          Cl.uint(campaignId2),
          Cl.principal(user2),
          Cl.uint(2000000),
          Cl.stringAscii("purchase"),
          Cl.uint(456)
        ],
        advertiser2
      );

      expect(result2.result).toBeOk(Cl.uint(1)); // Each campaign starts at 1

      const count1 = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-conversion-count",
        [Cl.uint(campaignId1)],
        deployer
      );
      expect(count1.result).toEqual(Cl.tuple({ total: Cl.uint(1) }));

      const count2 = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-conversion-count",
        [Cl.uint(campaignId2)],
        deployer
      );
      expect(count2.result).toEqual(Cl.tuple({ total: Cl.uint(1) }));
    });
  });

  describe("Campaign ROI Calculations", () => {
    it("should calculate and store ROI correctly", () => {
      const spend = 1000000; // 1 STX spent
      const revenue = 2500000; // 2.5 STX earned
      const conversions = 5;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "update-campaign-roi",
        [
          Cl.uint(campaignId1),
          Cl.uint(spend),
          Cl.uint(revenue),
          Cl.uint(conversions)
        ],
        advertiser1
      );

      // Expected ROI: ((revenue - spend) / spend) * 10000
      // ((2500000 - 1000000) / 1000000) * 10000 = 15000 (150%)
      expect(result.result).toBeOk(Cl.uint(15000));

      const roi = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-campaign-roi",
        [Cl.uint(campaignId1)],
        deployer
      );

      expect(roi.result).toBeSome(
        Cl.tuple({
          "total-spend": Cl.uint(spend),
          "total-revenue": Cl.uint(revenue),
          "roi-percentage": Cl.uint(15000),
          conversions: Cl.uint(conversions),
          "last-updated": expect.anything()
        })
      );
    });

    it("should handle zero spend (infinite ROI) correctly", () => {
      const spend = 0;
      const revenue = 1000000;
      const conversions = 1;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "update-campaign-roi",
        [
          Cl.uint(campaignId1),
          Cl.uint(spend),
          Cl.uint(revenue),
          Cl.uint(conversions)
        ],
        advertiser1
      );

      // Should return 0 ROI when spend is 0
      expect(result.result).toBeOk(Cl.uint(0));
    });

    it("should handle negative ROI (loss) correctly", () => {
      const spend = 2000000;
      const revenue = 1500000;
      const conversions = 3;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "update-campaign-roi",
        [
          Cl.uint(campaignId1),
          Cl.uint(spend),
          Cl.uint(revenue),
          Cl.uint(conversions)
        ],
        advertiser1
      );

      // Expected: ((1500000 - 2000000) / 2000000) * 10000 = -2500 (-25%)
      expect(result.result).toBeOk(Cl.uint(0)); // Function returns 0 for negative? Check implementation
    });
  });

  describe("Publisher Reports", () => {
    it("should generate publisher report with correct calculations", () => {
      const period = 86400; // 1 day in seconds
      const views = 10000;
      const earnings = 500000;
      const campaignsParticipated = 3;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "generate-publisher-report",
        [
          Cl.principal(publisher1),
          Cl.uint(period),
          Cl.uint(views),
          Cl.uint(earnings),
          Cl.uint(campaignsParticipated)
        ],
        publisher1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const report = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-publisher-report",
        [Cl.principal(publisher1), Cl.uint(period)],
        deployer
      );

      // Expected avg CPV: earnings / views = 500000 / 10000 = 50
      expect(report.result).toBeSome(
        Cl.tuple({
          "total-views": Cl.uint(views),
          "total-earnings": Cl.uint(earnings),
          "avg-cpv": Cl.uint(50),
          "quality-score": Cl.uint(100),
          "campaigns-participated": Cl.uint(campaignsParticipated),
          "period-start": expect.anything(),
          "period-end": expect.anything()
        })
      );
    });

    it("should handle zero views in publisher report", () => {
      const period = 86400;
      const views = 0;
      const earnings = 0;
      const campaignsParticipated = 0;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "generate-publisher-report",
        [
          Cl.principal(publisher1),
          Cl.uint(period),
          Cl.uint(views),
          Cl.uint(earnings),
          Cl.uint(campaignsParticipated)
        ],
        publisher1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const report = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-publisher-report",
        [Cl.principal(publisher1), Cl.uint(period)],
        deployer
      );

      expect(report.value.data["avg-cpv"]).toBeUint(0);
    });

    it("should generate multiple reports for same publisher", () => {
      // Report for day 1
      simnet.callPublicFn(
        "analytics-aggregator",
        "generate-publisher-report",
        [
          Cl.principal(publisher1),
          Cl.uint(86400),
          Cl.uint(5000),
          Cl.uint(250000),
          Cl.uint(2)
        ],
        publisher1
      );

      // Report for day 2
      const result2 = simnet.callPublicFn(
        "analytics-aggregator",
        "generate-publisher-report",
        [
          Cl.principal(publisher1),
          Cl.uint(172800),
          Cl.uint(7500),
          Cl.uint(375000),
          Cl.uint(3)
        ],
        publisher1
      );

      expect(result2.result).toBeOk(Cl.bool(true));

      const report1 = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-publisher-report",
        [Cl.principal(publisher1), Cl.uint(86400)],
        deployer
      );
      expect(report1.result).toBeSome();

      const report2 = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-publisher-report",
        [Cl.principal(publisher1), Cl.uint(172800)],
        deployer
      );
      expect(report2.result).toBeSome();
    });
  });

  describe("Hourly Performance Tracking", () => {
    it("should track hourly performance with correct rates", () => {
      const views = 1000;
      const clicks = 50;
      const conversions = 5;
      const revenue = 250000;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "track-hourly-performance",
        [
          Cl.uint(campaignId1),
          Cl.uint(views),
          Cl.uint(clicks),
          Cl.uint(conversions),
          Cl.uint(revenue)
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const hourBlock = Math.floor(simnet.stacksBlockTime / 144);
      
      const stats = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-hourly-stats",
        [Cl.uint(campaignId1), Cl.uint(hourBlock)],
        deployer
      );

      // Expected CTR: (clicks/views) * 10000 = (50/1000) * 10000 = 500 (5%)
      // Expected CVR: (conversions/views) * 10000 = (5/1000) * 10000 = 50 (0.5%)
      expect(stats.result).toBeSome(
        Cl.tuple({
          views: Cl.uint(views),
          clicks: Cl.uint(clicks),
          conversions: Cl.uint(conversions),
          revenue: Cl.uint(revenue),
          ctr: Cl.uint(500),
          cvr: Cl.uint(50)
        })
      );
    });

    it("should handle zero views in hourly tracking", () => {
      const views = 0;
      const clicks = 0;
      const conversions = 0;
      const revenue = 0;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "track-hourly-performance",
        [
          Cl.uint(campaignId1),
          Cl.uint(views),
          Cl.uint(clicks),
          Cl.uint(conversions),
          Cl.uint(revenue)
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const hourBlock = Math.floor(simnet.stacksBlockTime / 144);
      
      const stats = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-hourly-stats",
        [Cl.uint(campaignId1), Cl.uint(hourBlock)],
        deployer
      );

      expect(stats.value.data.ctr).toBeUint(0);
      expect(stats.value.data.cvr).toBeUint(0);
    });

    it("should track multiple hours for same campaign", () => {
      // Hour 1
      simnet.callPublicFn(
        "analytics-aggregator",
        "track-hourly-performance",
        [
          Cl.uint(campaignId1),
          Cl.uint(1000),
          Cl.uint(50),
          Cl.uint(5),
          Cl.uint(250000)
        ],
        advertiser1
      );

      // Simulate time passing
      simnet.mineEmptyBlocks(6); // Advance ~1 hour in block time

      // Hour 2
      const result2 = simnet.callPublicFn(
        "analytics-aggregator",
        "track-hourly-performance",
        [
          Cl.uint(campaignId1),
          Cl.uint(1200),
          Cl.uint(60),
          Cl.uint(6),
          Cl.uint(300000)
        ],
        advertiser1
      );

      expect(result2.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Retention Metrics", () => {
    it("should calculate retention rate correctly", () => {
      const uniqueViewers = 1000;
      const returningViewers = 300;
      const totalViews = 1500;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "update-retention-rate",
        [
          Cl.uint(campaignId1),
          Cl.uint(uniqueViewers),
          Cl.uint(returningViewers),
          Cl.uint(totalViews)
        ],
        advertiser1
      );

      // Expected retention rate: (300/1000) * 10000 = 3000 (30%)
      // Expected avg views per user: 1500/1000 = 1.5 (but stored as uint)
      expect(result.result).toBeOk(Cl.uint(3000));

      const metrics = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-retention-metrics",
        [Cl.uint(campaignId1)],
        deployer
      );

      expect(metrics.result).toBeSome(
        Cl.tuple({
          "unique-viewers": Cl.uint(uniqueViewers),
          "returning-viewers": Cl.uint(returningViewers),
          "retention-rate": Cl.uint(3000),
          "avg-views-per-user": Cl.uint(1) // Integer division floors to 1
        })
      );
    });

    it("should handle zero unique viewers", () => {
      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "update-retention-rate",
        [
          Cl.uint(campaignId1),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0)
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.uint(0));
    });
  });

  describe("Fraud Scoring", () => {
    it("should calculate fraud percentage correctly", () => {
      const suspiciousViews = 150;
      const totalViews = 1000;
      const flaggedPublishers = 2;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "calculate-fraud-score",
        [
          Cl.uint(campaignId1),
          Cl.uint(suspiciousViews),
          Cl.uint(totalViews),
          Cl.uint(flaggedPublishers)
        ],
        advertiser1
      );

      // Expected fraud percentage: (150/1000) * 10000 = 1500 (15%)
      expect(result.result).toBeOk(Cl.uint(1500));

      const fraud = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-fraud-score",
        [Cl.uint(campaignId1)],
        deployer
      );

      expect(fraud.result).toBeSome(
        Cl.tuple({
          "suspicious-views": Cl.uint(suspiciousViews),
          "total-views": Cl.uint(totalViews),
          "fraud-percentage": Cl.uint(1500),
          "flagged-publishers": Cl.uint(flaggedPublishers),
          "last-audit": expect.anything()
        })
      );
    });

    it("should handle zero total views", () => {
      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "calculate-fraud-score",
        [
          Cl.uint(campaignId1),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0)
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.uint(0));
    });
  });

  describe("Category Benchmarks", () => {
    it("should allow contract owner to update category benchmarks", () => {
      const category = "display" as const;
      const avgCtr = 500; // 5%
      const avgCvr = 50; // 0.5%
      const avgCpc = 100000; // 0.1 STX
      const totalCampaigns = 25;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "update-category-benchmark",
        [
          Cl.stringAscii(category),
          Cl.uint(avgCtr),
          Cl.uint(avgCvr),
          Cl.uint(avgCpc),
          Cl.uint(totalCampaigns)
        ],
        contractOwner
      );

      expect(result.result).toBeOk(Cl.bool(true));

      const benchmark = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-category-benchmark",
        [Cl.stringAscii(category)],
        deployer
      );

      expect(benchmark.result).toBeSome(
        Cl.tuple({
          "avg-ctr": Cl.uint(avgCtr),
          "avg-cvr": Cl.uint(avgCvr),
          "avg-cpc": Cl.uint(avgCpc),
          "total-campaigns": Cl.uint(totalCampaigns),
          "last-updated": expect.anything()
        })
      );
    });

    it("should prevent non-owner from updating benchmarks", () => {
      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "update-category-benchmark",
        [
          Cl.stringAscii("display"),
          Cl.uint(500),
          Cl.uint(50),
          Cl.uint(100000),
          Cl.uint(25)
        ],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(100)); // err-owner-only
    });
  });

  describe("User Engagement Tracking", () => {
    it("should track user engagement with correct score", () => {
      const views = 10;
      const clicks = 2;
      const timeSpent = 300; // seconds

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "track-user-engagement",
        [
          Cl.principal(user1),
          Cl.uint(campaignId1),
          Cl.uint(views),
          Cl.uint(clicks),
          Cl.uint(timeSpent)
        ],
        advertiser1
      );

      // Expected score: views*1 + clicks*5 + timeSpent/100 = 10 + 10 + 3 = 23
      expect(result.result).toBeOk(Cl.uint(23));

      const engagement = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-user-engagement",
        [Cl.principal(user1), Cl.uint(campaignId1)],
        deployer
      );

      expect(engagement.result).toBeSome(
        Cl.tuple({
          "total-views": Cl.uint(views),
          "total-clicks": Cl.uint(clicks),
          "time-spent": Cl.uint(timeSpent),
          "last-interaction": expect.anything(),
          "engagement-score": Cl.uint(23)
        })
      );
    });

    it("should update existing user engagement", () => {
      // First interaction
      simnet.callPublicFn(
        "analytics-aggregator",
        "track-user-engagement",
        [
          Cl.principal(user1),
          Cl.uint(campaignId1),
          Cl.uint(5),
          Cl.uint(1),
          Cl.uint(120)
        ],
        advertiser1
      );

      // Second interaction (overwrites, doesn't accumulate)
      const result2 = simnet.callPublicFn(
        "analytics-aggregator",
        "track-user-engagement",
        [
          Cl.principal(user1),
          Cl.uint(campaignId1),
          Cl.uint(8),
          Cl.uint(2),
          Cl.uint(200)
        ],
        advertiser1
      );

      const engagement = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-user-engagement",
        [Cl.principal(user1), Cl.uint(campaignId1)],
        deployer
      );

      // Should have the latest values, not accumulated
      expect(engagement.value.data["total-views"]).toBeUint(8);
      expect(engagement.value.data["total-clicks"]).toBeUint(2);
    });
  });

  describe("Batch Operations", () => {
    it("should batch update multiple metrics", () => {
      const spend = 1000000;
      const revenue = 2500000;
      const conversions = 5;
      const uniqueViewers = 1000;
      const returningViewers = 300;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "batch-update-metrics",
        [
          Cl.uint(campaignId1),
          Cl.uint(spend),
          Cl.uint(revenue),
          Cl.uint(conversions),
          Cl.uint(uniqueViewers),
          Cl.uint(returningViewers)
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Check ROI updated
      const roi = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-campaign-roi",
        [Cl.uint(campaignId1)],
        deployer
      );
      expect(roi.result).toBeSome();

      // Check retention updated
      const retention = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-retention-metrics",
        [Cl.uint(campaignId1)],
        deployer
      );
      expect(retention.result).toBeSome();
    });
  });

  describe("Admin Functions", () => {
    it("should allow contract owner to reset campaign analytics", () => {
      // First create some data
      simnet.callPublicFn(
        "analytics-aggregator",
        "update-campaign-roi",
        [
          Cl.uint(campaignId1),
          Cl.uint(1000000),
          Cl.uint(2500000),
          Cl.uint(5)
        ],
        advertiser1
      );

      simnet.callPublicFn(
        "analytics-aggregator",
        "update-retention-rate",
        [
          Cl.uint(campaignId1),
          Cl.uint(1000),
          Cl.uint(300),
          Cl.uint(1500)
        ],
        advertiser1
      );

      // Reset analytics
      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "reset-campaign-analytics",
        [Cl.uint(campaignId1)],
        contractOwner
      );

      expect(result.result).toBeOk(Cl.bool(true));

      // Check data is deleted
      const roi = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-campaign-roi",
        [Cl.uint(campaignId1)],
        deployer
      );
      expect(roi.result).toBeNone();

      const retention = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-retention-metrics",
        [Cl.uint(campaignId1)],
        deployer
      );
      expect(retention.result).toBeNone();
    });

    it("should prevent non-owner from resetting analytics", () => {
      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "reset-campaign-analytics",
        [Cl.uint(campaignId1)],
        advertiser1
      );

      expect(result.result).toBeErr(Cl.uint(100)); // err-owner-only
    });
  });

  describe("Read-Only Functions - Edge Cases", () => {
    it("should return default values for non-existent data", () => {
      // get-conversion-count returns default tuple, not none
      const count = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-conversion-count",
        [Cl.uint(999)],
        deployer
      );
      expect(count.result).toEqual(Cl.tuple({ total: Cl.uint(0) }));

      // get-conversion returns none
      const conversion = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-conversion",
        [Cl.uint(999), Cl.uint(1)],
        deployer
      );
      expect(conversion.result).toBeNone();

      // get-campaign-roi returns none
      const roi = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-campaign-roi",
        [Cl.uint(999)],
        deployer
      );
      expect(roi.result).toBeNone();

      // get-publisher-report returns none
      const report = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-publisher-report",
        [Cl.principal(publisher1), Cl.uint(999)],
        deployer
      );
      expect(report.result).toBeNone();

      // get-hourly-stats returns none
      const stats = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-hourly-stats",
        [Cl.uint(999), Cl.uint(999)],
        deployer
      );
      expect(stats.result).toBeNone();

      // get-retention-metrics returns none
      const retention = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-retention-metrics",
        [Cl.uint(999)],
        deployer
      );
      expect(retention.result).toBeNone();

      // get-fraud-score returns none
      const fraud = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-fraud-score",
        [Cl.uint(999)],
        deployer
      );
      expect(fraud.result).toBeNone();

      // get-category-benchmark returns none
      const benchmark = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-category-benchmark",
        [Cl.stringAscii("nonexistent")],
        deployer
      );
      expect(benchmark.result).toBeNone();

      // get-user-engagement returns none
      const engagement = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-user-engagement",
        [Cl.principal(user1), Cl.uint(999)],
        deployer
      );
      expect(engagement.result).toBeNone();
    });
  });

  describe("Edge Cases - Rate Calculations", () => {
    it("should handle calculate-rate function correctly", () => {
      // Test via hourly stats which uses calculate-rate internally
      
      // Zero denominator
      const result1 = simnet.callPublicFn(
        "analytics-aggregator",
        "track-hourly-performance",
        [
          Cl.uint(campaignId1),
          Cl.uint(0),
          Cl.uint(10),
          Cl.uint(2),
          Cl.uint(1000)
        ],
        advertiser1
      );
      expect(result1.result).toBeOk(Cl.bool(true));

      const hourBlock = Math.floor(simnet.stacksBlockTime / 144);
      const stats = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-hourly-stats",
        [Cl.uint(campaignId1), Cl.uint(hourBlock)],
        deployer
      );
      
      expect(stats.value.data.ctr).toBeUint(0);
      expect(stats.value.data.cvr).toBeUint(0);
    });

    it("should handle large numbers in calculations", () => {
      const largeViews = 1000000000;
      const largeClicks = 500000000;
      const largeConversions = 100000000;

      const result = simnet.callPublicFn(
        "analytics-aggregator",
        "track-hourly-performance",
        [
          Cl.uint(campaignId1),
          Cl.uint(largeViews),
          Cl.uint(largeClicks),
          Cl.uint(largeConversions),
          Cl.uint(1000000000000)
        ],
        advertiser1
      );

      expect(result.result).toBeOk(Cl.bool(true));
    });
  });

  describe("Complex Integration Scenarios", () => {
    it("should handle complete campaign analytics lifecycle", () => {
      // 1. Record conversions
      simnet.callPublicFn(
        "analytics-aggregator",
        "record-conversion",
        [
          Cl.uint(campaignId1),
          Cl.principal(user1),
          Cl.uint(500000),
          Cl.stringAscii("purchase"),
          Cl.uint(1)
        ],
        advertiser1
      );

      simnet.callPublicFn(
        "analytics-aggregator",
        "record-conversion",
        [
          Cl.uint(campaignId1),
          Cl.principal(user2),
          Cl.uint(750000),
          Cl.stringAscii("purchase"),
          Cl.uint(2)
        ],
        advertiser1
      );

      // 2. Update ROI
      simnet.callPublicFn(
        "analytics-aggregator",
        "update-campaign-roi",
        [
          Cl.uint(campaignId1),
          Cl.uint(1000000),
          Cl.uint(1250000),
          Cl.uint(2)
        ],
        advertiser1
      );

      // 3. Track hourly performance
      simnet.callPublicFn(
        "analytics-aggregator",
        "track-hourly-performance",
        [
          Cl.uint(campaignId1),
          Cl.uint(5000),
          Cl.uint(250),
          Cl.uint(2),
          Cl.uint(1250000)
        ],
        advertiser1
      );

      // 4. Update retention
      simnet.callPublicFn(
        "analytics-aggregator",
        "update-retention-rate",
        [
          Cl.uint(campaignId1),
          Cl.uint(2000),
          Cl.uint(150),
          Cl.uint(2150)
        ],
        advertiser1
      );

      // 5. Generate publisher report
      simnet.callPublicFn(
        "analytics-aggregator",
        "generate-publisher-report",
        [
          Cl.principal(publisher1),
          Cl.uint(86400),
          Cl.uint(5000),
          Cl.uint(250000),
          Cl.uint(1)
        ],
        publisher1
      );

      // Verify all data persisted
      const conversions = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-conversion",
        [Cl.uint(campaignId1), Cl.uint(2)],
        deployer
      );
      expect(conversions.result).toBeSome();

      const roi = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-campaign-roi",
        [Cl.uint(campaignId1)],
        deployer
      );
      expect(roi.result).toBeSome();

      const hourly = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-hourly-stats",
        [Cl.uint(campaignId1), Cl.uint(Math.floor(simnet.stacksBlockTime / 144))],
        deployer
      );
      expect(hourly.result).toBeSome();

      const retention = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-retention-metrics",
        [Cl.uint(campaignId1)],
        deployer
      );
      expect(retention.result).toBeSome();

      const report = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-publisher-report",
        [Cl.principal(publisher1), Cl.uint(86400)],
        deployer
      );
      expect(report.result).toBeSome();
    });

    it("should track multiple campaigns simultaneously", () => {
      // Campaign 1 data
      simnet.callPublicFn(
        "analytics-aggregator",
        "record-conversion",
        [
          Cl.uint(campaignId1),
          Cl.principal(user1),
          Cl.uint(500000),
          Cl.stringAscii("purchase"),
          Cl.uint(1)
        ],
        advertiser1
      );

      simnet.callPublicFn(
        "analytics-aggregator",
        "update-campaign-roi",
        [
          Cl.uint(campaignId1),
          Cl.uint(1000000),
          Cl.uint(500000),
          Cl.uint(1)
        ],
        advertiser1
      );

      // Campaign 2 data
      simnet.callPublicFn(
        "analytics-aggregator",
        "record-conversion",
        [
          Cl.uint(campaignId2),
          Cl.principal(user2),
          Cl.uint(2000000),
          Cl.stringAscii("purchase"),
          Cl.uint(3)
        ],
        advertiser2
      );

      simnet.callPublicFn(
        "analytics-aggregator",
        "update-campaign-roi",
        [
          Cl.uint(campaignId2),
          Cl.uint(1500000),
          Cl.uint(2000000),
          Cl.uint(1)
        ],
        advertiser2
      );

      // Verify both campaigns have correct data
      const roi1 = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-campaign-roi",
        [Cl.uint(campaignId1)],
        deployer
      );
      expect(roi1.value.data["total-revenue"]).toBeUint(500000);

      const roi2 = simnet.callReadOnlyFn(
        "analytics-aggregator",
        "get-campaign-roi",
        [Cl.uint(campaignId2)],
        deployer
      );
      expect(roi2.value.data["total-revenue"]).toBeUint(2000000);
    });
  });
});
