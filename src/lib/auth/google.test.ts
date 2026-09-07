import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { authOptions } from "./google";

/**
 * The Google sign-in gate.
 *
 * `isAdminEmail` is tested on its own in session.test.ts. What is tested here
 * is the wiring: that the callback actually consults the allowlist. A change
 * that returned true unconditionally would leave every allowlist test green
 * while opening the site to anyone holding a Google account, so the refusals
 * are worth asserting where they are decided.
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
  it("lets an allowlisted, verified Google account in", () => {
    expect(signIn({ provider: "google", email: "john@spxis.com", verified: true })).toBe(true);
  });

  it("refuses a Google account that is not on the allowlist", () => {
    expect(signIn({ provider: "google", email: "stranger@example.com", verified: true })).toBe(
      false,
    );
  });

  it("refuses everyone when no allowlist is configured", () => {
    delete process.env.ADMIN_EMAILS;
    expect(signIn({ provider: "google", email: "john@spxis.com", verified: true })).toBe(false);
  });

  it("refuses an unverified address even when it is on the allowlist", () => {
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
