import { afterEach, describe, expect, it, vi } from "vitest";

import { cleanReportPath, newReporterRef } from "../reports/reportDraft";

import { ReportsUnreachable, fileReport, listReports, moveReport, reportImage, reportsHealthy, sendReport } from "./reportsClient";
import type { ReportDraft } from "./reportsClient.types";
import type { SumilabuTarget } from "./sumilabuProject.types";

const reports: SumilabuTarget = {
  projectKey: "itsutsu-dev",
  scope: "reports",
  url: "https://api.example.test",
  host: "api.example.test",
  token: "dev-reports-secret",
  tokenEnv: "SUMILABU_REPORTS_DEV_TOKEN",
};
const board: SumilabuTarget = { ...reports, scope: "board", token: "dev-board-secret", tokenEnv: "SUMILABU_BOARD_DEV_TOKEN" };
const BASE = "https://api.example.test/api/v1/projects/itsutsu-dev";

type Answer = { status: number; body: unknown; headers?: Record<string, string> } | Error;
const calls: { url: string; method: string; init: RequestInit }[] = [];

function answers(...queue: Answer[]) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, init: RequestInit) => {
      calls.push({ url, method: init.method ?? "GET", init });
      const next = queue.length > 1 ? queue.shift()! : queue[0]!;
      if (next instanceof Error) throw next;
      return new Response(JSON.stringify(next.body), { status: next.status, headers: next.headers });
    }),
  );
}

const header = (index: number, name: string) => (calls[index]!.init.headers as Record<string, string>)[name];

const draft: ReportDraft = { body: "The board froze", path: "/games/gomoku", appVersion: "0.271.0", reporterRef: "r-1", reporterName: null };

afterEach(() => {
  calls.length = 0;
  vi.unstubAllGlobals();
});

describe("the reports service's health", () => {
  it("is up only on a plain yes, asked with the reports token", async () => {
    answers({ status: 200, body: { ok: true } });
    expect(await reportsHealthy(reports)).toBe(true);
    expect(calls[0]!.url).toBe("https://api.example.test/api/v1/health");
    expect(header(0, "authorization")).toBe("Bearer dev-reports-secret");
  });

  it("is down on a 503, a refusal, or no answer at all, and never throws", async () => {
    answers({ status: 503, body: { ok: false } });
    expect(await reportsHealthy(reports)).toBe(false);
    answers({ status: 401, body: { ok: false } });
    expect(await reportsHealthy(reports)).toBe(false);
    answers(new Error("timed out"));
    expect(await reportsHealthy(reports)).toBe(false);
  });
});

describe("sending a report", () => {
  it("posts the draft and nothing else to the project's reports", async () => {
    answers({ status: 201, body: { ok: true, report: { id: "c1" } } });
    expect(await sendReport(reports, draft)).toEqual({ ok: true });
    expect(calls[0]).toMatchObject({ url: `${BASE}/reports`, method: "POST" });
    expect(JSON.parse(calls[0]!.init.body as string)).toEqual(draft);
  });

  it("says how long to wait when it is rate-limited", async () => {
    answers({ status: 429, body: { ok: false, error: "rate_limited" }, headers: { "retry-after": "420" } });
    expect(await sendReport(reports, draft)).toEqual({ ok: false, reason: "rateLimited", retryAfterSeconds: 420 });
  });

  it("passes the service's reason on for a report it will not take", async () => {
    answers({ status: 422, body: { ok: false, error: "body_too_short" } });
    expect(await sendReport(reports, draft)).toEqual({ ok: false, reason: "invalid", problem: "body_too_short" });
  });

  it("calls a service that is down or refuses the token unreachable, so the member keeps their words", async () => {
    for (const answer of [new Error("network"), { status: 500, body: {} }, { status: 401, body: {} }] as Answer[]) {
      answers(answer);
      expect(await sendReport(reports, draft)).toEqual({ ok: false, reason: "unreachable" });
    }
  });
});

describe("a screenshot with a report", () => {
  it("goes in the same body, as plain base64, and only when there is one", async () => {
    answers({ status: 201, body: { ok: true } });
    await sendReport(reports, { ...draft, image: "iVBORw0KGgo=" });
    expect(JSON.parse(calls[0]!.init.body as string).image).toBe("iVBORw0KGgo=");
    await sendReport(reports, draft);
    expect("image" in JSON.parse(calls[1]!.init.body as string)).toBe(false);
  });

  it("is read back with the reports token, with Sumilabu's type, and is nothing when it cannot be had", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async (url: string, init: RequestInit) => {
        calls.push({ url, method: init.method ?? "GET", init });
        return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), { status: 200, headers: { "content-type": "image/png" } });
      }),
    );
    const image = await reportImage(reports, "c1");
    expect(image?.type).toBe("image/png");
    expect(image?.bytes.byteLength).toBe(4);
    expect(calls[0]!.url).toBe(`${BASE}/reports/c1/image`);
    expect(header(0, "authorization")).toBe("Bearer dev-reports-secret");
    answers({ status: 404, body: {} });
    expect(await reportImage(reports, "c1")).toBeNull();
    answers(new Error("network"));
    expect(await reportImage(reports, "c1")).toBeNull();
  });
});

describe("the operator's list and moves", () => {
  it("reads the list, and throws rather than answering empty when it cannot", async () => {
    answers({ status: 200, body: { ok: true, reports: [{ id: "c1" }] } });
    expect(await listReports(reports)).toEqual([{ id: "c1" }]);
    answers({ status: 503, body: {} });
    await expect(listReports(reports)).rejects.toBeInstanceOf(ReportsUnreachable);
  });

  it("moves a report with the reports token and names who moved it", async () => {
    answers({ status: 200, body: { ok: true } });
    expect(await moveReport(reports, "c1", "closed", "John")).toEqual({ ok: true });
    expect(calls[0]).toMatchObject({ url: `${BASE}/reports/c1`, method: "PATCH" });
    expect(header(0, "x-board-actor")).toBe("John");
    answers({ status: 409, body: { ok: false, error: "illegal" } });
    expect((await moveReport(reports, "c1", "read", "John")).ok).toBe(false);
  });

  it("files a report with the BOARD token, never the reports one", async () => {
    answers({ status: 200, body: { ok: true, ticketId: "t1" } });
    expect(await fileReport(board, "c1", "John")).toEqual({ ok: true });
    expect(calls[0]).toMatchObject({ url: `${BASE}/reports/c1/file`, method: "POST" });
    expect(header(0, "authorization")).toBe("Bearer dev-board-secret");
    answers({ status: 409, body: { ok: false, error: "not_fileable" } });
    expect(await fileReport(board, "c1", "John")).toEqual({ ok: false, problem: "That report cannot be filed from where it stands." });
  });
});

describe("what a report may carry", () => {
  it("sends the page without its query or its fragment, whatever the browser sent", () => {
    expect(cleanReportPath("/games/gomoku/match/ab12/seat/secret-token?lang=ja#move-4")).toBe("/games/gomoku/match/ab12/seat/secret-token");
    expect(cleanReportPath("/players?q=dan")).toBe("/players");
    expect(cleanReportPath("https://evil.example/x")).toBe("/");
    expect(cleanReportPath(`/${"a".repeat(900)}`)).toHaveLength(500);
  });

  it("tells a browser apart by a random id and nothing else", () => {
    const one = newReporterRef();
    expect(one).toMatch(/^r-[0-9a-f-]{36}$/);
    expect(newReporterRef()).not.toBe(one);
  });
});
