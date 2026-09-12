import type {
  CursorPosition,
  SortChoice,
  SortDirection,
  SortSpec,
} from "./paging.types";

/**
 * THE CURSOR, AND WHY THIS SITE PAGES BY ONE.
 *
 * An offset page is a promise about a list that has not changed. `skip: 20` is
 * "twenty rows from the top", so a row inserted above the page shifts every row
 * down one: the reader scrolls, asks for the next twenty, and gets one row they
 * have already seen. Delete a row above instead and they get a gap — one game
 * that was never shown and never will be. Neither reports anything. On a
 * correspondence site a game finishes every few hours and every one of them is
 * an insertion at the top of `/history`, so this is not a hypothetical.
 *
 * A cursor is a promise about a ROW instead: "the rows after this one, in this
 * order". Insertions and deletions elsewhere in the list cannot move a row
 * relative to itself, so the page after a cursor is the same page whatever
 * happened above it. That is the whole argument, and it is why live scrolling
 * uses cursors and could not be built honestly on offsets.
 *
 * THE TIEBREAKER IS NOT OPTIONAL. Ordering by a sort column alone leaves ties
 * in an order the database is free to change between two queries, so a cursor
 * naming only the column's value cannot say which of the tied rows it meant.
 * Every order here therefore ends with the primary key, and every cursor carries
 * it. `buildGameOrderBy` already did this for the offset pager and said why.
 *
 * WHICH COLUMN THAT IS COMES FROM THE SPEC — `Game` is keyed by `id`, `Player`
 * by `key` — so these functions take the spec rather than guessing. See
 * `SortSpec.tiebreak` for why a default would have been the dangerous kind of
 * convenience.
 *
 * THE SORT IS PART OF THE CURSOR, which is the part that is easy to leave out.
 * A cursor is a position in ONE ordering. Handed to a different ordering it
 * names a row whose neighbours are entirely different rows, and the page that
 * comes back is neither a continuation nor a fresh start — it silently repeats
 * some rows and skips others, which is exactly the fault cursors exist to
 * remove, arriving by another door. So the ordering is encoded into the cursor
 * and a mismatch is REFUSED rather than honoured: `decodeCursor` returns null,
 * and the caller starts the list again from the top, which is the one answer
 * that is never wrong.
 */

/** What is inside a cursor. Short keys because it travels in every address. */
type CursorPayload = {
  /** The sort column's word in the address. */
  s: string;
  /** The direction, as one letter. */
  d: "a" | "d";
  /** The last row's value in that column; null where the column was null. */
  v: string | number | null;
  /** The last row's id. */
  i: string;
};

const DIRECTIONS = { asc: "a", desc: "d" } as const;

function directionOf(letter: unknown): SortDirection | null {
  if (letter === "a") return "asc";
  if (letter === "d") return "desc";
  return null;
}

/**
 * base64url rather than base64, because a cursor's whole job is to survive
 * being a query parameter and `+`, `/` and `=` do not: `+` decodes as a space,
 * so a cursor containing one comes back corrupted with nothing reporting it.
 */
function toBase64Url(text: string): string {
  return Buffer.from(text, "utf8").toString("base64url");
}

function fromBase64Url(text: string): string | null {
  try {
    const decoded = Buffer.from(text, "base64url").toString("utf8");
    /*
     * base64url decoding never throws — it drops whatever it cannot read — so a
     * cursor somebody typed by hand comes back as mojibake rather than as an
     * error. Re-encoding and comparing is how that is caught: only a string
     * that survives the round trip was a cursor.
     */
    return toBase64Url(decoded) === text ? decoded : null;
  } catch {
    return null;
  }
}

export function encodeCursor(position: CursorPosition): string {
  const payload: CursorPayload = {
    s: position.sort.param,
    d: DIRECTIONS[position.sort.direction],
    v: position.value,
    i: position.id,
  };
  return toBase64Url(JSON.stringify(payload));
}

/**
 * A cursor read back, or NULL for anything that is not a cursor for THIS sort.
 *
 * Null rather than a refusal with a message, because the honest response to an
 * unreadable cursor is to show the first page: a cursor is not something a
 * reader typed, it is something this site handed out, so a bad one means a
 * stale link or a changed sort and the list starting over is exactly right. A
 * 400 would put an error on screen for a reader who did nothing wrong.
 *
 * That is the one place this convention answers a bad parameter by carrying on,
 * and it is deliberate: an unknown SORT COLUMN is refused by name, because that
 * is a request nobody can honour, while an unusable cursor has an obvious and
 * correct fallback.
 */
export function decodeCursor<Field extends string>(
  cursor: string,
  /** The sort the request is actually asking for. A cursor for another is refused. */
  sort: { param: string; direction: SortDirection } | SortChoice<Field>,
): CursorPosition | null {
  const asked =
    "column" in sort ? { param: sort.column.param, direction: sort.direction } : sort;
  const text = fromBase64Url(cursor);
  if (text === null) return null;

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof parsed !== "object" || parsed === null) return null;

  const payload = parsed as Partial<CursorPayload>;
  const direction = directionOf(payload.d);
  if (direction === null) return null;
  if (typeof payload.s !== "string" || typeof payload.i !== "string") return null;
  if (payload.i === "") return null;
  const value = payload.v;
  if (value !== null && typeof value !== "string" && typeof value !== "number") return null;

  // A position in another ordering is not a position in this one. See above.
  if (payload.s !== asked.param || direction !== asked.direction) return null;

  return { value, id: payload.i, sort: { param: payload.s, direction } };
}

/**
 * A comparison, as Prisma spells one. Narrow on purpose: this module builds
 * keyset conditions and nothing else, so it does not want Prisma's whole
 * `WhereInput` in its signature.
 */
type Comparison = Record<string, unknown>;

/**
 * THE ROWS STRICTLY AFTER A CURSOR, IN THE ORDER THE SORT PUT THEM.
 *
 * The plain case reads the way the maths does. Ordering by `(field, id)`
 * ascending, the rows after `(v, i)` are those with a larger field, plus those
 * with the same field and a larger id:
 *
 *     field > v  OR  (field = v AND id > i)
 *
 * Descending flips the field's comparison and NOT the id's, because the id is
 * always ascending — it is a tiebreaker, not a second sort, and flipping it
 * would make the two directions disagree about which of two tied rows comes
 * first. `buildGameOrderBy` writes `{ id: "asc" }` for the same reason.
 *
 * NULLS ARE THE HARD HALF, and they are why `nullable` is declared rather than
 * guessed. A nullable column orders nulls LAST in both directions, so the list
 * is really two runs: the rows with a value, in order, then the nulls by id. A
 * cursor can be in either run, and the answer differs:
 *
 *   - Sitting on a value: everything after it in the value run, PLUS the whole
 *     null run — the nulls all come later, whichever direction the values went.
 *   - Sitting on a null: only nulls with a larger id. Nothing with a value can
 *     be after a null, because the nulls are last.
 *
 * Get that wrong in the obvious direction and the nulls are never reached at
 * all: every game recorded without a clock simply stops existing past the first
 * page of a sort by duration, with no error and a page that looks complete.
 * That is the shape of bug this file is arranged to make impossible to write by
 * accident, so the two runs are spelled out separately rather than folded
 * together cleverly.
 */
export function keysetWhere<Field extends string>(
  spec: SortSpec<Field>,
  choice: SortChoice<Field>,
  after: CursorPosition,
): Comparison {
  const { column, direction } = choice;
  const { field } = column;
  const beyond = direction === "asc" ? "gt" : "lt";
  const laterRow = { [spec.tiebreak]: { gt: after.id } };

  if (column.nullable === true && after.value === null) {
    // In the null run, which is last: only a later null can follow.
    return { AND: [{ [field]: null }, laterRow] };
  }

  const sameValueLaterRow = { AND: [{ [field]: after.value }, laterRow] };
  const furtherAlong = { [field]: { [beyond]: after.value } };

  if (column.nullable === true) {
    // On a value, so every null is still to come as well as the rest of the run.
    return { OR: [furtherAlong, sameValueLaterRow, { [field]: null }] };
  }

  return { OR: [furtherAlong, sameValueLaterRow] };
}

/**
 * How the read must be ordered for a cursor over this column to mean anything.
 *
 * Returned from here rather than written at each call site, because the order
 * and the keyset condition are two halves of one claim: a cursor built against
 * `(field, id)` handed to a read ordered some other way skips and repeats, and
 * the two would drift the first time somebody added a third tiebreaker in one
 * place. Nulls are pinned LAST in both directions to match `keysetWhere`.
 */
export function keysetOrderBy<Field extends string>(
  spec: SortSpec<Field>,
  choice: SortChoice<Field>,
): Record<string, unknown>[] {
  const { column, direction } = choice;
  const value =
    column.nullable === true
      ? { [column.field]: { sort: direction, nulls: "last" } }
      : { [column.field]: direction };
  return [value, { [spec.tiebreak]: "asc" }];
}

/**
 * The cursor that continues a page, or null when that page was the last.
 *
 * A page is read one row longer than the reader asked for — see `takeFor` — so
 * "was that the last page" is answered by whether the extra row arrived rather
 * than by a count. That matters: a count is a second query, and a count taken
 * before the read can already be stale by the time the rows come back, so a
 * page could be declared final while a row sat just past it.
 */
export function nextCursorFrom<Row extends object, Field extends string>(
  spec: SortSpec<Field>,
  choice: SortChoice<Field>,
  rows: readonly Row[],
  limit: number,
): { rows: Row[]; next: string | null } {
  if (rows.length <= limit) return { rows: [...rows], next: null };

  const page = rows.slice(0, limit);
  const last = page[page.length - 1] as Record<string, unknown>;
  const key = last[spec.tiebreak];
  /*
   * A row whose primary key is missing or is not a string cannot be pointed at,
   * so the page says it is the last rather than handing out a cursor naming
   * nothing. That is a programming mistake in a `select` — a projection that
   * left the key out — and the safe failure is a list that stops early, which is
   * visible, rather than a cursor that pages from `undefined`, which is not.
   */
  if (typeof key !== "string" || key === "") return { rows: page, next: null };

  return {
    rows: page,
    next: encodeCursor({
      value: cursorValue(last[choice.column.field]),
      id: key,
      sort: { param: choice.column.param, direction: choice.direction },
    }),
  };
}

/**
 * A row's sort value as a cursor can carry it.
 *
 * A Date becomes its ISO string, because a cursor is JSON and `JSON.parse`
 * hands a date string back as a string — so encoding one and decoding it would
 * produce two different types for the same position, and the comparison against
 * a `DateTime` column would be made with whichever one the code path happened
 * to hold. Converting here means only one type ever exists in a cursor.
 *
 * Anything else that is not a string, a number or null is refused outright as
 * null rather than coerced: a cursor over a value this cannot represent would
 * page wrongly, and starting the list again is the safe answer.
 */
function cursorValue(raw: unknown): string | number | null {
  if (raw instanceof Date) return raw.toISOString();
  if (typeof raw === "string" || typeof raw === "number") return raw;
  return null;
}

/**
 * How many rows to actually read: one more than asked for, so the extra one
 * answers "is there a next page" without a second query.
 */
export function takeFor(limit: number): number {
  return limit + 1;
}
