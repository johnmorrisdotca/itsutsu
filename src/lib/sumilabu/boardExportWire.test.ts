import { afterEach, describe, expect, it, vi } from "vitest";

import { importBatch, listTargetTickets, targetTakesKeys } from "./boardExportWire";
import type { SumilabuTarget } from "./sumilabuProject.types";

const target: SumilabuTarget = {
  projectKey: "itsutsu-dev",
  scope: "board",
  url: "https://api.example.test",
  host: "api.example.test",
  token: "dev-board-secret",
  tokenEnv: "SUMILABU_BOARD_DEV_TOKEN",
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

describe("asking the target whether it takes keys", () => {
  it("reads a whole list as no, and one ticket or a 404 for the probe as yes", async () => {
    answer(200, { ok: true, api_version: "v1", tickets: [] });
    expect(await targetTakesKeys(target)).toBe(false);
    expect(calls[0]!.url).toBe("https://api.example.test/api/v1/projects/itsutsu-dev/tickets?key=board-export-key-probe");

    answer(404, { ok: false, error: "missing" });
    expect(await targetTakesKeys(target)).toBe(true);
    answer(200, { ok: true, ticket: { id: "x" } });
    expect(await targetTakesKeys(target)).toBe(true);
  });

  it("refuses to decide from an answer it does not recognise", async () => {
    answer(400, { ok: false, error: "invalid_key" });
    await expect(targetTakesKeys(target)).rejects.toThrow(/could not tell/i);
  });
});

describe("the import and the list", () => {
  it("imports under the actor with the project's token, and hands a refusal back by row", async () => {
    answer(422, { ok: false, error: "a: already belongs to project itsutsu.", problems: ["a: already belongs to project itsutsu."] });
    expect(await importBatch(target, [], "board-export")).toEqual({ ok: false, status: 422, problems: ["a: already belongs to project itsutsu."] });
    const headers = calls[0]!.init.headers as Record<string, string>;
    expect(headers.authorization).toBe("Bearer dev-board-secret");
    expect(headers["x-board-actor"]).toBe("board-export");
    expect(calls[0]!.url).toMatch(/\/projects\/itsutsu-dev\/tickets\/import$/);

    answer(200, { ok: true, imported: 3 });
    expect(await importBatch(target, [], "board-export")).toEqual({ ok: true, imported: 3 });
  });

  it("names the token's variable when it is refused, and never the token", async () => {
    answer(401, { ok: false, error: "unauthorized" });
    const refused = await listTargetTickets(target).catch((error: Error) => error.message);
    expect(refused).toMatch(/SUMILABU_BOARD_DEV_TOKEN/);
    expect(refused).not.toMatch(/secret/);
  });
});
