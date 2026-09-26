import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { signEmbedToken } from "@/lib/auth/embedToken";
import { signSession } from "@/lib/auth/session";
import { signPayload } from "@/lib/auth/signing";
import { PREFERENCE_SPECS } from "@/lib/preferences/preferences.constants";

import { MAIL_STOP_KINDS, STOP_KIND_LIST, STOP_TOKEN_DAYS, signStopToken, verifyStopToken } from "./mailStop";

const rows = new Map<string, { email: string | null; emailNotify: boolean; preferences: unknown }>();
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

  it("has a preference to stop each kind, on until stopped", () => {
    for (const kind of STOP_KIND_LIST) {
      const spec = PREFERENCE_SPECS[MAIL_STOP_KINDS[kind].preference];
      expect(spec.options).toEqual(["on", "off"]);
      expect(spec.fallback).toBe("on");
    }
  });
});

describe("who a notice is written to", () => {
  it("leaves out a member who stopped that kind, and only that kind", async () => {
    const { memberAddresses } = await import("./sendNotice");
    rows.set("m-1", { email: "hanako@example.test", emailNotify: true, preferences: { "mail.yourTurn": "off" } });
    expect(await memberAddresses.addressOf("m-1", "your-turn")).toBeNull();
    expect(await memberAddresses.addressOf("m-1", "game-over")).toBe("hanako@example.test");
  });

  it("leaves out a member who stopped all of it, whatever each kind says", async () => {
    const { memberAddresses } = await import("./sendNotice");
    rows.set("m-2", { email: "kuro@example.test", emailNotify: false, preferences: { "mail.gameOver": "on" } });
    expect(await memberAddresses.addressOf("m-2", "game-over")).toBeNull();
  });
});
