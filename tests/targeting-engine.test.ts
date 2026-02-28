import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Targeting Engine", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Initialization", () => {
    it("starts with zero segment nonce", () => {
      const { result } = simnet.callReadOnlyFn(
        "targeting-engine",
        "get-segment-nonce",
        [],
        deployer
      );
      expect(result).toBeUint(0);
    });

    it("starts with zero rule nonce", () => {
      const { result } = simnet.callReadOnlyFn(
        "targeting-engine",
        "get-rule-nonce",
        [],
        deployer
      );
      expect(result).toBeUint(0);
    });

    it("starts with zero total matches", () => {
    it("starts with zero total matches", () => {
"vitest";
rgeting-engine",
        "get-total-matches",
        [],
        deployer
      );
      expect(result).toBeUint(0);
    });

    it("starts with zero     it("starts with zero     it("star{ result } = simnet.callReadOnlyFn(
        "t        "t    e",
        "get-total-segmen        "get-total-segmen        "get-tot;
                                       );
  });

  describe("Segment Creation", () => {
    it("creates a segment and returns segment id 1", () => {
      const { result } = simnet      const { result } = simnet      const { r        const { result } = nt"      const { result } l.stri  Utf8("Tech Enthusiasts"),
                                          in technolo                                          innt(45),
          Cl.list([Cl.stringAscii("US"), C          Cl.list([Cl.stri            Cl.list([CingAscii("blockcha          Cl.lgAscii("defi          Cl.list([Cl.stringAs          l.uint(50),
          Cl.list([Cl.uint(1), Cl.uint(2)]),
          Cl.list([Cl.stringAscii("en")]),
          Cl.uint(3),
          Cl.uint(8),
          Cl.uint(0),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("increments the segment nonce after creation", () => {
      simnet.callPubli      simnet.callPubli    gi      simnet.callPubli      simnet.callPubli    gi      simnet.calin      simnet.callPubli      simnet.cstringUtf8("D      simnet.callPubli      simnet.ca          Cl.uint(40),
          Cl.list([Cl.stringAscii("US")]          Cl.list([Cl.stringAscii("US")]          Cl.list([Cl.stringAscii("US")]          Cl.list([Cl.stringAscii("US")]          Cl.list([Cl.stringAscii("US")]  ("          Cl.list([Cl.stringAscii("US")]          Cl.list([Cl.stringAscii("US")]          Cl.list([Cl.s    );

      const { result } = simnet.callReadOnlyFn(
        "targeting-engine",
        "get-segment-nonce",
        [],
        deployer
      );
      expect(result).toBeUint(1);
                                          -age >                                         } = simnet.callPublicFn(           argeting-en                    te         -s                 [
                                           
          Cl          Cl          Cl          Cl          Cl             Cl.uint(18),
          Cl.list([]),
          Cl.list([]),
          Cl.list([]),
          Cl.uint(0),
          Cl.list([]),
          Cl.list([]),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(103));
    });

    it("rejects activity score above 100", () => {
      const { result } = simnet.callPublicFn(
        "targeting-engine",
        "create-audience-segment",
        [
          Cl.stringUtf8("Invalid Score"),
          Cl.stringUtf8("Should fail"),
          Cl.uint(18),
          Cl.uint(35),
          Cl.list([]),
          Cl.list([]),           C          C
          Cl.uint(150),
          Cl.list([]),
          Cl.list([]),
          Cl.uint(0),
          Cl.uint(0),
          Cl.uint(0),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(106));
    });
  });

  describe("User Profile Management", () => {
                                                                                    .callPublicFn(
        "targeting-engine",
        "set-user-profile",
        [
          Cl.list([Cl.stringAscii("blockchain"), Cl.stringAscii("defi")]),
          Cl.list([Cl.uint(80), Cl.uint(60)]),
          Cl.uint(28),
             stri             stri             stri      "des      ,
          Cl.stringAscii("en"),
          Cl.uint(5),
          Cl.uint(1),
        ],
        wallet1
      );
      expect(r      expect(r      expect(r      });

    it    it    it    it    nterest and weight l    it    it    it    it    nterest result } = simnet.callPublicFn(
        "targeting        "targe    "set-        "targeting        "targe    "set- ([Cl        "targetinckchain")]),
          Cl.list([Cl.uint(80), Cl.uint(          Cl.lis Cl.ui          Cl.list([l.s          Cl.list([         Cl.st          "desktop"),
          Cl.stringAscii("en"),
          Cl.uint(5),
                                                                                                                                          ic Rules", () => {
    it("creates a demogr    it("creates a demog    c    it("esult } = simnet.callPublicFn(
        "targeting-engine",
        "create-demographic-rule",
        [
          Cl.stringU          Cle 25-35"),
          Cl.stringU          C Cl.uint(25),
          Cl.uint(35),
          Cl.uint(80),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));
    });

                                                      con                                                      con                                                      c                                                          con                 ),
          Cl.uint(20),
          Cl.uint          Cl.uint          Cl.uint          Cl.uint          Cl.uint          Cl.uint          Cl.uint          Cl.uint          Cl.uint 
               esult } = simnet.c    ublicFn(
        "        "        "        "        "        "        "        "        "        "        "        "        "        "        "        "        "                     "        "        "        "        "        "        "        "        "       esult).toBeErr(Cl.uint(106));
    });
  });

  describe("Geo Region Management", () => {
    it("allows contract owner to register a geo region", () => {
      const { result } = simnet.c      const { result "targeting-engine",
        "register-geo-region",
        [
          Cl.stringAscii("NA"),
          Cl.stringAscii("North America"),
          Cl.stringAscii(""),
          Cl.uint(380000000),
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects non-owner from registering a region"    it("rejects non-o {    it("rejects non-owner from registering a region"    it("rejects non-o {    it("rejects non-owner from registering a region"    it("rejects non-o {   Ascii("Europe"),
          Cl.stringAscii(""),
          Cl.uint(450000000),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100));
    });

    it("reads back a registered region", () => {
      simnet.callPublicFn(
        "targeting-engine",
        "register-geo-region",
        [
          Cl.stringAscii("NA"             Cl.stringAscii("North America"),
          Cl.stringAscii(""),
          Cl.uint(380000000),
        ],        ],        ],        ],        ],        ],        ],        ],  Fn        ],        ],        ]
        "get-geo-region",
        [Cl.stringAscii("NA")],
        deployer
      );
      expect(result).toBeSome(
        Cl.tuple({
          name: Cl.stringAscii("North America"),
          "parent-region": Cl.stringAscii(""),
          active: Cl.bool(true),
          "population-estimate": Cl.uint(380000000),
        })
      );
    });
  });

  describe("Exclusion List", () => {
    it("excludes a user from a campaign", () => {
      const { result } = simnet.callPublicFn(
        "targeting-engine",
        "exclude-user-from-campaign",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.stringUtf8("Opted out"),
          Cl.uint(0),
        ],
        wallet1
                              toBeOk(Cl.bool(true));
    });

    it("checks exclusion status", () => {
      simnet.callPublicFn(
        "targeting-engine",
        "exclude-user-from-campaign",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.stringUtf8("Opted out"),
          Cl.uint(0),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        "targeting-engine",
        "is-user-excluded",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(result).toBeBool(true);
    });

    it("removes a user exclusion", () => {
      simnet.callPublicFn(
        "targeting-engine",
        "exclude-user-from-campaign",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.stringUtf8("Opted out"),
          Cl.uint(0),
        ],
        wallet1
      );

      simnet.callPublicFn(
        "targeting-engine",
        "remove-user-exclusion",
        [Cl.uint(1), Cl.principal(wallet2)],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        "targeting-engine",
        "is-user-excluded",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(result).toBeBool(false);
    });
  });

  describe("ZK Proof Submission", () => {
    it("submits a ZK demographic proof", () => {
      const proofHash = new Uint8Array(32).fill(1);
      const { result } = simnet.callPublicFn(
        "targeting-engine",
        "submit-zk-demographic-proof",
        [Cl.buffer(proofHash), Cl.uint(1)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects duplicate proof submission", () => {
      const proofHash = new Uint8Array(32).fill(2);
      simnet.callPublicFn(
        "targeting-engine",
        "submit-zk-demographic-proof",
        [Cl.buffer(proofHash), Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "targeting-engine",
        "submit-zk-demographic-proof",
        [Cl.buffer(proofHash), Cl.uint(1)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(105));
    });
  });

  describe("Match Quality Tiers", () => {
    it("returns exact tier for score >= 80", () => {
      const { result } = simnet.callReadOnlyFn(
        "targeting-engine",
        "get-match-quality-tier",
        [Cl.uint(85)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(4));
    });

    it("returns high tier for score >= 60", () => {
      const { result } = simnet.callReadOnlyFn(
        "targeting-engine",
        "get-match-quality-tier",
        [Cl.uint(65)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(3));
    });

    it("returns medium tier for score >= 40", () => {
      const { result } = simnet.callReadOnlyFn(
        "targeting-engine",
        "get-match-quality-tier",
        [Cl.uint(45)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(2));
    });

    it("returns low tier for score >= 20", () => {
      const { result } = simnet.callReadOnlyFn(
        "targeting-engine",
        "get-match-quality-tier",
        [Cl.uint(25)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("returns none tier for score < 20", () => {
      const { result } = sim      constdOnlyFn(
        "targeting-engine",
        "get-match-quality-tier",
        [Cl.uint(10)],
        deployer
      );
      expect(result).toBeOk(Cl.uint(0));
    });
  });

  describe("Admin Functions", () => {
    it("allows owner to set min relevance score", () => {
      const { result } = simnet.callPublicFn(
        "targeting-engine",
        "set-min-relevance-score",
        [Cl.uint(50)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects non-owner from setting min relevance score", () => {
      const { result } = simnet.callPublicFn(
        "targeting-engine",
        "set-min-relevance-score",
        [Cl.uint(50)],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(100));
    });

    it("allows owner to set match cooldown", () => {
      const { result } = simnet.callPublicFn(
        "targeting-engine",
        "set-match-cooldown",
        [Cl.uint(12)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("allows owner to set proof expiry", () => {
      const { result } = simnet.callPublicFn(
        "targeting-engine",
        "set-proof-expiry",
        [Cl.uint(288)],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });
});
