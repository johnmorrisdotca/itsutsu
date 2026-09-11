/**
 * The features board, from a terminal — through the API, never the table.
 *
 *   pnpm task                              what is open and who holds it
 *   pnpm task add "<title>" [--detail "…"] [--kind feature|fix|chore] [--by "<who>"]
 *   pnpm task claim <key> --by "<who>"     open -> inProgress
 *   pnpm task release <key> --by "<who>"   inProgress -> open
 *   pnpm task drop <key> --by "<who>"      -> dropped
 *   pnpm task reopen <key> --by "<who>"    dropped -> open
 *   pnpm task grade <key> --priority high|normal|low|none --effort small|medium|large|none
 *   pnpm task edit <key> [--title "…"] [--detail "…"]   the text, through the API's own door
 *
 * Reads BOARD_URL (default https://itsutsu.com), BOARD_TOKEN and BOARD_ACTOR
 * (overridden by --by) from the environment — `node --env-file=.env` loads
 * .env for the pnpm script, so nothing here reads dotenv itself.
 *
 * Why this exists: `POST`/`PATCH /api/backlog` used to accept only the
 * operator's browser session, which no agent can hold. That is the whole
 * reason roughly forty rows were written straight to Postgres on
 * 2026-09-11, bypassing every rule the API enforces — thirteen of them
 * moves the board's own table forbids. This CLI is the door instead: every
 * command here is an HTTP request carrying `Authorization: Bearer
 * BOARD_TOKEN` and `X-Board-Actor: <name>`, so every cap and every move
 * rule applies to it exactly as it does to the page. `done` is deliberately
 * not a destination this CLI offers — board convergence ITS-04's release
 * tool is the only thing that writes it.
 *
 * Self-contained on purpose: nothing here imports from `src/`. A `src/`
 * module can pull in `server-only`, which throws outside a server bundle,
 * and Node's own type-stripping wants an import naming the file it means
 * rather than the alias resolution `tsconfig.json` gives the app code. The
 * small pieces that would otherwise come from `src/lib/backlog/backlog.ts`
 * (the lease math, the quick-win order) are copied here instead, verbatim
 * enough that this script and that module cannot quietly disagree about
 * what "held" means.
 */

type BacklogStatus = "open" | "inProgress" | "done" | "dropped";
type BacklogKind = "feature" | "fix" | "chore";
type BacklogPriority = "high" | "normal" | "low";
type BacklogEffort = "small" | "medium" | "large";

type BacklogItem = {
  id: string;
  key: string;
  title: string;
  detail: string;
  kind: BacklogKind;
  status: BacklogStatus;
  priority: BacklogPriority | null;
  effort: BacklogEffort | null;
  askedBy: string;
  claimedBy: string | null;
  claimedAt: string | null;
  createdAt: string;
  movedAt: string;
  releasedIn: string | null;
  releasedAt: string | null;
};

const BOARD_URL = (process.env.BOARD_URL ?? "https://itsutsu.com").replace(/\/+$/, "");
const BOARD_TOKEN = process.env.BOARD_TOKEN ?? "";

if (BOARD_TOKEN === "") {
  console.error("BOARD_TOKEN is not set.");
  process.exit(2);
}

function flag(name: string, args: string[]): string | undefined {
  const at = args.indexOf(`--${name}`);
  return at > -1 ? args[at + 1] : undefined;
}

function actorFor(args: string[]): string {
  return flag("by", args) ?? process.env.BOARD_ACTOR ?? "";
}

function usage(): never {
  console.error(
    [
      "usage:",
      "  pnpm task",
      '  pnpm task add "<title>" [--detail "…"] [--kind feature|fix|chore] [--by "<who>"]',
      '  pnpm task claim <key> --by "<who>"',
      '  pnpm task release <key> --by "<who>"',
      '  pnpm task drop <key> --by "<who>"',
      '  pnpm task reopen <key> --by "<who>"',
      "  pnpm task grade <key> --priority high|normal|low|none --effort small|medium|large|none",
      '  pnpm task edit <key> [--title "…"] [--detail "…"]',
    ].join("\n"),
  );
  process.exit(2);
}

/** A refusal from the API, printed the way it phrased it. Never writes anything itself. */
function fail(body: { error?: string }): never {
  console.error(body.error ?? "That did not go through.");
  process.exit(1);
}

async function api(path: string, actor: string, init: RequestInit = {}): Promise<Response> {
  return fetch(`${BOARD_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${BOARD_TOKEN}`,
      "X-Board-Actor": actor,
      ...(init.body === undefined ? {} : { "Content-Type": "application/json" }),
    },
  });
}

/**
 * In progress is a claim, not only a status — copied from BOARD_RULES.md's
 * reference shapes, which `src/lib/backlog/backlog.ts` also copies. See
 * that module for the fuller explanation; this is the same six hours.
 */
const LEASE_MS = 6 * 60 * 60 * 1000;

function leaseExpired(claimedAt: string | null, nowMs: number): boolean {
  if (claimedAt === null) return true;
  const held = Date.parse(claimedAt);
  return !Number.isFinite(held) || nowMs - held > LEASE_MS;
}

function heldNow(item: BacklogItem, nowMs: number): boolean {
  return item.claimedBy !== null && item.claimedBy.trim().length > 0 && !leaseExpired(item.claimedAt, nowMs);
}

const PRIORITY_ORDER: readonly BacklogPriority[] = ["high", "normal", "low"];
const EFFORT_ORDER: readonly BacklogEffort[] = ["small", "medium", "large"];

function rank<T extends string>(order: readonly T[], value: T | null): number {
  return value === null ? order.length : order.indexOf(value);
}

/** BOARD_RULES.md invariant 7: priority descending, then effort ascending, then most recently moved. */
function byQuickWin(a: BacklogItem, b: BacklogItem): number {
  return (
    rank(PRIORITY_ORDER, a.priority) - rank(PRIORITY_ORDER, b.priority) ||
    rank(EFFORT_ORDER, a.effort) - rank(EFFORT_ORDER, b.effort) ||
    b.movedAt.localeCompare(a.movedAt)
  );
}

async function board(actor: string): Promise<BacklogItem[]> {
  const response = await api("/api/backlog", actor);
  if (!response.ok) fail(await response.json().catch(() => ({})));
  const body = (await response.json()) as { items: BacklogItem[] };
  return body.items;
}

async function resolveKey(key: string, actor: string): Promise<BacklogItem> {
  const found = (await board(actor)).find((item) => item.key === key);
  if (found === undefined) {
    console.error(`No such row: ${key}`);
    process.exit(1);
  }
  return found;
}

/** Every write but `add` is a PATCH by id, the key resolved first. */
async function patchItem(key: string, actor: string, data: Record<string, unknown>): Promise<BacklogItem> {
  const item = await resolveKey(key, actor);
  const response = await api(`/api/backlog/${item.id}`, actor, { method: "PATCH", body: JSON.stringify(data) });
  if (!response.ok) fail(await response.json().catch(() => ({})));
  return (await response.json()) as BacklogItem;
}

/** A 6-wide field: the one kind that earns a flag, mirroring UmaKuma's BUG marker for its own most-urgent-looking kind. */
function kindFlag(kind: BacklogKind): string {
  return kind === "fix" ? "FIX   " : "      ";
}

function holdLabel(item: BacklogItem, nowMs: number): string {
  if (item.status !== "inProgress") return "WAITING";
  return heldNow(item, nowMs) ? `HELD BY ${item.claimedBy}` : `STALE ${item.claimedBy}`;
}

function gradeTag(item: BacklogItem): string {
  const parts: string[] = [];
  if (item.priority !== null) parts.push(`P:${item.priority}`);
  if (item.effort !== null) parts.push(`E:${item.effort}`);
  return parts.length === 0 ? "" : `${parts.join(" ")}  `;
}

function taskLine(item: BacklogItem, nowMs: number): string {
  return `${item.key.padEnd(40)}  ${kindFlag(item.kind)}${holdLabel(item, nowMs).padEnd(22)}${gradeTag(item)}${item.title}`;
}

/** Held now, then waiting by quick wins, then stale — so a reader sees what is live first and what has lapsed last. */
async function list(actor: string): Promise<void> {
  const unfinished = (await board(actor)).filter((item) => item.status === "open" || item.status === "inProgress");
  const nowMs = Date.now();
  const held = unfinished.filter((item) => item.status === "inProgress" && heldNow(item, nowMs));
  const waiting = unfinished.filter((item) => item.status === "open").sort(byQuickWin);
  const stale = unfinished.filter((item) => item.status === "inProgress" && !heldNow(item, nowMs));

  console.log(`${waiting.length} waiting · ${held.length} in progress · ${stale.length} stale · on ${BOARD_URL}\n`);
  for (const item of [...held, ...waiting, ...stale]) console.log(taskLine(item, nowMs));
  if (unfinished.length === 0) console.log("Nothing on the board.");
}

async function main(): Promise<void> {
  const [command = "list", ...rest] = process.argv.slice(2);
  const actor = actorFor(rest);

  switch (command) {
    case "list": {
      await list(actor);
      break;
    }

    case "add": {
      const [title] = rest;
      if (title === undefined) usage();
      const response = await api("/api/backlog", actor, {
        method: "POST",
        body: JSON.stringify({ title, detail: flag("detail", rest), kind: flag("kind", rest) }),
      });
      if (!response.ok) fail(await response.json().catch(() => ({})));
      const item = (await response.json()) as BacklogItem;
      console.log(`added ${item.key} on ${BOARD_URL}`);
      break;
    }

    case "claim": {
      const [key] = rest;
      if (key === undefined) usage();
      const item = await patchItem(key, actor, { status: "inProgress" });
      console.log(`${item.key} in progress, held by ${item.claimedBy} on ${BOARD_URL}`);
      break;
    }

    case "release": {
      const [key] = rest;
      if (key === undefined) usage();
      const item = await patchItem(key, actor, { status: "open" });
      console.log(`${item.key} released on ${BOARD_URL}`);
      break;
    }

    case "drop": {
      const [key] = rest;
      if (key === undefined) usage();
      const item = await patchItem(key, actor, { status: "dropped" });
      console.log(`${item.key} dropped on ${BOARD_URL}`);
      break;
    }

    case "reopen": {
      const [key] = rest;
      if (key === undefined) usage();
      const item = await patchItem(key, actor, { status: "open" });
      console.log(`${item.key} reopened on ${BOARD_URL}`);
      break;
    }

    case "grade": {
      const [key] = rest;
      if (key === undefined) usage();
      const priority = flag("priority", rest);
      const effort = flag("effort", rest);
      if (priority === undefined && effort === undefined) usage();
      const data: Record<string, unknown> = {};
      if (priority !== undefined) data.priority = priority === "none" ? null : priority;
      if (effort !== undefined) data.effort = effort === "none" ? null : effort;
      const item = await patchItem(key, actor, data);
      console.log(`${item.key} graded on ${BOARD_URL}`);
      break;
    }

    case "edit": {
      const [key] = rest;
      if (key === undefined) usage();
      const title = flag("title", rest);
      const detail = flag("detail", rest);
      if (title === undefined && detail === undefined) usage();
      const data: Record<string, unknown> = {};
      if (title !== undefined) data.title = title;
      if (detail !== undefined) data.detail = detail;
      const item = await patchItem(key, actor, data);
      console.log(`${item.key} edited on ${BOARD_URL}`);
      break;
    }

    default:
      usage();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
