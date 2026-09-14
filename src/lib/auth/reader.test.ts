import { describe, expect, it } from "vitest";

import { SIGNED_OUT, readerFrom } from "./reader";

const LATER = Math.floor(Date.now() / 1000) + 3600;

describe("readerFrom", () => {
  it("is nobody without a session", () => {
    expect(readerFrom(null, null)).toEqual(SIGNED_OUT);
    expect(SIGNED_OUT.signedIn).toBe(false);
  });

  it("counts a browser that redeemed an invite as signed in, with no account", () => {
    const reader = readerFrom({ kind: "player", code: "tea-house", exp: LATER }, null);
    expect(reader).toEqual({ signedIn: true, email: null, memberId: null, hasAccount: false });
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

  it("does not believe a member id that arrives without an address", () => {
    const reader = readerFrom({ kind: "player", code: "tea-house", exp: LATER }, "m1");
    expect(reader.memberId).toBeNull();
    expect(reader.hasAccount).toBe(false);
  });
});
