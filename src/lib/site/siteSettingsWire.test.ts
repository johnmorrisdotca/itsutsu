import { afterEach, describe, expect, it, vi } from "vitest";

import type { SumilabuTarget } from "@/lib/sumilabu/sumilabuProject.types";

import { deleteRemoteSetting, putRemoteSetting, readRemoteSetting, readRemoteSettings } from "./siteSettingsWire";

const target: SumilabuTarget = {
  projectKey: "itsutsu-dev",
  scope: "settings",
  url: "https://api.example.test",
  host: "api.example.test",
  token: "dev-settings-secret",
  tokenEnv: "SUMILABU_SETTINGS_DEV_TOKEN",
};

const calls: { url: string; init: RequestInit }[] = [];

function answer(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
    }),
  );
}

afterEach(() => {
  calls.length = 0;
  vi.unstubAllGlobals();
});

const stored = { key: "join_notice", value: "Beta — ask John", setBy: "operator@example.test", updatedAt: "2026-09-14T10:00:00.000Z" };

describe("Sumilabu's settings, over the wire", () => {
  it("reads every setting with the project's settings token", async () => {
    answer(200, { ok: true, api_version: "v1", settings: { join_notice: stored.value }, entries: [stored] });
    expect(await readRemoteSettings(target)).toEqual([stored]);
    expect(calls[0]!.url).toBe("https://api.example.test/api/v1/projects/itsutsu-dev/settings");
    expect((calls[0]!.init.headers as Record<string, string>).authorization).toBe("Bearer dev-settings-secret");
  });

  it("reads one setting, and null only when Sumilabu says nobody wrote it", async () => {
    answer(200, { ok: true, ...stored });
    expect(await readRemoteSetting(target, "join_notice")).toEqual(stored);
    expect(calls[0]!.url).toMatch(/\/settings\/join_notice$/);

    answer(404, { ok: false, error: "missing" });
    expect(await readRemoteSetting(target, "registration")).toBeNull();

    answer(404, { error: "Not Found" });
    await expect(readRemoteSetting(target, "registration")).rejects.toThrow(/404/);
  });

  it("writes and forgets under the operator's name", async () => {
    answer(200, { ok: true, ...stored });
    await putRemoteSetting(target, "join_notice", stored.value, "operator@example.test");
    expect(calls[0]!.init.method).toBe("PUT");
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual({ value: stored.value });
    expect((calls[0]!.init.headers as Record<string, string>)["x-board-actor"]).toBe("operator@example.test");

    answer(200, { ok: true, key: "join_notice", deleted: false });
    expect(await deleteRemoteSetting(target, "join_notice", "x".repeat(90))).toBe(false);
    expect(calls[1]!.init.method).toBe("DELETE");
    expect((calls[1]!.init.headers as Record<string, string>)["x-board-actor"]).toHaveLength(80);
  });

  it("throws on a refusal, an outage or a hang, and never prints the token", async () => {
    answer(401, { ok: false, error: "unauthorized" });
    const refused = await readRemoteSettings(target).catch((error: Error) => error.message);
    expect(refused).toMatch(/SUMILABU_SETTINGS_DEV_TOKEN/);
    expect(refused).not.toMatch(/secret/);

    answer(503, "unavailable");
    await expect(readRemoteSetting(target, "registration")).rejects.toThrow(/503/);

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new DOMException("The operation timed out.", "TimeoutError"))));
    await expect(readRemoteSetting(target, "registration")).rejects.toThrow(/did not answer/);

    answer(400, { ok: false, error: "invalid_payload" });
    await expect(putRemoteSetting(target, "join_notice", "x", "operator")).rejects.toThrow(/invalid_payload/);
  });
});
