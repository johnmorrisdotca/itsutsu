import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { STAMP_LONGEST_SECONDS, STAMP_QUICKEST_SECONDS, stampInviteRequestForm, stampIsAPerson } from "./inviteRequestStamp";

// Now, because expiry is checked against the real clock by the signing module.
const T = Math.floor(Date.now() / 1000);
let saved: string | undefined;

beforeEach(() => {
  saved = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "a-test-secret-that-is-long-enough-to-sign-with";
});
afterEach(() => {
  process.env.AUTH_SECRET = saved;
});

describe("the invite-request form's stamp", () => {
  it("passes a form filled in at a person's pace", async () => {
    const stamp = (await stampInviteRequestForm(T))!;
    expect(await stampIsAPerson(stamp, T + 20)).toBe(true);
  });

  it("reads a form sent faster than anybody reads it as a script", async () => {
    const stamp = (await stampInviteRequestForm(T))!;
    expect(await stampIsAPerson(stamp, T + STAMP_QUICKEST_SECONDS - 1)).toBe(false);
  });

  it("refuses a stamp that is missing, altered, or signed by somebody else", async () => {
    const stamp = (await stampInviteRequestForm(T))!;
    expect(await stampIsAPerson(undefined, T + 20)).toBe(false);
    expect(await stampIsAPerson(`${stamp}x`, T + 20)).toBe(false);
    process.env.AUTH_SECRET = "a-different-secret-entirely-and-also-long";
    expect(await stampIsAPerson(stamp, T + 20)).toBe(false);
  });

  it("gives a form a day, and no more", () => {
    expect(STAMP_LONGEST_SECONDS).toBe(24 * 60 * 60);
  });
});
