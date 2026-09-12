import { Paired } from "@/components/i18n/Paired";
import Link from "next/link";
import { cookies } from "next/headers";

import { PANEL_CLASS } from "@/components/ui/ui.constants";
import { currentEmail, currentMemberId } from "@/lib/auth/currentSession";
import { keepFinishedDaysFor } from "@/lib/auth/members";
import { MY_FINISHED_PAGE, MY_FINISHED_PAGE_OPEN } from "@/lib/history/myFinished.sort";
import {
  MY_GAME_GROUPS,
  fetchMyGames,
  pagedGroup,
  shownGroup,
  type MyGame,
  type MyGameGroup,
  type ShownGroup,
} from "@/lib/history/myGames";
import { seatClaims } from "@/lib/history/seatCookie";
import { playerPath } from "@/lib/rating/playerKey";
import { MY_GAMES_COPY } from "./mine.constants";
import { Row } from "./MyGameRow";

/**
 * How many of each group the lobby prints BY DEFAULT — and every one of them
 * can now be opened in full.
 *
 * The games waiting on you are the reason to open this page, so they are all
 * shown however many there are. The rest are a reminder rather than a queue,
 * and a reminder that runs to fifty rows is a page nobody reaches the bottom
 * of — twenty games at once is the most anybody is meant to have, and the
 * groups that grow without anyone deciding to are held to a handful.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * "14 · SHOWING 5" IS A PROMISE, AND THE NINE ARE NOW REACHABLE
 * ─────────────────────────────────────────────────────────────────────────
 *
 * The cap was a display cap with nothing behind it: the heading said fourteen
 * and there was no way to see nine of them. The comment under the finished
 * group already said as much — "the other groups have no such page… so there is
 * nothing honest to link to if one of them ever grows past its cap" — which was
 * a true report of a gap rather than a reason for it.
 *
 * A `?all=<group>` on the address opens one group where it stands.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * SIX OF THESE GROUPS OPEN IN PLACE; THE SEVENTH PAGES
 * ─────────────────────────────────────────────────────────────────────────
 *
 * For the six that are a DEBT, opening in place is truthful rather than the
 * client-side slice this convention forbids elsewhere, because THE LIST IS
 * ALREADY COMPLETE: every active game of yours is read — the bound is the
 * twenty-games-at-once cap on playing, not a cap on reading — so there is no
 * second page for an in-memory slice to be wrong about. A Directory row could
 * not say the same, and does not sort.
 *
 * FINISHED IS THE ONE THAT PAGES, and the paragraph that used to stand here
 * said it could not. Its argument was that the BUCKETS cannot be decided in SQL:
 * which group a game is in depends on whose turn it is, the stored answer to that
 * is nullable, and a null there means "nobody has written one" rather than "it is
 * over" — see the head of `settledTurn.ts` — so a query cannot be trusted to
 * group by it. Every word of that is still true — and it is an argument about the
 * six, not about this one. "Not
 * active, and not an offer" IS answerable from columns, exactly and cheaply, and
 * it is the definition of this group; only the rows the engine has ended while
 * their row still says active need a replay, and those come in on the complete
 * half. See `myFinished.ts`, which reads the page, and `myGames.ts`, which
 * explains the split.
 *
 * So `?all=finished` is a page of twenty with the true count above it and the
 * way on to the older ones, rather than every finished game anybody has ever
 * played. It has to be: the whole-group read was costing 571 rows on the site
 * owner's own account, on the page he opens daily.
 *
 * ONE GROUP AT A TIME, and the way back is a link. Opening everything at once
 * is the page this cap exists to prevent; and a group that could be opened and
 * not closed is the one-directional fault only a return trip finds.
 */
const SHOWN: Record<MyGameGroup, number> = {
  /*
   * Every offer, always. They are the shortest group on the page — nobody is
   * asked for fifty games — and each one is a person waiting on an answer, so
   * a cap here would hide a question rather than trim a list. Same reasoning
   * as `yourMove`, which is the other group that is a debt.
   */
  offered: 50,
  yourMove: 50,
  theirMove: 20,
  /*
   * And every offer you have SENT, for a reason the others do not share: this
   * group holds the declines, and a decline is the one thing on this page
   * somebody has to be told. Capping it could hide "Hanachan declined" behind
   * five offers made since, which is the only way this feature can fail
   * silently.
   */
  offerSent: 50,
  unstarted: 10,
  hotSeat: 5,
  /*
   * The same five it has always shown, declared where the READ is bounded rather
   * than here, because it is a `take` now and not a slice. It is still in this
   * table so that a reader comparing the seven groups sees all seven numbers.
   */
  finished: MY_FINISHED_PAGE,
};

/**
 * The games this browser holds a seat in, as the queue the turn-based sites
 * taught: yours to move first, then the ones you are waiting on, the ones
 * nobody has started, and lately finished ones. Nothing is shown when there
 * is nothing to show — the lobby is not the place for an empty list.
 */
export async function MyGamesList({
  showAll = null,
  cursor = null,
}: {
  /**
   * The group the address asks to see whole, or null for the ordinary caps.
   *
   * A loose string rather than a `MyGameGroup`, because it comes off a URL and
   * has not been checked yet. `openedGroup` is the one place it becomes a group
   * — an unknown value opens nothing rather than throwing, since a stale link is
   * not something to put an error in front of somebody for.
   */
  showAll?: string | null;
  /**
   * Where the last page of the finished group ended, off the address.
   *
   * Only the finished group pages, so this is only ever read with
   * `?all=finished` — a cursor without it names a position in a list nobody has
   * asked to see. Unchecked here as well: `decodeCursor` refuses anything that
   * is not a cursor for this ordering and the list starts again, which is the
   * right answer to a stale link and the convention's one parameter answered by
   * carrying on rather than by a refusal.
   */
  cursor?: string | null;
} = {}) {
  const claims = seatClaims((await cookies()).getAll());
  const email = await currentEmail();
  if (claims.size === 0 && email === null) return null;
  const now = new Date();
  const memberId = await currentMemberId();
  const opened = openedGroup(showAll);
  const paging = opened === "finished" ? { limit: MY_FINISHED_PAGE_OPEN, cursor } : {};
  const queue = await fetchMyGames(claims, memberId, now, await keepFinishedDaysFor(email), paging);
  const { groups } = queue;
  const shown = MY_GAME_GROUPS.reduce((n, group) => n + groups[group].length, 0);
  /*
   * NOTHING AT ALL IS A CLAIM ABOUT THE WHOLE QUEUE, so a page that is empty
   * because it is past the END of one cannot make it. `opened === null` is what
   * keeps the two apart: with no group opened this really is every group, and
   * with one opened an empty answer means "no more of those", which the opened
   * panel below says for itself. Without this a stale cursor would tell somebody
   * holding twenty games that nothing is waiting on them.
   */
  if (shown === 0 && opened === null) {
    if (email === null) return null;
    return (
      <section className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid="my-games-empty">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          <Paired en={MY_GAMES_COPY.title.label} kanji={MY_GAMES_COPY.title.kanji} kanjiClassName="text-sm font-normal opacity-70" />
        </h2>
        {/*
          THE ONE PLACE ON THIS PAGE THAT SHOULD OFFER A GAME, and it had a
          sentence with no way out of it. John raised it: /play is where a member
          lands, it lists the games they have going, and somebody with none was
          told what they could do rather than shown the door to it.
        */}
        <p className="text-sm text-muted">
          Nothing waiting on you yet.{" "}
          <Link href="/games/new" className="font-medium underline underline-offset-4" data-testid="empty-new-game">
            Set up a game 対局設定
          </Link>{" "}
          — pick the game, the board and who it is against, and nothing starts until you say so. Or challenge
          somebody from the{" "}
          <Link href="/players" className="underline underline-offset-4">players</Link> page, or take an open
          seat below.
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-4" data-testid="my-games">
      <h2 className="flex items-baseline gap-2 text-lg font-semibold">
        <Paired en={MY_GAMES_COPY.title.label} kanji={MY_GAMES_COPY.title.kanji} kanjiClassName="text-sm font-normal opacity-70" />
      </h2>
      {MY_GAME_GROUPS.map((group) => {
        const open = group === opened;
        const bucket =
          group === "finished"
            ? /*
               * A PAGE, so the total comes from the database and not from the
               * list's own length. See `pagedGroup`: the finished list is five
               * rows of however many there are, so counting the rows in hand
               * would print the cap as the total — which is the fault
               * `shownGroup` was written to make impossible, arriving by the
               * other door.
               */
              pagedGroup(groups.finished, queue.finished.total)
            : // Opened means no cap at all, which `shownGroup` says as the length itself.
              shownGroup(groups[group], open ? groups[group].length : SHOWN[group]);
        /*
         * AN OPENED GROUP DRAWS EVEN WHEN IT IS EMPTY, which is the site's rule
         * about empty tables and also the only way off the last page: a reader
         * who follows "older finished games" past the end must find the panel and
         * its way back, not a blank page with the heading gone.
         */
        return bucket.total === 0 && !open ? null : (
          <Group
            key={group}
            group={group}
            bucket={bucket}
            memberId={memberId}
            now={now}
            open={open}
            /*
             * The next page, for the one group that has one. Built here rather
             * than in the panel because the panel is given a bucket and knows
             * nothing about cursors, and only ever offered while the group is
             * open: on a closed panel "Show all" is the way in, and two links to
             * two different pages of the same list would be one too many.
             */
            more={open && group === "finished" && queue.finished.next !== null
              ? `/play?all=finished&cursor=${encodeURIComponent(queue.finished.next)}`
              : null}
          />
        );
      })}
    </section>
  );
}

/**
 * A group name off an address, checked — or null.
 *
 * Null for anything that is not one of the groups, which is what a stale or
 * hand-typed `?all=` is. Opening nothing is the right answer to that: the page
 * is the page either way, and a 404 or an error banner for a parameter nobody
 * typed on purpose would be an error the reader cannot act on.
 */
function openedGroup(asked: string | null): MyGameGroup | null {
  return MY_GAME_GROUPS.find((group) => group === asked) ?? null;
}

function Group({
  group,
  bucket,
  memberId,
  now,
  open,
  more = null,
}: {
  group: MyGameGroup;
  bucket: ShownGroup<MyGame>;
  /** Whose "see the rest" this is, when there is a rest and somewhere to send them for it. */
  memberId: string | null;
  now: Date;
  /** Whether the address has asked for this group whole. */
  open: boolean;
  /** Where the page after this one is, for the group that pages. Null for the six that do not. */
  more?: string | null;
}) {
  const copy = MY_GAMES_COPY.groups[group];
  return (
    <div className={`${PANEL_CLASS} flex flex-col gap-2`} data-testid={`my-games-${group}`}>
      <h3 className="flex items-baseline gap-2 text-[0.7rem] font-semibold tracking-[0.14em] text-muted uppercase">
        <Paired en={copy.label} kanji={copy.kanji} kanjiClassName="text-[0.8rem] font-normal tracking-normal" />
        <span className="font-normal tracking-normal" data-testid={`my-games-${group}-count`}>
          {bucket.hidden > 0 ? MY_GAMES_COPY.shownOf(bucket.total, bucket.items.length) : bucket.total}
        </span>
      </h3>
      <p className="text-xs text-muted">{copy.hint}</p>
      <ul className="flex flex-col gap-1.5">
        {bucket.items.map((item) => (
          <Row key={item.game.id} item={item} now={now} />
        ))}
      </ul>
      {/*
        NOTHING AT ALL WHEN THERE IS NOTHING TO OFFER, which is the ordinary case
        and the one worth protecting. A group inside its cap has no rest to show,
        is not the opened one, and has no record to point at — so this row is not
        drawn, and the panel is exactly the panel it was before any of this
        existed. An empty flex row would be a gap under every group on John's
        daily page, added by a feature that had nothing to say there.
      */}
      {bucket.hidden > 0 || open ? (
      <div className="flex flex-wrap items-center gap-4">
        {/*
          THE CAP, OPENED. "14 · showing 5" said fourteen and offered nine
          nowhere; this is the nine. It is a link and the group is in the
          address, so an opened group can be linked, reloaded and arrived back
          at — the same reasoning every filter on this site keeps.
        */}
        {bucket.hidden > 0 && !open ? (
          <Link
            href={`/play?all=${group}`}
            className="text-xs font-medium underline underline-offset-4"
            data-testid={`my-games-${group}-all`}
          >
            {MY_GAMES_COPY.showAll(bucket.total)}
          </Link>
        ) : null}
        {/*
          THE PAGE AFTER THIS ONE, for the finished group only. "Show all" above
          leads to the FIRST page of an opened group, so drawing both at once
          would be two links to two different pages of one list — which is why
          that one is hidden while this group is open.

          Forward only, and the way out is "Show fewer" rather than a page back:
          a cursor is a position in a list and not an index into one, so there is
          no previous page to name without keeping a stack of them in the
          address. Every page here is an address, so the browser's own Back works;
          and one click returns to the top of the group whatever page you reached.
        */}
        {more !== null ? (
          <Link
            href={more}
            className="text-xs font-medium underline underline-offset-4"
            /*
              `-older`, NOT `-more`: the record link below this row has been
              `my-games-finished-more` since it existed, and both of these are on
              the finished panel at once. Two controls under one test id is a
              spec that clicks whichever came first in the DOM and a `getByTestId`
              that fails on a strict-mode violation — found by grepping the real
              page's HTML for its ids, which is the only place the clash is
              visible: nothing about writing either line says the other exists.
            */
            data-testid={`my-games-${group}-older`}
          >
            {MY_GAMES_COPY.showOlder}
          </Link>
        ) : null}
        {/*
          And the way back, which is the half a one-directional control always
          forgets. Drawn only when this group is the opened one, so it is not a
          link that does nothing on every other panel.
        */}
        {open ? (
          <Link
            href="/play"
            className="text-xs font-medium underline underline-offset-4"
            data-testid={`my-games-${group}-fewer`}
          >
            {MY_GAMES_COPY.showFewer}
          </Link>
        ) : null}
        {/*
          Held-back finished games also have somewhere to be seen BESIDE this
          page: a signed-in member's own page counts every finished game, exactly
          what this bucket does — and it counts the ones past the window this
          list drops, which opening the group here cannot show. So it stays, and
          it is a different promise from the one above rather than a duplicate of
          it.
        */}
        {bucket.hidden > 0 && group === "finished" && memberId !== null ? (
          <Link
            href={playerPath("", memberId)}
            className="text-xs font-medium underline underline-offset-4"
            data-testid="my-games-finished-more"
          >
            {MY_GAMES_COPY.seeRecord}
          </Link>
        ) : null}
      </div>
      ) : null}
    </div>
  );
}
