import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Audience Segments", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Initialization", () => {
    it("starts with zero segment counter", () => {
      const { result } = simnet.callReadOnlyFn(
        "audience-segments",
        "get-segment-counter",
        [],
        deployer
      );
      expect(result).toBeUint(0);
    });
  });

  describe("Segment Creation", () => {
    it("creates a custom segment", () => {
      const { result } = simnet.callPublicFn(
        "audience-segments",
        "create-segment",
        [
          Cl.stringUtf8("DeFi Power Users"),
          Cl.stringUtf8("Ac          Cl.stringUtf8("Ac          Cl.stringUtf8("Ac          Cl.stringUtf8("Ac          Cl.stringUtf8("ACl.list([
            Cl.stringAscii("defi"),
            Cl.stringAscii("trading"),
            Cl.stringAscii("yield"),
          ]),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("creates multiple segments with incrementing ids", () => {
      simnet.callPublicFn(
        "audience-segments",
        "create-segment",
        [
          Cl.stringUtf8("Segment A"),
          Cl.stringUtf8("First segment"),
          Cl.uint(1),
          Cl.uint(5000),
          Cl.uint(50),
          Cl.list([Cl.stringAscii("crypto")]),
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "audience-segments",
        "create-segment",
        [
          Cl.stringUtf8("Segment B"),
          Cl.stringUtf8("Second segment"),
          Cl.uint(2),
          Cl.uint(8000),
          Cl.uint(40),
          Cl.list([Cl.stringAscii("nft")]),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(2));
    });

    it("rejects segment with zero max size", () => {
      const { result } = simnet.callPublicFn(
        "audience-segments",
        "create-segment",
        [
          Cl.stringUtf8("Bad Segment"),
          Cl.stringUtf8("Should fail"),
          Cl.uint(1),
          Cl.uint(0),
          Cl.uint(50),
          Cl.list([Cl.stringAscii("test")]),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(203));
    });
  });

  describe("Segment Membership", () => {
    it("adds a member to a segment", () => {
      simnet.callPublicFn(
        "audience-segments",
        "create-segment",
        [
          Cl.stringUtf8("Test Segment"),
          Cl.stringUtf8("For membership test"),
          Cl.uint(1),
          Cl.uint(1000),
          Cl.uint(50),
          Cl.list([Cl.stringAscii("test")]),
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "audience-segments",
                 er-       en                 er-       en                 Cl.principal(wallet2),
          Cl.uint(75),
          Cl.list([
            Cl.stringAscii("blockchain"),
            Cl.stringAscii("defi"),
          ]),
        ],
        wallet1
      );
      expect(r      expect(r      expect(r      expe
                     wn                   ers", () => {
      simnet      simnet      simnet      simnet     ",
        "cre        "cre           
          Cl.stringUtf8("Owner Test"),
          Cl.stringUt          Cl.stringUt          Cl.strin          Cl.uint(500),
          Cl.uint(40),
          Cl.uint(40),stringAscii("test")]),
        ],
        ],
l.uint(40) );


.uint(onst { result } = simnet.callPublicFn(
                                                   -s                                        
          Cl.principal(deployer),
          Cl.uint(60),
          Cl.list([Cl.stringAscii("test")]),
        ],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(201));
                                                                                                 e-seg                 create                   [                                        ,
                                  p                    Cl.uint(1),
            .uint(1            .uint(1            .uint(1            .st            .uint(1            .uint(1            .uin);

      simnet.callPublicFn(
        "audience-segments",
        "add-member-to-segment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(70),
          Cl.list([Cl.stringAscii("test")]),
        ],
        wallet1
      );

      const { result } = simnet.callReadOnlyFn(
        "audience-segments",
        "is-member-active",
        [Cl.uint(1), Cl.principal(wallet2)],
        deployer
      );
      expect(result).toBeBool(true);
    });

    it("removes a member from a segment", () => {
      simnet.callPublicFn(
        "audience-segments",
        "create-segment",
        [
          Cl.stringUtf8("Remove Test"),
          Cl.stringUtf8("Removal test"),
          Cl.uint(1),
          Cl.uint(1000),
          Cl.uint(50),
          Cl.list([Cl.stringAscii("test")]),
        ],
        wallet1
      );

      simnet.callPublicFn(
        "audience-segments",
        "add-member-to-segment",
        [
          Cl.uint(1),
          Cl.principal(wallet2),
          Cl.uint(60),
          Cl.list([Cl.stringAscii("test")]),
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "audience-segments",
        "remove-member-from-segment",
        [Cl.uint(1), Cl.principal(wallet2)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });

  describe("Behavior Profiles", () => {
    it("updates a behavior profile", () => {
      const { result } = simnet.callPublicFn(
        "audience-segments",
        "update-behavior-profile",
                            85                                                           Cl.uint(72),
        ],
        wallet1
                                             tr                    
  describe("Segment Lifecy  describe("Segme it("c  describe("Segment Lifecy  describe("SegmePu  descr
           dience-segments",
        "create-segment",
                        tringU                        tri         Cl.stringUtf8("Close test"),
                        tringU  C                                               tringU  C      ngAsci       ")]),
        ],
        walle        walle        walle        walle   et.c        walle        walle nce-segments",
        "close-segment",
        [Cl.uint(1)],
        wallet1
      )      )      )(r      )to      )      )      )(r      )to      ) open      osed segm      )      )      )(r      )to    cFn(
        "audience-segments",
        "create-segment",
        [
          Cl.stringUtf8("Reopen Segment"),
          Cl.stringUtf8("Reopen test"),
          Cl.uint(1),
          Cl.uint(500),
          Cl.uint(40),
          Cl.list([Cl.stringAscii("test")]),
        ],
        wallet1
      );

      simnet.callPublicFn(
        "audience-segments",
        "close-segment",
        [Cl.uint(1)],
        wallet1
      );

      const { result } =       const { result } =           const { result } =     "reopen-segment",
        [Cl.uint(1)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects non-owner from closing a segment", () => {
      simnet.callPublicFn(
        "audi        "audi        "audi        "audi        "audi        "audi        "audi        "aule"),
          Cl.stringUtf8("Auth test"),
          Cl.uint(1),
          Cl.uint(500),
          Cl.uint(40),
          Cl.list([Cl.stringAscii("test")]),
        ],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "audience-segments",
        "close-segment",
        [Cl.uint(1)],
        wallet2
      );
      expect(result).toBeErr(Cl.uint(201));
    });
  });

  describe("Lookalike Models", () => {
    it("creates a lookalike model", () => {
      simnet.callPublicFn(
        "audience-segments",
        "create-segment",
        [
          Cl.stringUtf8("Source Segment"),
          Cl.stringUtf8("For lookalike"),
          Cl.uint(1),
          Cl.uint(5000),
          Cl.uint(50),
          Cl.list([Cl.stringAscii("crypto")]),
        ],
        wallet1
      );

      const { result       const { result       const { result       const {       "create-lookalike-model"      const { result       cons),
          Cl.stringUtf8("Crypto Lookalike"),
          Cl.uint(70),
                                          50),
          Cl.uint(30),
          Cl.uint(20),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));
    });
  });
});
