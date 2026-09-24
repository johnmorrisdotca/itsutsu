import { REPORT_HEALTH_TIMEOUT_MS, REPORT_SEND_TIMEOUT_MS } from "../reports/reports.constants.ts";

import type { Report, ReportChanged, ReportDraft, ReportImage, ReportSent, ReportStatus } from "./reportsClient.types.ts";
import type { SumilabuTarget } from "./sumilabuProject.types.ts";

/**
 * Members' problem reports, which live on Sumilabu beside the board.
 *
 * The contract is Sumilabu's `docs/board/REPORTS_CONTRACT.md`: one store for
 * every site's reports, its own token map (`sumilabuTarget("reports")`), and
 * filing a report as a ticket through the BOARD token, so a leaked reports key
 * can never write to the board.
 *
 * Only the site's server calls this. The browser reaches it through the
 * Server Functions in `reports.actions.ts` and never holds a token.
 *
 * Plain `fetch` and imports that name their files, as `boardClient.ts` is.
 */

export class ReportsUnreachable extends Error {}

/** Sumilabu reads an actor past this as nobody, as the board does. */
const ACTOR_MAX = 80;

type Json = Record<string, unknown>;

async function call(
  target: SumilabuTarget,
  path: string,
  init: { method?: string; body?: unknown; actor?: string; timeoutMs?: number } = {},
): Promise<{ status: number; body: Json; retryAfter: string | null }> {
  const method = init.method ?? "GET";
  const headers: Record<string, string> = { authorization: `Bearer ${target.token}`, accept: "application/json" };
  if (init.actor) headers["x-board-actor"] = init.actor.slice(0, ACTOR_MAX);
  if (init.body !== undefined) headers["content-type"] = "application/json";
  let response: Response;
  try {
    response = await fetch(`${target.url}/api/v1/projects/${target.projectKey}${path}`, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
      cache: "no-store",
      signal: AbortSignal.timeout(init.timeoutMs ?? REPORT_SEND_TIMEOUT_MS),
    });
  } catch (error) {
    throw new ReportsUnreachable(`Sumilabu's reports did not answer ${method} ${path}: ${(error as Error).message}`);
  }
  const text = await response.text();
  let body: Json = {};
  try {
    body = text ? (JSON.parse(text) as Json) : {};
  } catch {
    body = { error: text.slice(0, 200) };
  }
  if (response.status === 401) throw new ReportsUnreachable(`Sumilabu refused ${target.tokenEnv} for ${target.projectKey}'s reports (401).`);
  if (response.status >= 500) throw new ReportsUnreachable(`Sumilabu's reports answered ${response.status} to ${method} ${path}.`);
  return { status: response.status, body, retryAfter: response.headers.get("retry-after") };
}

/**
 * Whether the service can take a report right now: one `SELECT 1` on the other
 * end. Anything but a plain yes, a timeout included, is no. Never throws.
 */
export async function reportsHealthy(target: SumilabuTarget): Promise<boolean> {
  try {
    const response = await fetch(`${target.url}/api/v1/health`, {
      headers: { authorization: `Bearer ${target.token}`, accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(REPORT_HEALTH_TIMEOUT_MS),
    });
    if (!response.ok) return false;
    const body = (await response.json()) as Json;
    return body.ok === true;
  } catch {
    return false;
  }
}

/** A member's report. A refusal says why in the window's terms; a service that is down says so, and nothing is kept anywhere else. */
export async function sendReport(target: SumilabuTarget, draft: ReportDraft): Promise<ReportSent> {
  let answer: Awaited<ReturnType<typeof call>>;
  try {
    answer = await call(target, "/reports", { method: "POST", body: draft });
  } catch {
    return { ok: false, reason: "unreachable" };
  }
  const { status, body, retryAfter } = answer;
  if (status === 201 || status === 200) return { ok: true };
  if (status === 429) return { ok: false, reason: "rateLimited", retryAfterSeconds: Math.max(1, Number(retryAfter) || 60) };
  if (status === 400 || status === 422) {
    const problem = typeof body.error === "string" ? body.error : "That report could not be taken.";
    return { ok: false, reason: "invalid", problem };
  }
  return { ok: false, reason: "unreachable" };
}

/** This project's reports, newest first. An unreadable list throws, so a page can say so rather than showing none. */
export async function listReports(target: SumilabuTarget, limit = 100): Promise<Report[]> {
  const { status, body } = await call(target, `/reports?limit=${limit}`);
  if (status !== 200 || !Array.isArray(body.reports)) throw new ReportsUnreachable(`Sumilabu would not list ${target.projectKey}'s reports (${status}).`);
  return body.reports as Report[];
}

function changed(status: number, body: Json, what: string): ReportChanged {
  if (status === 200) return { ok: true };
  if (status === 404) return { ok: false, problem: "That report is gone." };
  if (status === 409) return { ok: false, problem: `That report cannot be ${what} from where it stands.` };
  return { ok: false, problem: typeof body.error === "string" ? body.error : `Sumilabu refused (${status}).` };
}

/** A move along the contract's table. `filed` is not one: see `fileReport`. */
export async function moveReport(target: SumilabuTarget, id: string, to: Exclude<ReportStatus, "filed" | "new">, actor: string): Promise<ReportChanged> {
  try {
    const { status, body } = await call(target, `/reports/${encodeURIComponent(id)}`, { method: "PATCH", body: { status: to }, actor });
    return changed(status, body, `marked ${to}`);
  } catch (error) {
    return { ok: false, problem: (error as Error).message };
  }
}

/**
 * Files a report as a ticket on the same project's board, and links the two,
 * in one transaction on Sumilabu. `board` is the BOARD target: the reports
 * token cannot do this, by design.
 */
export async function fileReport(board: SumilabuTarget, id: string, actor: string): Promise<ReportChanged> {
  try {
    const { status, body } = await call(board, `/reports/${encodeURIComponent(id)}/file`, { method: "POST", body: {}, actor });
    return changed(status, body, "filed");
  } catch (error) {
    return { ok: false, problem: (error as Error).message };
  }
}

/**
 * A report's screenshot, for the operator's page and nothing else. Asked with
 * the reports token, the same as the list; null when there is none, or when
 * Sumilabu cannot answer, so the page shows the report without it.
 */
export async function reportImage(target: SumilabuTarget, id: string): Promise<ReportImage | null> {
  try {
    const response = await fetch(`${target.url}/api/v1/projects/${target.projectKey}/reports/${encodeURIComponent(id)}/image`, {
      headers: { authorization: `Bearer ${target.token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(REPORT_SEND_TIMEOUT_MS),
    });
    if (!response.ok) return null;
    return { type: response.headers.get("content-type") ?? "application/octet-stream", bytes: await response.arrayBuffer() };
  } catch {
    return null;
  }
}
