import type {
  Cursor,
  PagingRefusal,
  SortChoice,
  SortColumn,
  SortDirection,
  SortSpec,
} from "./paging.types";

/**
 * SORTING, PAGING AND LIVE SCROLLING — ONE CONVENTION, READ IN ONE PLACE.
 *
 * Every list on this site had grown its own: /history paged by offset with a
 * `Pager`, /players read whole lists, /play capped its buckets at fixed sizes
 * and printed "14 · showing 5", the board was whole-list. A sortable, pageable
 * table built five times is five tables, and five parsers is five ideas about
 * what `limit=9999` means. So the parameters, their bounds and the envelope are
 * decided here and nowhere else.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * THE PARAMETERS
 * ─────────────────────────────────────────────────────────────────────────
 *
 *   sort=<column>[:asc|desc]   which column, and which way round
 *   order=asc|desc             the older spelling of the direction
 *   cursor=<opaque>            where the previous page ended
 *   limit=<n>                  how many rows, capped per list
 *
 * Filters are not here. `player`, `outcome`, `pool`, `rated` and the game in
 * the path already exist and already work; sorting and paging are added BESIDE
 * them, never in place of them, so every link a count hands out keeps meaning
 * what it meant. This module never looks at a filter.
 *
 * TWO SPELLINGS OF THE DIRECTION, AND WHY THAT IS NOT SLOPPINESS. `sort=played`
 * with `order=asc` is what this site's addresses have said since /history
 * existed, and those addresses are bookmarked and linked. A convention that
 * only understood `sort=played:asc` would read such a link, silently ignore the
 * direction and render the other way round with nothing on the page saying so —
 * the exact failure of answering a question you cannot answer. So `:asc` is
 * canonical and is what every control here writes, and `order=` is still read
 * for the addresses already in the wild. When both are present the one attached
 * to the column wins, because it is the more specific statement and because it
 * is the one a heading just wrote.
 *
 * AN UNKNOWN COLUMN IS REFUSED BY NAME. `?sort=passwordHash` is not a sort this
 * site has, and answering it with the default order would tell the caller their
 * sort worked. The refusal names what was asked and lists what is accepted, so
 * a 400 is something you can act on rather than something you have to guess at.
 * An unreadable CURSOR is the one parameter answered by carrying on — see
 * `decodeCursor` for why those two cases differ.
 */

/** Nobody's list may be asked for more rows than this, whatever it declares. */
export const PAGE_LIMIT_CEILING = 200;

/**
 * How many rows a list hands back when nobody said.
 *
 * Twenty is a screenful and a bit on every table here, which is what a first
 * page wants to be: enough that scrolling has something to reveal, few enough
 * that it is not most of the list. Production holds 117 finished games today, so
 * this is six pages of the biggest list on the site.
 */
export const PAGE_LIMIT_DEFAULT = 20;

/** A list's own bounds, where they are not the shared ones. */
export type LimitBounds = { readonly fallback?: number; readonly max?: number };

function refusal(message: string): PagingRefusal {
  return { error: message };
}

export function isRefusal(value: unknown): value is PagingRefusal {
  return typeof value === "object" && value !== null && "error" in value;
}

/** The words a spec accepts, for a message and for a control's options. */
export function sortWords<Field extends string>(spec: SortSpec<Field>): string[] {
  return spec.columns.map((column) => column.param);
}

function columnFor<Field extends string>(
  spec: SortSpec<Field>,
  param: string,
): SortColumn<Field> | undefined {
  return spec.columns.find((column) => column.param === param);
}

/**
 * The column a spec falls back to.
 *
 * Thrown rather than defaulted if the spec names a column it does not have,
 * because that is a programming mistake in a declaration and not something a
 * request did — and a list quietly ordering by whatever happened to be first
 * would be a wrong order that never reports itself. `pagingSpecProblems` is the
 * gate that catches it before it can be thrown.
 */
function fallbackChoice<Field extends string>(spec: SortSpec<Field>): SortChoice<Field> {
  const column = columnFor(spec, spec.fallback.param);
  if (column === undefined) {
    throw new Error(
      `${spec.of} falls back to the sort "${spec.fallback.param}", which it does not declare.`,
    );
  }
  return { column, direction: spec.fallback.direction, asked: false };
}

function directionWord(value: string | null): SortDirection | null {
  if (value === "asc" || value === "desc") return value;
  return null;
}

/**
 * The sort a request asked for, checked against what this list has.
 *
 * Returns the spec's fallback when nothing was asked, the asked-for column when
 * it exists, and a refusal naming the column when it does not.
 */
export function parseSort<Field extends string>(
  spec: SortSpec<Field>,
  params: URLSearchParams,
): SortChoice<Field> | PagingRefusal {
  const raw = params.get("sort");
  if (raw === null || raw.trim() === "") return fallbackChoice(spec);

  const [word, attached] = raw.trim().split(":", 2);
  const column = columnFor(spec, word);
  if (column === undefined) {
    return refusal(
      `"${word}" is not a sort ${spec.of} has. Try one of: ${sortWords(spec).join(", ")}.`,
    );
  }

  /*
   * An unreadable direction is refused rather than ignored, and the two live at
   * the same level of suspicion as an unknown column: `?sort=played:sideways` is
   * a caller who believes they asked for something. Answering with the column's
   * own first press would page correctly and be the wrong order.
   */
  if (attached !== undefined) {
    const direction = directionWord(attached);
    if (direction === null) {
      return refusal(`"${attached}" is not a direction. Use "asc" or "desc".`);
    }
    return { column, direction, asked: true };
  }

  const older = params.get("order");
  if (older !== null && older.trim() !== "") {
    const direction = directionWord(older.trim());
    if (direction === null) {
      return refusal(`"${older.trim()}" is not a direction. Use "asc" or "desc".`);
    }
    return { column, direction, asked: true };
  }

  return { column, direction: column.firstPress, asked: true };
}

/**
 * How many rows, bounded twice: by the list's own maximum and by the ceiling
 * above it.
 *
 * A limit outside the bounds is CLAMPED rather than refused, which is the
 * opposite choice to an unknown sort column and deliberate. `limit=1000` is a
 * caller asking for more than they may have, and two hundred rows is a truthful
 * answer to it — the envelope's `next` says there is more, so nothing has been
 * hidden. An unknown column has no such honest answer. A limit that is not a
 * number at all is the fallback, because `limit=abc` states no quantity.
 */
export function parseLimit(params: URLSearchParams, bounds: LimitBounds = {}): number {
  const max = Math.min(bounds.max ?? PAGE_LIMIT_CEILING, PAGE_LIMIT_CEILING);
  const fallback = Math.min(bounds.fallback ?? PAGE_LIMIT_DEFAULT, max);

  const raw = params.get("limit");
  if (raw === null || raw.trim() === "") return fallback;
  const asked = Number(raw);
  if (!Number.isInteger(asked) || asked < 1) return fallback;
  return Math.min(asked, max);
}

/** The cursor a request carried, or null. Whether it is USABLE is `decodeCursor`'s answer. */
export function parseCursor(params: URLSearchParams): Cursor | null {
  const raw = params.get("cursor");
  if (raw === null || raw.trim() === "") return null;
  return raw.trim();
}

/**
 * The address a heading's press leads to.
 *
 * A heading is a LINK and the sort is in the query, so a sorted view has an
 * address: it can be linked, bookmarked, opened in a new tab and read by
 * somebody with no JavaScript. That is the same reasoning `HistoryFilters`
 * already keeps, and it is why sorting could not be component state.
 *
 * Three things it must get right, each of which has been got wrong on a table
 * somewhere:
 *
 *   - **Every other parameter survives.** A press that dropped the filters
 *     would sort a different set of rows than the one on screen.
 *   - **The cursor does not.** A cursor is a position in the OLD order and means
 *     nothing in the new one; carrying it over would open the middle of a list
 *     and call it the top. `page` goes for the same reason.
 *   - **A second press flips.** Pressing the column you are already sorted by
 *     means "the other way round", not "again".
 */
export function sortHref<Field extends string>(
  at: string,
  params: URLSearchParams,
  current: SortChoice<Field>,
  column: SortColumn<Field>,
): string {
  const next = new URLSearchParams(params.toString());
  const direction =
    current.column.param === column.param && current.asked
      ? flip(current.direction)
      : column.firstPress;

  next.set("sort", `${column.param}:${direction}`);
  next.delete("order");
  next.delete("cursor");
  next.delete("page");

  const query = next.toString();
  return query === "" ? at : `${at}?${query}`;
}

export function flip(direction: SortDirection): SortDirection {
  return direction === "asc" ? "desc" : "asc";
}

/**
 * What `aria-sort` must say on the heading a table is sorted by.
 *
 * Here rather than in the component because it is the one accessible fact a
 * sortable table owes a reader who cannot see the arrow, and a table that spells
 * it "descending" while another spells it "desc" tells a screen reader nothing
 * on one of them.
 */
export function ariaSort<Field extends string>(
  current: SortChoice<Field>,
  column: SortColumn<Field>,
): "ascending" | "descending" | "none" {
  if (current.column.param !== column.param) return "none";
  return current.direction === "asc" ? "ascending" : "descending";
}

/**
 * What is wrong with a sort declaration, as a list of sentences.
 *
 * A spec is data, and data goes wrong quietly: a fallback naming a column that
 * was renamed, two columns claiming the same word in the address, a column with
 * no index and no reason given. None of that fails a build on its own, and all
 * of it produces a list that orders by something nobody chose. So it is checked,
 * and `paging.coverage.test.ts` runs this over every spec on the site.
 *
 * The index rule is the one worth having. TypeScript already forces a column to
 * carry either an index name or a reason, so what is left for this to catch is a
 * reason that says nothing — and a blank string satisfies a type.
 */
export function pagingSpecProblems<Field extends string>(spec: SortSpec<Field>): string[] {
  const problems: string[] = [];
  if (spec.columns.length === 0) problems.push(`${spec.of} declares no sortable columns.`);

  const seen = new Set<string>();
  for (const column of spec.columns) {
    if (seen.has(column.param)) {
      problems.push(`${spec.of} declares "${column.param}" twice.`);
    }
    seen.add(column.param);

    if (column.param.trim() === "") problems.push(`${spec.of} has a column with no word for it.`);
    if (column.label.trim() === "") {
      problems.push(`${spec.of}'s "${column.param}" has no heading.`);
    }
    if (/[A-Z]/.test(column.param)) {
      problems.push(
        `${spec.of}'s "${column.param}" is camelCase; an address says plain words.`,
      );
    }
    if (column.index === null && (column.unindexedBecause ?? "").trim().length < 20) {
      problems.push(
        `${spec.of}'s "${column.param}" has no index and no reason worth reading for why not.`,
      );
    }
  }

  if (columnFor(spec, spec.fallback.param) === undefined) {
    problems.push(
      `${spec.of} falls back to "${spec.fallback.param}", which it does not declare.`,
    );
  }
  return problems;
}
