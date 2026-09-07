import { afterEach, describe, expect, it } from "vitest";
import {
  expiryInDays,
  signSession,
  verifySession,
  type Session,
} from "./session";
import { isAdminEmail, isOperatorLogin } from "./admin";

const SECRET = "a-secret-long-enough-to-be-accepted";

function withEnv(vars: Record<string, string | undefined>) {
  for (const [key, value] of Object.entries(vars)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
}

afterEach(() => {
  withEnv({ AUTH_SECRET: undefined, ADMIN_EMAILS: undefined, ADMIN_TOKEN: undefined });
});

const player: Session = { kind: "player", exp: expiryInDays(30) };

describe("session signing", () => {
  it("round-trips a session it signed", async () => {
    withEnv({ AUTH_SECRET: SECRET });
    const token = await signSession(player);

    expect(token).not.toBeNull();
    await expect(verifySession(token!)).resolves.toMatchObject({ kind: "player" });
  });

  it("cannot sign or verify without a secret, so nobody is signed in", async () => {
    withEnv({ AUTH_SECRET: undefined });
    expect(await signSession(player)).toBeNull();
    expect(await verifySession("anything")).toBeNull();
  });

  it("refuses a secret too short to be worth anything", async () => {
    withEnv({ AUTH_SECRET: "short" });
    expect(await signSession(player)).toBeNull();
  });

  it("rejects a payload that has been edited", async () => {
    withEnv({ AUTH_SECRET: SECRET });
    const token = (await signSession(player))!;
    const [payload, signature] = token.split(".");

    // Promote the session to admin and keep the original signature.
    const forged = btoa(JSON.stringify({ kind: "admin", email: "x@y.z", exp: player.exp }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    expect(await verifySession(`${forged}.${signature}`)).toBeNull();
    expect(await verifySession(`${payload}.${signature}`)).not.toBeNull();
  });

  it("rejects a session signed with a different secret", async () => {
    withEnv({ AUTH_SECRET: SECRET });
    const token = (await signSession(player))!;

    withEnv({ AUTH_SECRET: "a-completely-different-secret-value" });
    expect(await verifySession(token)).toBeNull();
  });

  it("rejects an expired session", async () => {
    withEnv({ AUTH_SECRET: SECRET });
    const stale = await signSession({ kind: "player", exp: expiryInDays(-1) });
    expect(await verifySession(stale!)).toBeNull();
  });

  it("rejects nonsense without throwing", async () => {
    withEnv({ AUTH_SECRET: SECRET });
    for (const token of ["", "a", "a.b", "....", "%%%.%%%"]) {
      expect(await verifySession(token)).toBeNull();
    }
  });
});

describe("the operator allowlist", () => {
  it("recognises an allowed email whatever its casing", () => {
    withEnv({ ADMIN_EMAILS: "john@spxis.com" });
    expect(isAdminEmail("john@spxis.com")).toBe(true);
    expect(isAdminEmail("  John@SPXIS.com ")).toBe(true);
  });

  it("recognises nobody when the list is unset", () => {
    withEnv({ ADMIN_EMAILS: undefined });
    expect(isAdminEmail("john@spxis.com")).toBe(false);
  });

  it("does not treat an empty email as allowed", () => {
    withEnv({ ADMIN_EMAILS: "john@spxis.com" });
    for (const value of ["", "   ", null, undefined]) {
      expect(isAdminEmail(value)).toBe(false);
    }
  });

  it("accepts several operators", () => {
    withEnv({ ADMIN_EMAILS: "john@spxis.com, someone@else.com" });
    expect(isAdminEmail("someone@else.com")).toBe(true);
  });
});

describe("operator sign-in", () => {
  it("needs both the right email and the right token", () => {
    withEnv({ ADMIN_EMAILS: "john@spxis.com", ADMIN_TOKEN: "correct-horse" });

    expect(isOperatorLogin("john@spxis.com", "correct-horse")).toBe(true);
    expect(isOperatorLogin("john@spxis.com", "wrong")).toBe(false);
    expect(isOperatorLogin("someone@else.com", "correct-horse")).toBe(false);
  });

  it("lets nobody in when no token is configured", () => {
    withEnv({ ADMIN_EMAILS: "john@spxis.com", ADMIN_TOKEN: undefined });
    expect(isOperatorLogin("john@spxis.com", "")).toBe(false);
    expect(isOperatorLogin("john@spxis.com", "anything")).toBe(false);
  });
});
