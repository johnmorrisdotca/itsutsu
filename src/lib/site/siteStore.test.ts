import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/*
 * The store, against Sumilabu's settings routes with the network stubbed.
 * Each test imports a fresh copy of the module, so nothing one test reads can
 * be what another test sees.
 */

type Answer = { status: number; body: unknown } | Error;

const calls: { url: string; method: string; init: RequestInit }[] = [];

function answerWith(route: (url: string, method: string) => Answer) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      const method = init.method ?? "GET";
      calls.push({ url, method, init });
      const answer = route(url, method);
      if (answer instanceof Error) throw answer;
      return new Response(JSON.stringify(answer.body), { status: answer.status });
    }),
  );
}

const at = "2026-09-14T10:00:00.000Z";
const setting = (key: string, value: string): Answer => ({ status: 200, body: { ok: true, key, value, setBy: "operator@example.test", updatedAt: at } });
const every = (...entries: { key: string; value: string }[]): Answer => ({
  status: 200,
  body: { ok: true, settings: {}, entries: entries.map((entry) => ({ ...entry, setBy: "operator@example.test", updatedAt: at })) },
});
const missing: Answer = { status: 404, body: { ok: false, error: "missing" } };
const DEV = "https://api.example.test/api/v1/projects/itsutsu-dev/settings";

async function store() {
  vi.resetModules();
  return import("./siteStore");
}

beforeEach(() => {
  calls.length = 0;
  vi.stubEnv("SUMILABU_BOARD_URL", "https://api.example.test");
  vi.stubEnv("SUMILABU_SETTINGS_DEV_TOKEN", "dev-settings-secret");
  vi.stubEnv("SUMILABU_PROJECT_KEY", "");
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
});

describe("the sign-up decision", () => {
  it("asks the dev project for its one key, every time it is asked", async () => {
    answerWith(() => setting("registration", "closed"));
    const { registrationMode } = await store();
    expect(await registrationMode()).toBe("closed");
    expect(await registrationMode()).toBe("closed");
    expect(calls.map((call) => call.url)).toEqual([`${DEV}/registration`, `${DEV}/registration`]);
  });

  it("fails closed to invite-only when the store cannot answer, and says why without the token", async () => {
    const troubles: Answer[] = [new TypeError("fetch failed"), { status: 503, body: "down" }, { status: 401, body: { error: "unauthorized" } }];
    for (const trouble of troubles) {
      answerWith(() => trouble);
      const { registrationMode } = await store();
      expect(await registrationMode()).toBe("invite-only");
    }
    const said = vi.mocked(console.error).mock.calls.map((args) => String(args[0]));
    expect(said).toHaveLength(3);
    expect(said[2]).toMatch(/SUMILABU_SETTINGS_DEV_TOKEN/);
    expect(said.join(" ")).not.toMatch(/secret/);
  });

  it("reads nothing stored, or a mode the registry does not offer, as invite-only", async () => {
    answerWith(() => missing);
    expect(await (await store()).registrationMode()).toBe("invite-only");
    answerWith(() => setting("registration", "approval"));
    expect(await (await store()).registrationMode()).toBe("invite-only");
  });

  it("cannot reach the live project from a checkout, and so fails closed without asking anybody", async () => {
    vi.stubEnv("SUMILABU_PROJECT_KEY", "itsutsu");
    vi.stubEnv("SUMILABU_SETTINGS_TOKEN", "live-settings-secret");
    answerWith(() => setting("registration", "open"));
    expect(await (await store()).registrationMode()).toBe("invite-only");
    expect(calls).toEqual([]);
  });
});

describe("the door", () => {
  it("reads both settings in one call, and a write is on the door at the very next read", async () => {
    let words = "Beta — ask John";
    answerWith((_url, method) => (method === "PUT" ? setting("join_notice", "Open this weekend") : every({ key: "registration", value: "open" }, { key: "join_notice", value: words })));
    const { fetchSiteSettings, writeSiteSetting } = await store();
    expect(await fetchSiteSettings()).toEqual({ registration: "open", joinNotice: "Beta — ask John" });

    await writeSiteSetting("joinNotice", "Open this weekend", "operator@example.test");
    words = "Open this weekend";
    expect(await fetchSiteSettings()).toEqual({ registration: "open", joinNotice: "Open this weekend" });
    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([`GET ${DEV}`, `PUT ${DEV}/join_notice`, `GET ${DEV}`]);
  });

  it("asks for a code and shows no notice when the store cannot answer", async () => {
    answerWith(() => new TypeError("fetch failed"));
    expect(await (await store()).fetchSiteSettings()).toEqual({ registration: "invite-only", joinNotice: "" });
    expect(vi.mocked(console.error)).toHaveBeenCalledTimes(1);
  });
});

describe("the panel and its writes", () => {
  it("reads every setting with who set it, and throws rather than showing defaults when it cannot", async () => {
    answerWith(() => every({ key: "join_notice", value: "Beta" }));
    const { fetchSiteSettingStates } = await store();
    expect(await fetchSiteSettingStates()).toEqual([
      { key: "registration", value: "invite-only", chosen: false, updatedAt: null, updatedBy: "" },
      { key: "joinNotice", value: "Beta", chosen: true, updatedAt: at, updatedBy: "operator@example.test" },
    ]);
    expect(calls[0]!.url).toBe(DEV);

    answerWith(() => ({ status: 503, body: "down" }));
    await expect((await store()).fetchSiteSettingStates()).rejects.toThrow(/503/);
  });

  it("puts a value, and deletes for back to the default, under Sumilabu's names and the operator's", async () => {
    answerWith((_url, method) => (method === "DELETE" ? { status: 200, body: { ok: true, key: "join_notice", deleted: true } } : setting("registration", "open")));
    const { writeSiteSetting } = await store();
    await writeSiteSetting("registration", "open", "operator@example.test");
    await writeSiteSetting("joinNotice", null, "operator@example.test");
    expect(calls.map((call) => `${call.method} ${call.url}`)).toEqual([`PUT ${DEV}/registration`, `DELETE ${DEV}/join_notice`]);
    expect((calls[0]!.init.headers as Record<string, string>)["x-board-actor"]).toBe("operator@example.test");
  });

  it("lets a refused write reach the operator", async () => {
    answerWith(() => ({ status: 400, body: { ok: false, error: "invalid_payload" } }));
    await expect((await store()).writeSiteSetting("registration", "open", "operator@example.test")).rejects.toThrow(/invalid_payload/);
  });
});
