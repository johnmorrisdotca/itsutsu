import "server-only";

import { addTicket, listTickets, patchTicket, ticketById } from "@/lib/sumilabu/boardClient";
import type { BoardChange, BoardMoveTarget } from "@/lib/sumilabu/boardClient.types";
import { sumilabuTarget } from "@/lib/sumilabu/sumilabuProject";

import { changeProblems, draftProblems, moveProblems, normalizeDraft } from "./backlog";
import { BACKLOG_STATUSES } from "./backlog.constants";
import type { BacklogChange, BacklogDraft, BoardActionOutcome, BoardRead } from "./backlog.types";

/**
 * The half of the board that talks to where it is kept, which is Sumilabu.
 *
 * The page's reads and its two writes come through here; `pnpm task` and
 * `release:take` use `boardClient.ts` directly. The rules asked here are the
 * pure ones in `backlog.ts`, asked before a call so the operator hears a
 * refusal in the board's own words without a round trip, and Sumilabu asks its
 * own again — the service is the lock, this is the courtesy.
 *
 * Which project is `sumilabuTarget("board")`'s decision: the live one on the
 * deployed site, itsutsu-dev everywhere else.
 *
 * NOTHING HERE ANSWERS "EMPTY" FOR "UNREADABLE". A read that fails is a
 * `BoardRead` that says so, and the page draws an alert; a write that fails
 * is a sentence beside the control. The `BacklogItem` table this file used to
 * write is still in the schema and read by nothing.
 */

function why(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/** What arrived from a browser, as text: a Server Function's arguments are whatever was sent. */
function text(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** The whole board, most recently moved first, or why it could not be read. */
export async function readBoard(): Promise<BoardRead> {
  try {
    return { ok: true, items: await listTickets(sumilabuTarget("board")) };
  } catch (error) {
    console.error(`The board could not be read: ${why(error)}`);
    return { ok: false, problem: why(error) };
  }
}

/** Files a request, refusing anything the board's own rules call unusable before asking Sumilabu. */
export async function addItem(input: BacklogDraft, actor: string): Promise<BoardActionOutcome> {
  const draft: BacklogDraft = { title: text(input.title), detail: text(input.detail), kind: input.kind, askedBy: text(input.askedBy) };
  const problems = draftProblems(draft);
  if (problems.length > 0) return { ok: false, problem: problems[0]! };
  try {
    const added = await addTicket(sumilabuTarget("board"), normalizeDraft(draft), actor);
    return added.ok ? { ok: true } : { ok: false, problem: added.problems[0]! };
  } catch (error) {
    console.error(`A request could not be filed: ${why(error)}`);
    return { ok: false, problem: `The board could not be reached: ${why(error)}` };
  }
}

/**
 * A move, a revision of the title or detail, or a grade, as one PATCH.
 *
 * The row is read first, so a move its current status does not allow is
 * refused in `moveProblems`' words. Two things are refused outright: `done`,
 * which only the release tool writes, and a change to a row's kind or who
 * asked, which Sumilabu's board keeps as the row was filed.
 */
export async function changeItem(id: string, change: BacklogChange, actor: string): Promise<BoardActionOutcome> {
  if (text(id) === "") return { ok: false, problem: "Which row?" };
  const nothing = changeProblems(change);
  if (nothing.length > 0) return { ok: false, problem: nothing[0]! };
  if (change.status === BACKLOG_STATUSES.done) return { ok: false, problem: "Only the release tool may mark a row done." };
  if (change.kind !== undefined || change.askedBy !== undefined) {
    return { ok: false, problem: "The board revises a row's title and detail; its kind and who asked stay as it was filed." };
  }
  try {
    const target = sumilabuTarget("board");
    const item = await ticketById(target, id);
    if (item === null) return { ok: false, problem: "No such row on the board." };
    const refused = change.status === undefined ? [] : moveProblems(item.status, change.status);
    if (refused.length > 0) return { ok: false, problem: refused[0]! };

    const body: BoardChange = {
      ...(change.status === undefined ? {} : { status: change.status as BoardMoveTarget }),
      ...(change.title === undefined ? {} : { title: text(change.title) }),
      ...(change.detail === undefined ? {} : { detail: text(change.detail) }),
      ...(change.priority === undefined ? {} : { priority: change.priority }),
      ...(change.effort === undefined ? {} : { effort: change.effort }),
    };
    const changed = await patchTicket(target, id, body, actor);
    return changed.ok ? { ok: true } : { ok: false, problem: changed.problems[0]! };
  } catch (error) {
    console.error(`A row could not be changed: ${why(error)}`);
    return { ok: false, problem: `The board could not be reached: ${why(error)}` };
  }
}
