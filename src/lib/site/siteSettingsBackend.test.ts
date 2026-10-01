import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SUITE_SERVER_ENV } from "@/lib/suiteServer";

import { deleteSetting, putSetting, readSettings, settingsScope } from "./siteSettingsBackend";

/*
 * Where the settings live for this server. The suite's own keeps them in
 * memory; anything else, above all production, reaches Sumilabu and nothing
 * else. Sumilabu is a stubbed fetch here, so a call that should have reached it
 * is counted and one that should not is a test failure.
 */

const SUITE = { NODE_ENV: "production", [SUITE_SERVER_ENV]: "1" } as const;
const LIVE_SITE = { NODE_ENV: "production", VERCEL: "1", VERCEL_ENV: "production" } as const;
const SUMILABU = {
  SUMILABU_BOARD_URL: "https://api.example.test",
  SUMILABU_SETTINGS_DEV_TOKEN: "dev-settings-secret",
  SUMILABU_SETTINGS_TOKEN: "live-settings-secret",
};
const at = "2026-10-01T10:00:00.000Z";

const calls: { url: string; method: string }[] = [];

beforeEach(() => {
  calls.length = 0;
  delete (globalThis as Record<symbol, unknown>)[Symbol.for("itsutsu.suiteServerSettings")];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method ?? "GET" });
      return new Response(JSON.stringify({ ok: true, entries: [], key: "registration", value: "open", setBy: "x", updatedAt: at, deleted: true }), { status: 200 });
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("on the suite's server", () => {
  it("keeps what is written and gives it back, never reaching Sumilabu", async () => {
    expect(await readSettings(SUITE)).toEqual([]);
    const written = await putSetting("registration", "closed", "operator@example.test", SUITE);
    expect(written).toMatchObject({ key: "registration", value: "closed", setBy: "operator@example.test" });
    expect(await readSettings(SUITE)).toEqual([written]);
    expect(await deleteSetting("registration", "operator@example.test", SUITE)).toBe(true);
    expect(await deleteSetting("registration", "operator@example.test", SUITE)).toBe(false);
    expect(await readSettings(SUITE)).toEqual([]);
    expect(calls).toEqual([]);
  });

  it("hands out copies, so a reader cannot change what is kept", async () => {
    await putSetting("join_notice", "hello", "operator@example.test", SUITE);
    const [row] = await readSettings(SUITE);
    row.value = "changed";
    expect((await readSettings(SUITE))[0].value).toBe("hello");
  });

  it("is one store for every module instance in the process, as the panel's route and the door's page are", async () => {
    await putSetting("registration", "closed", "a", SUITE);
    vi.resetModules();
    const another = await import("./siteSettingsBackend");
    expect((await another.readSettings(SUITE)).map((row) => row.value)).toEqual(["closed"]);
    expect(another.settingsScope(SUITE)).toBe(settingsScope(SUITE));
  });

  it("scopes the settings cache to this server alone", () => {
    expect(settingsScope(SUITE)).toMatch(/^suite-[0-9a-f-]{36}$/);
    delete (globalThis as Record<symbol, unknown>)[Symbol.for("itsutsu.suiteServerSettings")];
    expect(settingsScope(SUITE)).not.toBe("sumilabu");
    const first = settingsScope(SUITE);
    delete (globalThis as Record<symbol, unknown>)[Symbol.for("itsutsu.suiteServerSettings")];
    expect(settingsScope(SUITE)).not.toBe(first);
  });
});

describe("everywhere else, which is Sumilabu", () => {
  it("is refused the memory store in production without the marker", async () => {
    await putSetting("registration", "closed", "a", { NODE_ENV: "production", ...SUMILABU });
    expect(calls).toEqual([{ url: "https://api.example.test/api/v1/projects/itsutsu-dev/settings/registration", method: "PUT" }]);
    expect(settingsScope({ NODE_ENV: "production" })).toBe("sumilabu");
  });

  it("is refused it on Vercel even with the marker, so the live site can never run on memory", async () => {
    const env = { ...LIVE_SITE, [SUITE_SERVER_ENV]: "1", ...SUMILABU };
    expect(settingsScope(env)).toBe("sumilabu");
    await readSettings(env);
    await putSetting("registration", "closed", "a", env);
    await deleteSetting("registration", "a", env);
    expect(calls.map((call) => call.method)).toEqual(["GET", "PUT", "DELETE"]);
  });

  it("is a developer's own machine unchanged: itsutsu-dev, until a server says it is the suite's", async () => {
    await readSettings({ NODE_ENV: "development", ...SUMILABU });
    expect(calls).toEqual([{ url: "https://api.example.test/api/v1/projects/itsutsu-dev/settings", method: "GET" }]);
  });
});
