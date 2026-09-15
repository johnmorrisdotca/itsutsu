import { KEY_PROBE } from "./boardExport.constants.ts";
import type { SumilabuImportRow, SumilabuTicketView } from "./boardExport.types.ts";
import type { SumilabuTarget } from "./sumilabuProject.types.ts";

/**
 * The three calls the one-time export makes: read the target's tickets, ask
 * whether it takes keys, and import a batch. Plain `fetch`; the target (and
 * with it the token) is decided by `sumilabuTarget`, never here.
 */

type Json = Record<string, unknown>;

async function call(
  target: SumilabuTarget,
  path: string,
  init: { method?: string; body?: unknown; actor?: string } = {},
): Promise<{ status: number; body: Json }> {
  const headers: Record<string, string> = { authorization: `Bearer ${target.token}`, accept: "application/json" };
  if (init.actor) headers["x-board-actor"] = init.actor;
  if (init.body !== undefined) headers["content-type"] = "application/json";
  const response = await fetch(`${target.url}/api/v1/projects/${target.projectKey}${path}`, {
    method: init.method ?? "GET",
    headers,
    body: init.body === undefined ? undefined : JSON.stringify(init.body),
    cache: "no-store",
  });
  const text = await response.text();
  let body: Json = {};
  try {
    body = text ? (JSON.parse(text) as Json) : {};
  } catch {
    body = { error: text.slice(0, 200) };
  }
  if (response.status === 401) throw new Error(`Sumilabu refused ${target.tokenEnv} for ${target.projectKey} (401).`);
  if (response.status >= 500) throw new Error(`Sumilabu answered ${response.status} to ${init.method ?? "GET"} ${path}.`);
  return { status: response.status, body };
}

export async function listTargetTickets(target: SumilabuTarget): Promise<SumilabuTicketView[]> {
  const { status, body } = await call(target, "/tickets");
  if (status !== 200 || !Array.isArray(body.tickets)) throw new Error(`Could not list ${target.projectKey}'s tickets (${status}).`);
  return body.tickets as SumilabuTicketView[];
}

/**
 * Whether the target stores a ticket key, asked of the target rather than set
 * by a flag, so the run that follows the deploy sends keys without anybody
 * remembering to say so.
 *
 * A service that knows keys answers `GET tickets?key=` as one ticket or a 404.
 * One that does not ignores the parameter and hands back the whole list. The
 * probe key is one nobody holds, so the first shape is a 404.
 */
export async function targetTakesKeys(target: SumilabuTarget): Promise<boolean> {
  const { status, body } = await call(target, `/tickets?key=${KEY_PROBE}`);
  if (Array.isArray(body.tickets)) return false;
  if ((status === 404 && body.error === "missing") || (status === 200 && body.ticket)) return true;
  throw new Error(`Could not tell whether ${target.host} takes ticket keys: GET tickets?key= answered ${status}.`);
}

export type ImportOutcome = { ok: true; imported: number } | { ok: false; status: number; problems: string[] };

export async function importBatch(target: SumilabuTarget, rows: readonly SumilabuImportRow[], actor: string): Promise<ImportOutcome> {
  const { status, body } = await call(target, "/tickets/import", { method: "POST", actor, body: { tickets: rows } });
  if (status === 200) return { ok: true, imported: Number(body.imported ?? rows.length) };
  const problems = Array.isArray(body.problems) ? body.problems.map(String) : [String(body.error ?? `answered ${status}`)];
  return { ok: false, status, problems };
}
