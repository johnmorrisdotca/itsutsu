import { BACKLOG_EFFORTS, BACKLOG_KINDS, BACKLOG_PRIORITIES, BACKLOG_STATUSES } from "../backlog/backlog.constants.ts";
import { neighbourKey } from "../backlog/backlogKey.ts";
import type { BacklogItem } from "../backlog/backlog.types.ts";

import type { SumilabuImportRow } from "./boardExport.types.ts";
import type { BoardChange, BoardDraft, BoardImportOutcome, BoardMoveTarget, BoardOutcome, BoardTicketView } from "./boardClient.types.ts";
import type { SumilabuTarget } from "./sumilabuProject.types.ts";

/**
 * Itsutsu's features board, which lives on Sumilabu.
 *
 * One thin client, and the only one, for every caller — `pnpm task`,
 * `pnpm release:take --done`, the /backlog page through `backlogStore.ts`, and
 * the one-time `pnpm board:export` — in UmaKuma's pattern. The
 * board speaks the contract's words (`docs/plans/board-convergence/BOARD_RULES.md`),
 * which are Itsutsu's own words already, so the only translation is from the
 * service's nulls to the empty strings a `BacklogItem` has always carried.
 *
 * The rules are the service's. Every cap, the table of moves, the six-hour
 * lease and the claim condition are enforced on Sumilabu, and this file only
 * asks and reports what it was told. Which project, and with which token, is
 * `sumilabuTarget("board")`'s decision: itsutsu-dev unless the live site, or a
 * `:prod` script, asked for the live one.
 *
 * Plain `fetch`, no `server-only`, and imports that name their files, because
 * Node runs `pnpm task` and `release:take` by stripping types.
 *
 * AN UNREADABLE BOARD IS NEVER AN EMPTY ONE. No answer, a refused token or a
 * failing service throws `BoardUnreachable`, so a page can say the board could
 * not be read and a script can exit non-zero with the reason, rather than
 * either of them showing nothing and meaning "nothing is wanted".
 */

export const BOARD_TIMEOUT_MS = 10_000;

/** An import batch is up to five hundred upserts on the other end, so it is given longer. */
export const BOARD_IMPORT_TIMEOUT_MS = 120_000;

/** The key `boardTakesKeys` asks for. Nobody holds it; what matters is the shape of the answer. */
const KEY_PROBE = "board-export-key-probe";

/** Sumilabu reads an actor past this as nobody, and refuses a move without one. */
const ACTOR_MAX = 80;

/** How many numbered neighbours a taken key is tried with before an add gives up. */
const KEY_ATTEMPTS = 99;

export class BoardUnreachable extends Error {}

type Json = Record<string, unknown>;

async function call(
  target: SumilabuTarget,
  path: string,
  init: { method?: string; body?: unknown; actor?: string | null; timeoutMs?: number } = {},
): Promise<{ status: number; body: Json }> {
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
      signal: AbortSignal.timeout(init.timeoutMs ?? BOARD_TIMEOUT_MS),
    });
  } catch (error) {
    throw new BoardUnreachable(`Sumilabu's board did not answer ${method} ${path}: ${(error as Error).message}`);
  }
  const text = await response.text();
  let body: Json = {};
  try {
    body = text ? (JSON.parse(text) as Json) : {};
  } catch {
    body = { error: text.slice(0, 200) };
  }
  if (response.status === 401) throw new BoardUnreachable(`Sumilabu refused ${target.tokenEnv} for ${target.projectKey}'s board (401).`);
  if (response.status >= 500) throw new BoardUnreachable(`Sumilabu's board answered ${response.status} to ${method} ${path}.`);
  return { status: response.status, body };
}

function wordIn<T extends string>(values: Record<string, T>, value: unknown): T | null {
  return typeof value === "string" && (Object.values(values) as string[]).includes(value) ? (value as T) : null;
}

/**
 * A board ticket as the `BacklogItem` every page and script here already
 * reads. A ticket filed with no key (none of Itsutsu's) is cited by its id.
 * A word the contract does not have reads the way `statusFrom` always read
 * one: open, a feature, ungraded — a row nobody can account for is a row
 * somebody should look at, not one to hide.
 */
export function itemFromTicket(view: BoardTicketView): BacklogItem {
  return {
    id: view.id,
    key: view.key ?? view.id,
    title: view.title,
    detail: view.detail ?? "",
    kind: wordIn(BACKLOG_KINDS, view.kind) ?? BACKLOG_KINDS.feature,
    status: wordIn(BACKLOG_STATUSES, view.status) ?? BACKLOG_STATUSES.open,
    priority: wordIn(BACKLOG_PRIORITIES, view.priority),
    effort: wordIn(BACKLOG_EFFORTS, view.effort),
    askedBy: view.askedBy ?? "",
    claimedBy: view.claimedBy,
    claimedAt: view.claimedAt,
    createdAt: view.createdAt,
    movedAt: view.movedAt,
    releasedIn: view.releasedIn,
    releasedAt: view.releasedAt,
  };
}

function ticketIn(body: Json): BacklogItem | null {
  const view = body.ticket as BoardTicketView | null | undefined;
  return view ? itemFromTicket(view) : null;
}

/** One answer to a write, with the refusal in words a person can act on. */
function outcome(status: number, body: Json): BoardOutcome {
  const item = ticketIn(body);
  if ((status === 200 || status === 201) && item !== null) return { ok: true, item };
  if (status === 404) return { ok: false, reason: "missing", problems: ["No such row on the board."], heldBy: null };
  if (body.error === "held") {
    const heldBy = typeof body.heldBy === "string" ? body.heldBy : (item?.claimedBy ?? null);
    return { ok: false, reason: "held", problems: [`Held by ${heldBy ?? "somebody"}. Ask them to release it.`], heldBy };
  }
  if (body.error === "illegal") {
    const where = item === null ? "somewhere else now" : `${item.status} now`;
    return { ok: false, reason: "illegal", problems: [`It is ${where}, and that is not a move the board makes from there.`], heldBy: null };
  }
  if (body.error === "done") {
    return { ok: false, reason: "done", problems: ["A done row keeps the words it shipped under. File a new row that cites it."], heldBy: null };
  }
  const problems = Array.isArray(body.problems) && body.problems.length > 0 ? body.problems.map(String) : [String(body.error ?? `Sumilabu answered ${status}.`)];
  return { ok: false, reason: "refused", problems, heldBy: null };
}

const one = (id: string) => `/tickets/${encodeURIComponent(id)}`;

/** Every ticket as the service hands it back, for a caller comparing against the service's own fields. */
export async function listTicketViews(target: SumilabuTarget, filter: { unfinished?: boolean } = {}): Promise<BoardTicketView[]> {
  const { status, body } = await call(target, filter.unfinished ? "/tickets?unfinished=1" : "/tickets");
  if (status !== 200 || !Array.isArray(body.tickets)) throw new BoardUnreachable(`Sumilabu's board would not list ${target.projectKey}'s tickets (${status}).`);
  return body.tickets as BoardTicketView[];
}

/** Everything, or everything not yet done or dropped (stale holds included), in Itsutsu's words. */
export async function listTickets(target: SumilabuTarget, filter: { unfinished?: boolean } = {}): Promise<BacklogItem[]> {
  return (await listTicketViews(target, filter)).map(itemFromTicket);
}

export async function ticketById(target: SumilabuTarget, id: string): Promise<BacklogItem | null> {
  const { status, body } = await call(target, one(id));
  if (status === 404) return null;
  const item = ticketIn(body);
  if (status !== 200 || item === null) throw new BoardUnreachable(`Sumilabu's board would not read ticket ${id} (${status}).`);
  return item;
}

/** The row a key names, or null. A key that is not a slug can name no row, so it is null too. */
export async function ticketByKey(target: SumilabuTarget, key: string): Promise<BacklogItem | null> {
  const { status, body } = await call(target, `/tickets?key=${encodeURIComponent(key)}`);
  if ((status === 404 && body.error === "missing") || (status === 400 && body.error === "invalid_key")) return null;
  const item = ticketIn(body);
  if (status !== 200 || item === null) throw new BoardUnreachable(`Sumilabu's board would not look up the key ${key} (${status}).`);
  return item;
}

/**
 * Files a request under its key. Keys stay unique per project, and two people
 * can ask for the same thing on the same day, so a taken key gets a numbered
 * neighbour rather than an error a person would have to understand — what the
 * local board did before it moved.
 */
export async function addTicket(target: SumilabuTarget, draft: BoardDraft, actor: string | null): Promise<BoardOutcome> {
  for (let attempt = 1; attempt <= KEY_ATTEMPTS; attempt += 1) {
    const key = attempt === 1 ? draft.key : neighbourKey(draft.key, attempt);
    const { status, body } = await call(target, "/tickets", {
      method: "POST",
      actor,
      body: { key, title: draft.title, detail: draft.detail || null, kind: draft.kind, askedBy: draft.askedBy || null },
    });
    if (status === 409 && body.error === "key_taken") continue;
    return outcome(status, body);
  }
  return { ok: false, reason: "refused", problems: [`Every key from ${draft.key} to ${neighbourKey(draft.key, KEY_ATTEMPTS)} is taken.`], heldBy: null };
}

/** A grade, a revision of the words, or a plain move, as one PATCH under the service's own conditions. */
export async function patchTicket(target: SumilabuTarget, id: string, change: BoardChange, actor: string | null): Promise<BoardOutcome> {
  const { status, body } = await call(target, one(id), { method: "PATCH", actor, body: change });
  return outcome(status, body);
}

/**
 * A move along the board's table.
 *
 * Taking a row that is already in progress is two writes, because the table
 * has no in-progress-to-in-progress move: back to open, then taken. Both carry
 * the claim condition, so a hold that is still live refuses the first and
 * nothing has moved; a lapsed one is freed and taken. A row the actor already
 * holds is left as it is, which is also what the local board did.
 */
export async function moveTicket(target: SumilabuTarget, item: BacklogItem, to: BoardMoveTarget, actor: string): Promise<BoardOutcome> {
  if (to === BACKLOG_STATUSES.inProgress && item.status === BACKLOG_STATUSES.inProgress) {
    if (item.claimedBy === actor) return { ok: true, item };
    const freed = await patchTicket(target, item.id, { status: BACKLOG_STATUSES.open }, actor);
    if (!freed.ok) return freed;
  }
  return patchTicket(target, item.id, { status: to }, actor);
}

/** `done`, with the version just taken and its instant: the release tool's write, and nothing else's. */
export async function shipTicket(
  target: SumilabuTarget,
  id: string,
  ship: { version: string; releasedAt: string },
  actor: string,
): Promise<BoardOutcome> {
  const { status, body } = await call(target, `${one(id)}/ship`, { method: "POST", actor, body: ship });
  return outcome(status, body);
}

/**
 * Whether the board stores a ticket key, asked of the board rather than set by
 * a flag, so the import that follows a deploy sends keys without anybody
 * remembering to say so.
 *
 * A service that knows keys answers `GET tickets?key=` as one ticket or a 404.
 * One that does not ignores the parameter and hands back the whole list. The
 * probe key is one nobody holds, so the first shape is a 404. Anything else is
 * thrown: "I could not tell" must not read as either answer.
 */
export async function boardTakesKeys(target: SumilabuTarget): Promise<boolean> {
  const { status, body } = await call(target, `/tickets?key=${KEY_PROBE}`);
  if (Array.isArray(body.tickets)) return false;
  if ((status === 404 && body.error === "missing") || (status === 200 && body.ticket)) return true;
  throw new BoardUnreachable(`Could not tell whether ${target.host} takes ticket keys: GET tickets?key= answered ${status}.`);
}

/**
 * One batch of the one-time move of Itsutsu's board (`pnpm board:export`).
 * The service upserts by id, so a run stopped half way is run again; a refusal
 * comes back as one problem per row.
 */
export async function importTickets(target: SumilabuTarget, rows: readonly SumilabuImportRow[], actor: string): Promise<BoardImportOutcome> {
  const { status, body } = await call(target, "/tickets/import", { method: "POST", actor, body: { tickets: rows }, timeoutMs: BOARD_IMPORT_TIMEOUT_MS });
  if (status === 200) return { ok: true, imported: Number(body.imported ?? rows.length) };
  const problems = Array.isArray(body.problems) ? body.problems.map(String) : [String(body.error ?? `answered ${status}`)];
  return { ok: false, status, problems };
}
