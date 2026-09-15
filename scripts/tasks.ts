/**
 * The features board, from a terminal.
 *
 *   pnpm task                              what is open and who holds it
 *   pnpm task add "<title>" [--detail "…"] [--kind feature|fix|chore] [--by "<who>"]
 *   pnpm task claim <key> --by "<who>"     open -> inProgress; a lapsed hold is freed, then taken
 *   pnpm task release <key> --by "<who>"   inProgress -> open
 *   pnpm task drop <key> --by "<who>"      -> dropped
 *   pnpm task reopen <key> --by "<who>"    dropped -> open
 *   pnpm task grade <key> --priority high|normal|low|none --effort small|medium|large|none
 *   pnpm task edit <key> [--title "…"] [--detail "…"] --by "<who>"
 *
 *   pnpm task:prod <command> …             the same commands, on the LIVE board
 *
 * The board lives on Sumilabu, and this talks to it through `boardClient.ts`,
 * the same client the /backlog page and `release:take` use. Every cap and every
 * move rule is the service's, so there is nothing this can do that walks past
 * one: it asks, and prints what it was told.
 *
 * WHICH BOARD is `sumilabuTarget("board")`'s decision, and forgetting lands on
 * itsutsu-dev. `pnpm task:prod` sets SUMILABU_PROJECT_KEY=itsutsu and opts in
 * by its own name, and it still needs the live board token, which no worktree's
 * `.env` holds. Every command prints the board it reached.
 *
 * AN UNREADABLE BOARD EXITS NON-ZERO WITH THE REASON. It never lists as empty,
 * because "nothing is wanted" and "nothing could be read" are different facts.
 *
 * `stamp` is retired. It wrote a release onto rows closed by hand before
 * `release:take` could close them; those stamps came across with the import,
 * and Sumilabu writes one only when the release tool ships a row.
 *
 * Keys resolve through Sumilabu's `GET tickets?key=`, and every write goes by
 * the id it resolved to. BOARD_ACTOR (overridden by --by) names who is writing.
 * Imports name their files, because Node runs this by stripping types.
 */
import { BACKLOG_EFFORTS, BACKLOG_KINDS, BACKLOG_PRIORITIES, BACKLOG_STATUSES } from "../src/lib/backlog/backlog.constants.ts";
import { keyFromTitle } from "../src/lib/backlog/backlogKey.ts";
import type { BacklogEffort, BacklogItem, BacklogKind, BacklogPriority } from "../src/lib/backlog/backlog.types.ts";
import { addTicket, listTickets, moveTicket, patchTicket, ticketByKey } from "../src/lib/sumilabu/boardClient.ts";
import type { BoardChange, BoardMoveTarget, BoardOutcome } from "../src/lib/sumilabu/boardClient.types.ts";
import { SUMILABU_PROJECTS, liveOptIn, sumilabuTarget, targetLine } from "../src/lib/sumilabu/sumilabuProject.ts";
import type { SumilabuTarget } from "../src/lib/sumilabu/sumilabuProject.types.ts";

function flag(name: string, args: string[]): string | undefined {
  const at = args.indexOf(`--${name}`);
  return at > -1 ? args[at + 1] : undefined;
}

function usage(): never {
  console.error(
    [
      "usage:",
      "  pnpm task                    (pnpm task:prod for the live board)",
      '  pnpm task add "<title>" [--detail "…"] [--kind feature|fix|chore] [--by "<who>"]',
      '  pnpm task claim <key> --by "<who>"',
      '  pnpm task release <key> --by "<who>"',
      '  pnpm task drop <key> --by "<who>"',
      '  pnpm task reopen <key> --by "<who>"',
      "  pnpm task grade <key> --priority high|normal|low|none --effort small|medium|large|none",
      '  pnpm task edit <key> [--title "…"] [--detail "…"] --by "<who>"',
    ].join("\n"),
  );
  process.exit(2);
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

/** The board this run reached, said on every line that reports a write. */
function where(target: SumilabuTarget): string {
  return target.projectKey === SUMILABU_PROJECTS.live ? `${targetLine(target)} (LIVE, opted in by ${liveOptIn()})` : targetLine(target);
}

/** Who is writing: every move and every revision names somebody, or Sumilabu refuses it. */
function actorFrom(args: string[]): string {
  const who = (flag("by", args) ?? process.env.BOARD_ACTOR ?? "").trim();
  if (who === "") fail('Name who is doing this with --by "<who>" (or BOARD_ACTOR).');
  return who;
}

async function rowFor(target: SumilabuTarget, key: string): Promise<BacklogItem> {
  const item = await ticketByKey(target, key);
  if (item === null) fail(`No such row on ${where(target)}: ${key}`);
  return item;
}

function landed(outcome: BoardOutcome, key: string): BacklogItem {
  if (!outcome.ok) fail(`${key}: ${outcome.problems.join(" ")}`);
  return outcome.item;
}

function wordOrNull<T extends string>(raw: string | undefined, values: Record<string, T>): T | null | undefined {
  if (raw === undefined) return undefined;
  if (raw === "none") return null;
  if (!(Object.values(values) as string[]).includes(raw)) usage();
  return raw as T;
}

/**
 * In progress is a claim, not only a status — BOARD_RULES.md's reference
 * shapes, which `src/lib/backlog/backlog.ts` also copies. The list reads the
 * lease here only to group what it prints; who may take a row is Sumilabu's.
 */
const LEASE_MS = 6 * 60 * 60 * 1000;

function heldNow(item: BacklogItem, nowMs: number): boolean {
  if (item.claimedBy === null || item.claimedBy.trim() === "" || item.claimedAt === null) return false;
  const held = Date.parse(item.claimedAt);
  return Number.isFinite(held) && nowMs - held <= LEASE_MS;
}

const PRIORITY_ORDER = Object.values(BACKLOG_PRIORITIES);
const EFFORT_ORDER = Object.values(BACKLOG_EFFORTS);

function rank<T extends string>(order: readonly T[], value: T | null): number {
  return value === null ? order.length : order.indexOf(value);
}

/** BOARD_RULES.md invariant 7: priority descending, then effort ascending, then most recently moved. */
function byQuickWin(a: BacklogItem, b: BacklogItem): number {
  return (
    rank<BacklogPriority>(PRIORITY_ORDER, a.priority) - rank<BacklogPriority>(PRIORITY_ORDER, b.priority) ||
    rank<BacklogEffort>(EFFORT_ORDER, a.effort) - rank<BacklogEffort>(EFFORT_ORDER, b.effort) ||
    b.movedAt.localeCompare(a.movedAt)
  );
}

function taskLine(item: BacklogItem, nowMs: number): string {
  const kind = item.kind === BACKLOG_KINDS.fix ? "FIX   " : "      ";
  const hold = item.status !== BACKLOG_STATUSES.inProgress ? "WAITING" : heldNow(item, nowMs) ? `HELD BY ${item.claimedBy}` : `STALE ${item.claimedBy ?? ""}`;
  const grades = [item.priority === null ? "" : `P:${item.priority}`, item.effort === null ? "" : `E:${item.effort}`].filter(Boolean).join(" ");
  return `${item.key.padEnd(40)}  ${kind}${hold.padEnd(22)}${grades === "" ? "" : `${grades}  `}${item.title}`;
}

/** Held now, then waiting by quick wins, then stale — what is live first and what has lapsed last. */
async function list(target: SumilabuTarget): Promise<void> {
  const unfinished = await listTickets(target, { unfinished: true });
  const nowMs = Date.now();
  const held = unfinished.filter((item) => item.status === BACKLOG_STATUSES.inProgress && heldNow(item, nowMs));
  const waiting = unfinished.filter((item) => item.status === BACKLOG_STATUSES.open).sort(byQuickWin);
  const stale = unfinished.filter((item) => item.status === BACKLOG_STATUSES.inProgress && !heldNow(item, nowMs));
  console.log(`${waiting.length} waiting · ${held.length} in progress · ${stale.length} stale · on ${where(target)}\n`);
  for (const item of [...held, ...waiting, ...stale]) console.log(taskLine(item, nowMs));
  if (unfinished.length === 0) console.log("Nothing on the board.");
}

async function move(target: SumilabuTarget, rest: string[], to: BoardMoveTarget, said: string): Promise<void> {
  const [key] = rest;
  if (key === undefined) usage();
  const who = actorFrom(rest);
  const item = landed(await moveTicket(target, await rowFor(target, key), to, who), key);
  console.log(`${item.key} ${said}${to === BACKLOG_STATUSES.inProgress ? `, held by ${item.claimedBy}` : ""} on ${where(target)}`);
}

async function main(): Promise<void> {
  const [command = "list", ...rest] = process.argv.slice(2);
  let target: SumilabuTarget;
  try {
    target = sumilabuTarget("board");
  } catch (error) {
    fail((error as Error).message);
  }

  switch (command) {
    case "list":
      await list(target);
      break;

    case "add": {
      const [title] = rest;
      if (title === undefined) usage();
      const kind = (flag("kind", rest) ?? BACKLOG_KINDS.feature) as BacklogKind;
      if (!(Object.values(BACKLOG_KINDS) as string[]).includes(kind)) usage();
      const by = (flag("by", rest) ?? "").trim();
      const clean = title.trim().replace(/\s+/g, " ");
      const item = landed(
        await addTicket(target, { key: keyFromTitle(clean), title: clean, detail: (flag("detail", rest) ?? "").trim(), kind, askedBy: by }, by || null),
        keyFromTitle(clean),
      );
      console.log(`added ${item.key} on ${where(target)}`);
      break;
    }

    case "claim":
      await move(target, rest, BACKLOG_STATUSES.inProgress, "in progress");
      break;

    case "release":
      await move(target, rest, BACKLOG_STATUSES.open, "released");
      break;

    case "drop":
      await move(target, rest, BACKLOG_STATUSES.dropped, "dropped");
      break;

    case "reopen":
      await move(target, rest, BACKLOG_STATUSES.open, "reopened");
      break;

    case "grade": {
      const [key] = rest;
      if (key === undefined) usage();
      const priority = wordOrNull<BacklogPriority>(flag("priority", rest), BACKLOG_PRIORITIES);
      const effort = wordOrNull<BacklogEffort>(flag("effort", rest), BACKLOG_EFFORTS);
      if (priority === undefined && effort === undefined) usage();
      const change: BoardChange = { ...(priority === undefined ? {} : { priority }), ...(effort === undefined ? {} : { effort }) };
      const item = landed(await patchTicket(target, (await rowFor(target, key)).id, change, null), key);
      console.log(`${item.key} graded on ${where(target)}`);
      break;
    }

    case "edit": {
      const [key] = rest;
      if (key === undefined) usage();
      const title = flag("title", rest);
      const detail = flag("detail", rest);
      if (title === undefined && detail === undefined) usage();
      const who = actorFrom(rest);
      const change: BoardChange = { ...(title === undefined ? {} : { title }), ...(detail === undefined ? {} : { detail }) };
      const item = landed(await patchTicket(target, (await rowFor(target, key)).id, change, who), key);
      console.log(`${item.key} edited on ${where(target)}`);
      break;
    }

    case "stamp":
      fail("pnpm task stamp is retired: stamps came across with the import, and Sumilabu writes one only when pnpm release:take:prod --done ships a row.");
      break;

    default:
      usage();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
