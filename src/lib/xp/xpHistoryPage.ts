import "server-only";

import {
  isRefusal,
  parseCursor,
  parseLimit,
  parseSort,
} from "@/lib/api/paging";
import {
  decodeCursor,
  keysetOrderBy,
  keysetWhere,
  nextCursorFrom,
  takeFor,
} from "@/lib/api/paging.cursor";
import type { PagedEnvelope, PagingRefusal } from "@/lib/api/paging.types";
import type { RuleVariant } from "@/lib/gomoku/gomoku.types";
import { prisma } from "@/lib/prisma";

import { needsMatch, xpLedgerRowFor } from "./xpHistory";
import { XP_LEDGER_PAGE, XP_LEDGER_PAGE_MAX, XP_LEDGER_SORT } from "./xpHistory.sort";
import type { XpLedgerRow, XpLedgerSkips } from "./xpHistory.types";

/**
 * ONE PAGE OF A MEMBER'S OWN LEDGER.
 *
 * The only module here that touches Prisma. The vocabulary and the subject
 * reading are in `xpHistory.ts` and `xpHistory.types.ts`, which import nothing
 * of the sort — UmaKuma's two files, split for the reason its own comment gives:
 * they were one until the table became a client component and dragged Prisma
 * into the browser bundle through a `server-only` import, which typecheck and
 * every unit test passed and only running the page caught.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * IT PAGES BY CURSOR, THROUGH THE SITE'S ONE CONVENTION
 * ─────────────────────────────────────────────────────────────────────────
 *
 * `src/lib/api/paging.ts` — `sort`, `cursor`, `limit`, and the envelope
 * `{ items, next, total? }`. Not a second idea about what a page is: UmaKuma's
 * own history pages by `skip`/`take`, and an offset page is a promise about a
 * list that has not changed. A ledger is the one list on this site where that
 * promise is certainly broken, because every row is an insertion at the TOP —
 * earn anything while page one is on screen and the next twenty rows repeat a
 * row already read, silently.
 *
 * `total` is deliberately absent, which the convention allows and asks for: a
 * count over a member's events is a second query on every page turn, and the
 * heading above the ledger already reports the two numbers that matter — the
 * total XP and the level — from the `Member` row `/me` has in hand. A list with
 * no total shows no total; it does not show a guess.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * TWO QUERIES, AND WHY THE SECOND ONE EARNS ITS PLACE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The first is the page of events, ordered by `(createdAt, id)`, which
 * `XpEvent_memberId_createdAt_idx` backs — the index the design put there for
 * exactly this read.
 *
 * The second runs only when the page actually holds game-keyed awards, and it
 * resolves at most `limit` game ids to their variants by primary key. It is
 * there because **the address of a match cannot be built without it**:
 * `matchPath` is `/games/<slug>/match/<id>` and the subject carries the id
 * alone, so with no variant there is no link, and a ledger whose game rows lead
 * nowhere is the dead end this site has a build gate about.
 *
 * That is the line, and it is worth stating because it decides the next case
 * too: **a query is spent where an address cannot be built without one, and
 * nowhere else.** A buddy's row needs none — `/players/<id>` is the subject
 * itself — so a buddy's NAME is not fetched, and the row says "the person you
 * added" and links. A computer player's name is free, from `BOT_MEMBERS`. One
 * bounded extra read, per page view, and no per-row query anywhere.
 */

export type XpLedgerPage = PagedEnvelope<XpLedgerRow> & {
  /** What this page could not explain. See `XpLedgerSkips`. */
  skipped: XpLedgerSkips;
};

/**
 * The games behind a page's match-keyed awards, as `{ id: variant }`.
 *
 * By primary key and bounded by the page, so it is one indexed read of at most
 * `XP_LEDGER_PAGE_MAX` rows however long the ledger is. A game that has since
 * been swept — finished games are kept for a member's chosen number of days —
 * simply does not come back, and its row keeps `variant: null` and stays
 * unlinked rather than pointing at a match that is gone.
 */
async function variantsFor(gameIds: readonly string[]): Promise<Map<string, RuleVariant>> {
  if (gameIds.length === 0) return new Map();
  const rows = await prisma.game.findMany({
    where: { id: { in: [...gameIds] } },
    select: { id: true, variant: true },
  });
  return new Map(rows.map((row) => [row.id, row.variant as RuleVariant]));
}

/**
 * One page of what a member has earned, newest first.
 *
 * A refusal — never a default order — for a sort this list does not have, which
 * is the convention's rule and the reason it is returned rather than thrown: the
 * caller decides whether that is a 400 or a line on the page. An unreadable
 * CURSOR is not refused; it starts the list again, because a cursor is something
 * this site handed out and a stale one means a changed sort rather than a reader
 * who did anything wrong.
 */
export async function xpLedgerPage(input: {
  memberId: string;
  params: URLSearchParams;
}): Promise<XpLedgerPage | PagingRefusal> {
  const sort = parseSort(XP_LEDGER_SORT, input.params);
  if (isRefusal(sort)) return sort;

  const limit = parseLimit(input.params, {
    fallback: XP_LEDGER_PAGE,
    max: XP_LEDGER_PAGE_MAX,
  });
  const asked = parseCursor(input.params);
  const after = asked === null ? null : decodeCursor(asked, sort);

  const read = await prisma.xpEvent.findMany({
    where: {
      memberId: input.memberId,
      ...(after === null ? {} : keysetWhere(XP_LEDGER_SORT, sort, after)),
    },
    orderBy: keysetOrderBy(XP_LEDGER_SORT, sort),
    take: takeFor(limit),
    /*
     * `id` is in the projection because the cursor is built from it — see
     * `tiebreak` above. `nextCursorFrom` answers "that was the last page" rather
     * than handing out a cursor naming `undefined` when a `select` leaves the
     * key out, so forgetting it here would stop the ledger at one page with
     * nothing reporting why.
     */
    select: { id: true, type: true, points: true, subject: true, dayKey: true, createdAt: true },
  });

  const { rows, next } = nextCursorFrom(XP_LEDGER_SORT, sort, read, limit);

  /*
   * The unreadable rows are dropped HERE rather than filtered out of the read,
   * and that ordering is deliberate: the cursor is built from the page the
   * database returned, so dropping a row afterwards shortens the page by one and
   * cannot open a gap. Filtering before would have made `next` point past a row
   * nothing ever showed.
   */
  const items: XpLedgerRow[] = [];
  let unknownType = 0;
  for (const event of rows) {
    const row = xpLedgerRowFor(event);
    if (row === null) unknownType += 1;
    else items.push(row);
  }

  const variants = await variantsFor(
    items.flatMap((row) => (needsMatch(row.about) ? [row.about.gameId] : [])),
  );

  return {
    items: items.map((row) =>
      needsMatch(row.about)
        ? { ...row, about: { ...row.about, variant: variants.get(row.about.gameId) ?? null } }
        : row,
    ),
    next,
    skipped: { unknownType },
  };
}
