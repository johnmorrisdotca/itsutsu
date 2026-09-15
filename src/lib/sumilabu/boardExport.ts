import { BACKLOG_EFFORTS, BACKLOG_KINDS, BACKLOG_PRIORITIES, BACKLOG_STATUSES, LEGACY_STATUSES } from "../backlog/backlog.constants.ts";
import type { BacklogEffort, BacklogKind, BacklogPriority, BacklogStatus } from "../backlog/backlog.types.ts";

import { IMPORT_BATCH_SIZE, SUMILABU_KEY_PATTERN, SUMILABU_TICKET_LIMITS as CAP } from "./boardExport.constants.ts";
import type {
  ExportPlan,
  ReshapedField,
  RowFinding,
  StoredBacklogRow,
  SumilabuImportRow,
  SumilabuTicketView,
  TicketDiff,
} from "./boardExport.types.ts";

/**
 * Itsutsu's board in the shape Sumilabu's import takes, and an account of what
 * that took.
 *
 * Pure. `scripts/board-export.ts` reads the rows and talks to the service;
 * everything decided about a row is decided here, where a test can see it.
 *
 * NOTHING IS GUESSED. A value the contract has no word for makes its row
 * unmappable, and an unmappable row stops `--run`. A value past a cap is
 * brought inside it, with a line in the detail naming the archive that keeps
 * the whole text. A shape the contract would not write — a claim on a row that
 * is not in progress — goes across as it stands and is said out loud, because
 * correcting it would be a decision about somebody's row made by a migration.
 */

/** A stored value in one of the board's vocabularies: the value, null for no value, undefined for a word it does not have. */
function wordIn<T extends string>(values: Record<string, T>, stored: string | null): T | null | undefined {
  if (stored === null) return null;
  return (Object.values(values) as string[]).includes(stored) ? (stored as T) : undefined;
}

/** The contract's status for a stored one: today's words, the three legacy words, or null for anything else. */
export function statusOf(stored: string): BacklogStatus | null {
  return wordIn<BacklogStatus>(BACKLOG_STATUSES, stored) ?? LEGACY_STATUSES[stored] ?? null;
}

export function keyProblem(key: string): string | null {
  if (key.length > CAP.key) return `key is ${key.length} characters; Sumilabu takes at most ${CAP.key}`;
  if (!SUMILABU_KEY_PATTERN.test(key)) return `key "${key}" is not a kebab slug Sumilabu accepts`;
  return null;
}

/** The line a shortened row's detail ends with, naming the file that holds what was cut. */
export function archiveNote(archiveName: string): string {
  return `\n\n[Shortened to fit Sumilabu's board. The full text is archived in ${archiveName}.]`;
}

function cut(text: string, room: number): string {
  return text.slice(0, Math.max(0, room)).trimEnd();
}

/** Title, detail and asker inside Sumilabu's caps, and which of them moved. */
export function reshape(row: StoredBacklogRow, archiveName: string): {
  title: string;
  detail: string | null;
  askedBy: string | null;
  fields: ReshapedField[];
} {
  const fields: ReshapedField[] = [];
  let title = row.title.trim();
  if (title.length > CAP.title) {
    title = `${cut(title, CAP.title - 1)}…`;
    fields.push({ field: "title", before: row.title.length, after: title.length });
  } else if (title.length < CAP.titleMin) {
    /* Sumilabu refuses a title under the minimum by name. Lengthened with the
       row's own key, which is how it is cited, so nothing is lost or invented. */
    title = `${title} (backlog ${row.key})`.trim();
    fields.push({ field: "title", before: row.title.length, after: title.length });
  }

  let askedBy = row.askedBy.trim();
  if (askedBy.length > CAP.askedBy) {
    askedBy = cut(askedBy, CAP.askedBy);
    fields.push({ field: "askedBy", before: row.askedBy.length, after: askedBy.length });
  }

  let detail = row.detail;
  const shortened = fields.some((field) => field.after < field.before);
  if (detail.length > CAP.detail || shortened) {
    const note = archiveNote(archiveName);
    const room = CAP.detail - note.length;
    const kept = detail.length > room ? cut(detail, room) : detail;
    const written = kept ? `${kept}${note}` : note.trimStart();
    if (detail.length > room) fields.push({ field: "detail", before: detail.length, after: written.length });
    detail = written;
  }
  return { title, detail: detail || null, askedBy: askedBy || null, fields };
}

function findings(row: StoredBacklogRow, says: readonly (string | false | null)[]): RowFinding[] {
  return says.filter((line): line is string => typeof line === "string").map((line) => ({ id: row.id, key: row.key, says: line }));
}

function count(into: Record<string, number>, word: string): void {
  into[word] = (into[word] ?? 0) + 1;
}

export function planExport(stored: readonly StoredBacklogRow[], archiveName: string): ExportPlan {
  const plan: ExportPlan = {
    rows: [],
    storedStatuses: {},
    statuses: {},
    reshaped: [],
    unmappable: [],
    keyProblems: [],
    notes: [],
    doneWithoutRelease: 0,
    addedByNotCarried: 0,
  };
  for (const row of stored) {
    count(plan.storedStatuses, row.status);
    if (row.addedBy) plan.addedByNotCarried += 1;
    const status = statusOf(row.status);
    const kind = wordIn<BacklogKind>(BACKLOG_KINDS, row.kind);
    const priority = wordIn<BacklogPriority>(BACKLOG_PRIORITIES, row.priority);
    const effort = wordIn<BacklogEffort>(BACKLOG_EFFORTS, row.effort);
    const unmappable = findings(row, [
      status === null && `status "${row.status}" has no word in the contract`,
      (kind === undefined || kind === null) && `kind "${row.kind}" has no word in the contract`,
      priority === undefined && `priority "${row.priority}" has no word in the contract`,
      effort === undefined && `effort "${row.effort}" has no word in the contract`,
      row.id.length > CAP.id && `id is ${row.id.length} characters; the import takes at most ${CAP.id}`,
      (row.claimedBy ?? "").length > CAP.claimedBy && `claimedBy is past Sumilabu's ${CAP.claimedBy} characters`,
      (row.releasedIn ?? "").length > CAP.releasedIn && `releasedIn is past Sumilabu's ${CAP.releasedIn} characters`,
    ]);
    if (unmappable.length > 0 || status === null || !kind || priority === undefined || effort === undefined) {
      plan.unmappable.push(...unmappable);
      continue;
    }

    plan.keyProblems.push(...findings(row, [keyProblem(row.key)]));
    plan.notes.push(
      ...findings(row, [
        status === BACKLOG_STATUSES.inProgress && !row.claimedBy && "in progress with nobody holding it",
        status !== BACKLOG_STATUSES.inProgress && Boolean(row.claimedBy) && `${status} but still claimed by ${row.claimedBy}`,
        status !== BACKLOG_STATUSES.done && Boolean(row.releasedIn) && `${status} but stamped as released in ${row.releasedIn}`,
        row.status !== status && `stored as legacy "${row.status}", sent as ${status}`,
      ]),
    );
    if (status === BACKLOG_STATUSES.done && !row.releasedIn) plan.doneWithoutRelease += 1;

    const fitted = reshape(row, archiveName);
    if (fitted.fields.length > 0) plan.reshaped.push({ id: row.id, key: row.key, fields: fitted.fields });
    count(plan.statuses, status);
    plan.rows.push({
      id: row.id,
      key: row.key,
      title: fitted.title,
      detail: fitted.detail,
      area: null,
      kind,
      status,
      priority,
      effort,
      askedBy: fitted.askedBy,
      claimedBy: row.claimedBy,
      claimedAt: row.claimedAt?.toISOString() ?? null,
      releasedIn: row.releasedIn,
      releasedEntry: null,
      releasedAt: row.releasedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
      movedAt: row.movedAt.toISOString(),
    });
  }
  return plan;
}

/** A suffix unique to one rehearsal, short enough to fit on an id and a key. */
export function rehearsalSuffix(now: Date): string {
  return `r${now.getTime().toString(36)}`;
}

/**
 * Every row under a new id and key, for a rehearsal.
 *
 * Sumilabu refuses an import whose id already belongs to another project. A
 * rehearsal that put Itsutsu's real ids into itsutsu-dev would therefore block
 * the real import into itsutsu, so a rehearsal never sends one.
 */
export function freshen(rows: readonly SumilabuImportRow[], suffix: string): SumilabuImportRow[] {
  return rows.map((row) => ({
    ...row,
    id: `${row.id}-${suffix}`,
    ...(row.key === undefined ? {} : { key: `${row.key.slice(0, CAP.key - suffix.length - 1).replace(/-+$/, "")}-${suffix}` }),
  }));
}

/** The same rows with no key on any of them, for a target that does not take keys yet. */
export function withoutKeys(rows: readonly SumilabuImportRow[]): SumilabuImportRow[] {
  return rows.map((row) => {
    const copy = { ...row };
    delete copy.key;
    return copy;
  });
}

const COMPARED = [
  "title", "detail", "kind", "status", "priority", "effort", "askedBy",
  "claimedBy", "claimedAt", "releasedIn", "releasedAt", "createdAt", "movedAt",
] as const satisfies readonly (keyof SumilabuImportRow & keyof SumilabuTicketView)[];

/** What the target already holds against what would be sent, by id. Keys are compared only when they are sent. */
export function diffTickets(rows: readonly SumilabuImportRow[], target: readonly SumilabuTicketView[], withKeys: boolean): TicketDiff {
  const held = new Map(target.map((ticket) => [ticket.id, ticket]));
  const ours = new Set(rows.map((row) => row.id));
  const diff: TicketDiff = { toAdd: [], same: [], changed: [], onlyOnTarget: target.filter((ticket) => !ours.has(ticket.id)).map((ticket) => ticket.id) };
  for (const row of rows) {
    const ticket = held.get(row.id);
    if (!ticket) {
      diff.toAdd.push(row.id);
      continue;
    }
    const fields: string[] = COMPARED.filter((field) => (row[field] ?? null) !== (ticket[field] ?? null));
    if (withKeys && (row.key ?? null) !== (ticket.key ?? null)) fields.push("key");
    if (fields.length > 0) diff.changed.push({ id: row.id, fields });
    else diff.same.push(row.id);
  }
  return diff;
}

export function inBatches<T>(rows: readonly T[], size: number = IMPORT_BATCH_SIZE): T[][] {
  const batches: T[][] = [];
  for (let at = 0; at < rows.length; at += size) batches.push(rows.slice(at, at + size));
  return batches;
}
