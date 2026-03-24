import { describe, it, expect, beforeEach } from "vitest";
import { Cl } from "@stacks/transactions";

const accounts = simnet.getAccounts();
const deployer = accounts.get("deployer")!;
const wallet1 = accounts.get("wallet_1")!;
const wallet2 = accounts.get("wallet_2")!;
const wallet3 = accounts.get("wallet_3")!;

const CONTRACT = "user-profiles";

// Role constants matching the contract
const ROLE_ADVERTISER = Cl.uint(1);
const ROLE_PUBLISHER = Cl.uint(2);
const ROLE_VIEWER = Cl.uint(3);
const ROLE_INVALID = Cl.uint(99);

describe("user-profiles contract", () => {
  describe("registration", () => {
    it("allows a new user to register as advertiser", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_ADVERTISER, Cl.stringAscii("Alice Ads")],
        wallet1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("allows registration as publisher", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_PUBLISHER, Cl.stringAscii("Bob Publisher")],
        wallet1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("allows registration as viewer", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_VIEWER, Cl.stringAscii("Charlie Viewer")],
        wallet1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects duplicate registration", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_ADVERTISER, Cl.stringAscii("Alice")],
        wallet1,
      );
      const result = simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_PUBLISHER, Cl.stringAscii("Alice Again")],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(201));
    });

    it("rejects invalid role", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_INVALID, Cl.stringAscii("Invalid Role")],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(203));
    });

    it("rejects empty display name", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_ADVERTISER, Cl.stringAscii("")],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(204));
    });

    it("increments user counters after registration", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_ADVERTISER, Cl.stringAscii("Adv1")],
        wallet1,
      );
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_PUBLISHER, Cl.stringAscii("Pub1")],
        wallet2,
      );
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_VIEWER, Cl.stringAscii("View1")],
        wallet3,
      );

      const counts = simnet.callReadOnlyFn(
        CONTRACT,
        "get-user-counts",
        [],
        deployer,
      );
      expect(counts.result).toBeTuple({
        total: Cl.uint(3),
        advertisers: Cl.uint(1),
        publishers: Cl.uint(1),
        viewers: Cl.uint(1),
      });
    });
  });

  describe("read-only queries", () => {
    it("returns profile after registration", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_ADVERTISER, Cl.stringAscii("ProfileTest")],
        wallet1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-profile",
        [Cl.principal(wallet1)],
        deployer,
      );
      expect(result.result).toBeSome(
        Cl.tuple({
          "display-name": Cl.stringAscii("ProfileTest"),
          role: Cl.uint(1),
          status: Cl.uint(1),
          "verification-status": Cl.uint(0),
          "verification-expires": Cl.uint(0),
          "reputation-score": Cl.uint(50),
          "join-height": Cl.uint(expect.anything()),
          "last-active": Cl.uint(expect.anything()),
          "total-campaigns": Cl.uint(0),
          "total-earnings": Cl.uint(0),
        }),
      );
    });

    it("returns true for registered user", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_VIEWER, Cl.stringAscii("RegCheck")],
        wallet1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "is-registered",
        [Cl.principal(wallet1)],
        deployer,
      );
      expect(result.result).toBeBool(true);
    });

    it("returns false for unregistered user", () => {
      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "is-registered",
        [Cl.principal(wallet3)],
        deployer,
      );
      expect(result.result).toBeBool(false);
    });

    it("returns correct role", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_PUBLISHER, Cl.stringAscii("RoleCheck")],
        wallet1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-role",
        [Cl.principal(wallet1)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.uint(2));
    });

    it("returns default reputation of 50", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_ADVERTISER, Cl.stringAscii("RepCheck")],
        wallet1,
      );

      const result = simnet.callReadOnlyFn(
        CONTRACT,
        "get-reputation",
        [Cl.principal(wallet1)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.uint(50));
    });
  });

  describe("update-display-name", () => {
    it("allows user to update their display name", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_ADVERTISER, Cl.stringAscii("OldName")],
        wallet1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "update-display-name",
        [Cl.stringAscii("NewName")],
        wallet1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("rejects empty new name", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_ADVERTISER, Cl.stringAscii("ValidName")],
        wallet1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "update-display-name",
        [Cl.stringAscii("")],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(204));
    });

    it("rejects update from unregistered user", () => {
      const result = simnet.callPublicFn(
        CONTRACT,
        "update-display-name",
        [Cl.stringAscii("Attempt")],
        wallet3,
      );
      expect(result.result).toBeErr(Cl.uint(202));
    });
  });

  describe("verification workflow", () => {
    it("allows user to request verification", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_PUBLISHER, Cl.stringAscii("VerifyMe")],
        wallet1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "request-verification",
        [],
        wallet1,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents double verification request", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_PUBLISHER, Cl.stringAscii("DoubleVerify")],
        wallet1,
      );
      simnet.callPublicFn(CONTRACT, "request-verification", [], wallet1);

      const result = simnet.callPublicFn(
        CONTRACT,
        "request-verification",
        [],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(206));
    });

    it("allows admin to approve verification", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_PUBLISHER, Cl.stringAscii("AdminVerify")],
        wallet1,
      );
      simnet.callPublicFn(CONTRACT, "request-verification", [], wallet1);

      const result = simnet.callPublicFn(
        CONTRACT,
        "set-verification",
        [Cl.principal(wallet1), Cl.uint(2)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("prevents non-admin from setting verification", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_PUBLISHER, Cl.stringAscii("NonAdmin")],
        wallet1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "set-verification",
        [Cl.principal(wallet1), Cl.uint(2)],
        wallet2,
      );
      expect(result.result).toBeErr(Cl.uint(200));
    });
  });

  describe("admin functions", () => {
    it("allows admin to suspend a user", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_VIEWER, Cl.stringAscii("Suspended")],
        wallet1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "suspend-user",
        [Cl.principal(wallet1)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("allows admin to reinstate a suspended user", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_VIEWER, Cl.stringAscii("Reinstate")],
        wallet1,
      );
      simnet.callPublicFn(
        CONTRACT,
        "suspend-user",
        [Cl.principal(wallet1)],
        deployer,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "reinstate-user",
        [Cl.principal(wallet1)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("allows admin to update reputation", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_ADVERTISER, Cl.stringAscii("RepUser")],
        wallet1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "update-reputation",
        [Cl.principal(wallet1), Cl.uint(85)],
        deployer,
      );
      expect(result.result).toBeOk(Cl.bool(true));
    });

    it("clamps reputation to max 100", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_ADVERTISER, Cl.stringAscii("OverRep")],
        wallet1,
      );

      simnet.callPublicFn(
        CONTRACT,
        "update-reputation",
        [Cl.principal(wallet1), Cl.uint(150)],
        deployer,
      );

      const rep = simnet.callReadOnlyFn(
        CONTRACT,
        "get-reputation",
        [Cl.principal(wallet1)],
        deployer,
      );
      expect(rep.result).toBeOk(Cl.uint(100));
    });

    it("prevents non-admin from suspending", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_VIEWER, Cl.stringAscii("Target")],
        wallet1,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "suspend-user",
        [Cl.principal(wallet1)],
        wallet2,
      );
      expect(result.result).toBeErr(Cl.uint(200));
    });

    it("suspended user cannot update display name", () => {
      simnet.callPublicFn(
        CONTRACT,
        "register",
        [ROLE_VIEWER, Cl.stringAscii("SusUser")],
        wallet1,
      );
      simnet.callPublicFn(
        CONTRACT,
        "suspend-user",
        [Cl.principal(wallet1)],
        deployer,
      );

      const result = simnet.callPublicFn(
        CONTRACT,
        "update-display-name",
        [Cl.stringAscii("NewName")],
        wallet1,
      );
      expect(result.result).toBeErr(Cl.uint(205));
    });
  });
});
