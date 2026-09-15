import { describe, expect, it } from "vitest";

import { SIGNED_OUT, readerFrom } from "./reader";

const LATER = Math.floor(Date.now() / 1000) + 3600;

describe("readerFrom", () => {
  it("is nobody without a session", () => {
    expect(readerFrom(null, null)).toEqual(SIGNED_OUT);
    expect(SIGNED_OUT.signedIn).toBe(false);
  });

  it("gives a member who came in with an invite code an account, with no address", () => {
    const reader = readerFrom({ kind: "player", memberId: "m-guest", code: "tea-house", exp: LATER }, "m-guest");
    expect(reader).toEqual({ signedIn: true, email: null, memberId: "m-guest", hasAccount: true });
  });

  it("gives a Google member the address folded, the id, and an account", () => {
    const reader = readerFrom({ kind: "player", email: " Hanako@Example.Test ", code: "tea-house", exp: LATER }, "m1");
    expect(reader).toEqual({ signedIn: true, email: "hanako@example.test", memberId: "m1", hasAccount: true });
  });

  it("gives a session with an address and no member row no account", () => {
    // The operator before a fixture made its row: every member-id route answers 401.
    const reader = readerFrom({ kind: "admin", email: "operator@example.test", exp: LATER }, null);
    expect(reader).toEqual({ signedIn: true, email: "operator@example.test", memberId: null, hasAccount: false });
  });

  it("counts a browser whose invite cookie predates accounts as signed in, with no account yet", () => {
    // Its member is made the next time it asks /api/session who it is.
    const reader = readerFrom({ kind: "player", code: "tea-house", exp: LATER }, null);
    expect(reader).toEqual({ signedIn: true, email: null, memberId: null, hasAccount: false });
  });
});
