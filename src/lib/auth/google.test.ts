import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { authOptions } from "./google";

/**
 * The Google sign-in gate.
 *
 * Google proves an address; the door decides membership. What is tested here
 * is that the callback admits exactly a verified Google address and nothing
 * else — no other provider, no unverified address, no missing profile — since
 * everything downstream (/api/session/google) trusts what got through.
 */

const original = process.env.ADMIN_EMAILS;

beforeEach(() => {
  process.env.ADMIN_EMAILS = "john@spxis.com";
});

afterEach(() => {
  if (original === undefined) delete process.env.ADMIN_EMAILS;
  else process.env.ADMIN_EMAILS = original;
});

type SignInCallback = NonNullable<NonNullable<typeof authOptions.callbacks>["signIn"]>;
type SignInArgs = Parameters<SignInCallback>[0];

/** Calls the callback with just the fields it reads. */
function signIn(args: {
  provider?: string;
  email?: string;
  verified?: boolean;
}): ReturnType<SignInCallback> {
  const callback = authOptions.callbacks?.signIn;
  if (!callback) throw new Error("google.ts defines no signIn callback");
  return callback({
    user: {} as never,
    account: args.provider === undefined ? null : ({ provider: args.provider } as never),
    profile:
      args.email === undefined && args.verified === undefined
        ? undefined
        : ({ email: args.email, email_verified: args.verified } as never),
  } as SignInArgs);
}

describe("google sign-in", () => {
  it("lets a verified Google account complete the sign-in", () => {
    expect(signIn({ provider: "google", email: "john@spxis.com", verified: true })).toBe(true);
  });

  it("lets a stranger's verified account sign in too — the door decides membership, not this", () => {
    expect(signIn({ provider: "google", email: "stranger@example.com", verified: true })).toBe(true);
  });

  it("refuses a profile with no address, which nothing downstream could admit", () => {
    expect(signIn({ provider: "google", verified: true })).toBe(false);
  });

  it("refuses an unverified address", () => {
    expect(signIn({ provider: "google", email: "john@spxis.com", verified: false })).toBe(false);
  });

  it("refuses a provider that is not google", () => {
    expect(signIn({ provider: "credentials", email: "john@spxis.com", verified: true })).toBe(false);
  });

  it("refuses a sign-in that carries no account at all", () => {
    expect(signIn({ email: "john@spxis.com", verified: true })).toBe(false);
  });

  it("refuses a sign-in that carries no profile", () => {
    expect(signIn({ provider: "google" })).toBe(false);
  });
});
