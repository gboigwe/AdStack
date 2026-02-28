import { describe, expect, it, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;

describe("Privacy Layer", () => {
  beforeEach(() => {
    simnet.setEpoch("3.0");
  });

  describe("Consent Management", () => {
    it("grants consent for a purpose", () => {
      const { result } = simnet.callPublicFn(
        "privacy-layer",
        "grant-consent",
        [
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Targeting consent for ad personalization"),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("verifies consent was recorded", () => {
      simnet.callPublicFn(
        "privacy-layer",
        "grant-consent",
        [
          Cl.uint(1),
                                                                                                                                                                 "privacy-layer",
        "has-valid-consent",
                                         )]                                      ct(result).toBeBool(true);
    });

    it("withd    it("withd    it("withd    it("withd  ublicFn(
        "privacy-layer",
        "grant-consent",        "grant-consent",uint(1),
                                         Ut                                            wallet1
      );

      const { result } = simnet.callPublicFn(
        "privacy-layer",
        "withdraw-consent",
        [Cl.uint(1)],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("reports no consent after withdrawal", () => {
      simnet.callPublicFn(
        "priv        "priv        "priv        "priv       
          Cl.uint(1),
          Cl.uint(1),
          Cl.stringUtf8("Targeting consent"),
        ],
        wallet1
      );

      simnet.callPublicFn(
        "privacy-layer",
        "withdraw-consent",
        [Cl.uint(1)],
        wallet1
      );

      const { result } = simnet.c      const { result } = sivacy-layer",
        "has-valid-consent",
        [Cl.principal(wallet1), Cl.uint(1)],
        deployer
      );
      expect(result).toBeBool(false);
    });

    it("rejects invalid consent purpose", () => {
      const { result } = simnet.callPublicFn(
        "privacy-layer",
        "grant-consent",
        [
          Cl.uint(99),
          Cl.uint(1),
          Cl.stringUtf8("Bad purpose"),
        ],
                                                   rr(Cl                  );
               be("Data Pr               be("Data Pr            isters a data p               be("Data Pr               be("Data Pcal               be("Data Pcy               be("Data Pr               be("Data Pr                rincipal(wallet1),
          Cl.stri          Cl.stri          Cl.stri        ingU     Data analytics provider"),
          Cl.list([Cl.uint(2), C   int(5)]),
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });    });    });    });    });    });    });    });    });    });        const { result } = simnet.callP   icFn(
        "privacy-layer",
        "register-data-proce                 "register-data-proce        t2),
                                                      Cl                                           ist                        ]                1
      );
      ex      ex      ex     Cl      ex      ex    


     ex      ex      ex     Cl      eus", () => {
     ex      ex      ex     Cl      eus", () => {
 
  Cl                   pr  Cl                   pr  Cl                   pr  Cl                   pr  Cl                   pr  Cl                   pr  Cl                   pr  Cl                   pr  Cl                   pr  Cl                   pr  Cl                lt  Cl                   pr  Cl                   pr  Cl                   pr  Cl               [  Cl                   pr  Cl                  Cl         Cl           to  Cl   true);
    });

    it("revokes a data process    it("revokes a data process    it("revokes a data process    it("revokes a data process    it("revokes a data pro    Cl.principal(wallet1),
          Cl.stringUtf8("Revoke Test"),
          Cl.stringUtf8("To be revoked          Cl.stringUtf8("To be revoked          Cl.stringUtf8("To be revoked          Cl.stringUtf8("To be revoked          Cl.stringUtf8("To b",                   Cl.stringUtf8("To be revoked          Cllet1)],
        deployer
      );
      expect(result)      expect(result)      expect(result)      exe("Erasure Requests", () => {
    it("creates a data erasure request", () => {
      const { result } = simnet.callPublicFn(
        "privacy-layer",
        "request-data-erasure",
        [],
        wallet1
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("processes an erasure request", () => {
      simnet.callPublicFn(
        "privacy-layer",
        "request-data-erasure",
        [],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "privacy-layer",
        "process-erasure-request",
        [
          Cl.uint(1),
          Cl.uint(3),
          Cl.stringUtf8("All user data erased"),
        ],
        deployer
      );
      expect(result).toBeOk(Cl.bool(true));
    });

    it("rejects non-owner from processing erasure", () => {
      simnet.callPublicFn(
        "privacy-layer",
        "request-data-erasure",
        [],
        wallet1
      );

      const { result } = simnet.callPublicFn(
        "privacy-layer",
        "process-erasure-request",
        [
          Cl.uint(1),
          Cl.uint(3),
          Cl.stringUtf8("Unauthorized process"),
        ],
        wallet1
      );
      expect(result).toBeErr(Cl.uint(300));
    });
  });

  describe("Privacy Policy", () => {
    it("publishes a privacy policy", () => {
      const { result } = simnet.callPublicFn(
        "privacy-layer",
        "publish-privacy-policy",
        [
          Cl.stringUtf8("https://adstack.i          Cl.stringUtf8("https://adstack.i a3f          Cl.stringUtf8"),
        ],
        deployer
      );
      expect(result).toBeOk(Cl.uint(1));
    });

    it("reads back a published policy", () => {
      simnet.callPublicFn(
        "privacy-layer",
        "publish-privacy-policy",
                                                               1"),
          Cl.stringUtf8(          Cl.stringUtf8c3          Cl.stringUtf8(    eplo          );

      const { result } = simnet.callReadOnlyFn(
        "privacy-layer",
        "get-privacy-p        "get-privacy-p        "ge          yer
      );
      expec      expec      e(
                                               stri         ttps://adstack.io/privacy/v1"),
          "content-hash": Cl.stringUtf8("b4a3f2    c9b          "content-hash": Cl.stringher: Cl.principal(deployer),
          "published-at": Cl.uint(0),
          active: Cl.bool(true),
        })
      );
    });
  });

  describe("Conse  descristics", () => {
    it("returns consent stats", () => {
      const { result } = simnet.callReadOnlyFn(
        "priv        r",
        "get-consent-stats",
        [],
        deployer
      );
      expect(result).toBeTuple({
        "total-grants": Cl.uint(0),
        "total-withdrawals": Cl.uint(0),
        "total-erasure-requests": Cl.uint(0),
        "active-processors": Cl.uint(0),
      });
    });
  });

  describe("Data Export", () => {
    it("exports user data", () => {
      const { result } = simnet.callPublicFn(
        "privacy-layer",
        "export-user-data",
        [
          Cl.stringUtf8("json"),
          Cl.stringUtf8("https://export.adstack.io/data/wallet1"),
        ],
        wallet1
      );
      expect(result).toBeOk(Cl.bool(true));
    });
  });
});
