import { describe, expect, it } from "vitest";

import { memberKeyOf } from "./memberKey";

const LATER = Math.floor(Date.now() / 1000) + 3600;

describe("memberKeyOf", () => {
  it("names nobody for no session", () => {
    expect(memberKeyOf(null)).toBeNull();
  });

  it("names a member who came in with an invite code by the id the cookie carries", () => {
    expect(memberKeyOf({ kind: "player", memberId: "m-guest", code: "tea-house", exp: LATER })).toEqual({
      by: "id",
      value: "m-guest",
    });
  });

  it("prefers the id to the address when a session carries both", () => {
    expect(memberKeyOf({ kind: "player", memberId: "m1", email: "aki@example.test", exp: LATER })).toEqual({
      by: "id",
      value: "m1",
    });
  });

  it("reads an older Google cookie by its folded address", () => {
    expect(memberKeyOf({ kind: "player", email: " Aki@Example.Test ", exp: LATER })).toEqual({
      by: "email",
      value: "aki@example.test",
    });
  });

  it("names nobody for an invite cookie from before a code made a member", () => {
    expect(memberKeyOf({ kind: "player", code: "tea-house", exp: LATER })).toBeNull();
  });
});
