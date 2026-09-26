import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { signEmbedToken } from "@/lib/auth/embedToken";
import { signSession } from "@/lib/auth/session";
import { signPayload } from "@/lib/auth/signing";
import { PREFERENCE_SPECS } from "@/lib/preferences/preferences.constants";

import { MAIL_KINDS, STOP_KIND_LIST, STOP_TOKEN_DAYS, signStopToken, verifyStopToken } from "./mailStop";

const rows = new Map<string, { email: string | null; emailNotify: boolean; preferences: unknown; lastSeenAt: Date }>();
vi.mock("@/lib/prisma", () => ({
  prisma: { member: { findUnique: async ({ where }: { where: { id: string } }) => rows.get(where.id) ?? null } },
}));

beforeEach(() => {
  vi.stubEnv("AUTH_SECRET", "a-test-secret-of-some-length");
  rows.clear();
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe("a stop link's token", () => {
  it("names the member and the kind of email it came with, and nothing else", async () => {
    const token = await signStopToken("m-1", "game-over");
    expect(await verifyStopToken(token)).toMatchObject({ kind: "mail-stop", member: "m-1", mail: "game-over" });
  });

  it("keeps working long after the email was sent: the law asks sixty days", async () => {
    expect(STOP_TOKEN_DAYS).toBeGreaterThanOrEqual(60);
    const stop = await verifyStopToken(await signStopToken("m-1", "your-turn"));
    expect(stop!.exp * 1000 - Date.now()).toBeGreaterThan(60 * 24 * 60 * 60 * 1000);
  });

  it("is never a session or an embed token, and neither of those is one", async () => {
    const session = await signSession({ kind: "player", memberId: "m-1", code: "x", exp: Math.floor(Date.now() / 1000) + 3600 });
    expect(await verifyStopToken(session)).toBeNull();
    expect(await verifyStopToken(await signEmbedToken("test"))).toBeNull();
  });

  it("refuses one altered, unsigned, for a kind of email nobody sends, or without a member", async () => {
    const token = (await signStopToken("m-1", "your-turn"))!;
    expect(await verifyStopToken(`${token.slice(0, -2)}xx`)).toBeNull();
    expect(await verifyStopToken("")).toBeNull();
    expect(await verifyStopToken(null)).toBeNull();
    const exp = Math.floor(Date.now() / 1000) + 3600;
    expect(await verifyStopToken(await signPayload({ kind: "mail-stop", member: "m-1", mail: "newsletter", exp }))).toBeNull();
    expect(await verifyStopToken(await signPayload({ kind: "mail-stop", member: "", mail: "your-turn", exp }))).toBeNull();
  });

  it("cannot be made without the site's key", async () => {
    vi.stubEnv("AUTH_SECRET", "");
    expect(await signStopToken("m-1", "your-turn")).toBeNull();
  });

  it("has a preference for each kind, with its default stated: the rare one on, the chatty one off", () => {
    for (const kind of STOP_KIND_LIST) expect(PREFERENCE_SPECS[MAIL_KINDS[kind].preference].options).toEqual(["on", "off"]);
    expect(PREFERENCE_SPECS[MAIL_KINDS["game-over"].preference].fallback).toBe("on");
    expect(PREFERENCE_SPECS[MAIL_KINDS["your-turn"].preference].fallback).toBe("off");
  });
});

/** Seen an hour ago: away from the site. */
const AWAY = new Date(Date.now() - 60 * 60_000);

describe("who a notice is written to", () => {
  it("writes each kind at its default until the member chooses: a finished game yes, a your-turn no", async () => {
    const { memberAddresses } = await import("./sendNotice");
    rows.set("m-3", { email: "new@example.test", emailNotify: true, preferences: null, lastSeenAt: AWAY });
    expect(await memberAddresses.addressOf("m-3", "game-over")).toBe("new@example.test");
    expect(await memberAddresses.addressOf("m-3", "your-turn")).toBeNull();
  });

  it("never sends a your-turn email to somebody on the site, who can see the board", async () => {
    const { memberAddresses } = await import("./sendNotice");
    rows.set("m-4", { email: "here@example.test", emailNotify: true, preferences: { "mail.yourTurn": "on" }, lastSeenAt: new Date(Date.now() - 60_000) });
    expect(await memberAddresses.addressOf("m-4", "your-turn")).toBeNull();
    // A finished game carries no such rule: it is told either way.
    expect(await memberAddresses.addressOf("m-4", "game-over")).toBe("here@example.test");
  });

  it("leaves out a member who stopped that kind, and only that kind", async () => {
    const { memberAddresses } = await import("./sendNotice");
    rows.set("m-1", { email: "hanako@example.test", emailNotify: true, preferences: { "mail.yourTurn": "on", "mail.gameOver": "off" }, lastSeenAt: AWAY });
    expect(await memberAddresses.addressOf("m-1", "game-over")).toBeNull();
    expect(await memberAddresses.addressOf("m-1", "your-turn")).toBe("hanako@example.test");
  });

  it("leaves out a member who stopped all of it, whatever each kind says", async () => {
    const { memberAddresses } = await import("./sendNotice");
    rows.set("m-2", { email: "kuro@example.test", emailNotify: false, preferences: { "mail.gameOver": "on" }, lastSeenAt: AWAY });
    expect(await memberAddresses.addressOf("m-2", "game-over")).toBeNull();
  });
});

describe("the rows a member chooses from", () => {
  it("gives every kind the words each door needs, and a row in the registry", async () => {
    const { MAIL_KINDS: kinds } = await import("./mailStop");
    for (const kind of STOP_KIND_LIST) {
      const row = kinds[kind];
      for (const words of [row.words, row.label, row.hint]) expect(words.trim().length, `${kind} is missing words`).toBeGreaterThan(0);
      expect(PREFERENCE_SPECS).toHaveProperty([row.preference]);
    }
  });

  it("reads the switches at their defaults, and saves exactly what they show", async () => {
    const { mailKindsFrom, mailKindsPatch } = await import("./mailStop");
    const { preferencesFrom } = await import("@/lib/preferences/preferences");
    expect(mailKindsFrom(preferencesFrom({}))).toEqual({ "your-turn": false, "game-over": true });
    const chosen = mailKindsFrom(preferencesFrom({ "mail.yourTurn": "on", "mail.gameOver": "off" }));
    expect(chosen).toEqual({ "your-turn": true, "game-over": false });
    expect(mailKindsPatch(chosen)).toEqual({ "mail.yourTurn": "on", "mail.gameOver": "off" });
    // Round trip: what is saved reads back as what was shown.
    expect(mailKindsFrom(preferencesFrom(mailKindsPatch(chosen)))).toEqual(chosen);
  });
});
